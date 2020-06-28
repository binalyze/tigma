import {inject, injectable} from "inversify";
import {ISigmaScanner} from "./sigma-scanner.interface";
import {DI} from "../../../container.types";
import {ILoggerService} from "../../logger/logger.service.interface";
import {SigmaRule} from "../../../rule/sigma-rule";
import {compileExpression} from "filtrex/src/filtrex";
import {Identifier, Primitive} from "../../../rule/identifier";
import {Modifier} from "../../../rule/modifier";
import {IdentifierType} from "../../../rule/identifier-type.enum";
import {Detection} from "../../../rule/detection";
import {ObjectLiteral} from "../../../types/object-literal";
import {ModifierValue} from "../../../rule/modifier-value.enum";
import {TypeUtils} from "../../../utils/type-utils";

@injectable()
export class SigmaScanner implements ISigmaScanner {
    constructor(
        @inject(DI.ILoggerService) private readonly logger: ILoggerService) {

    }

    public scan(rule: SigmaRule, json: ObjectLiteral) : boolean
    {
        const self = this;

        let expression: any;

        try
        {
            const detection: Detection = rule.detection;

            const conditions = detection.getConditionNames();
            const expandedCondition = detection.expandCondition();

            this.logger.debug(`Expression: ${rule.detection.condition}, Expanded: ${expandedCondition}, Conditions: ${conditions}`);

            const options = {
                extraFunctions: {
                    evaluateCondition: (conditionName:string) => self.evaluateCondition(rule, conditionName, json)
                }
            };

            //
            // Replace condition specifiers with lazyEvaluate so that we can take control
            // on each condition execution
            //
            let lazyConditionExpression = expandedCondition;

            for(let i in conditions)
            {
                const c = conditions[i];

                this.logger.debug(`Converting condition ${c} to lazy evaluator`);

                //
                // We have the condition group here. Possibilities are:
                // - selection
                // - selection.cond1
                //

                const reDotAccessorPattern = `(${c}\\.\\w+)`;
                const reGroupCondition =  new RegExp(reDotAccessorPattern);

                if(reGroupCondition.test(lazyConditionExpression))
                {
                    const reGlobal = new RegExp(reDotAccessorPattern, 'g');

                    const matches = lazyConditionExpression.match(reGlobal);

                    matches.forEach((m:string) => {
                        lazyConditionExpression = lazyConditionExpression.replace(m, `evaluateCondition("${m}")`);
                    });
                }
                else
                {
                    lazyConditionExpression = lazyConditionExpression.replace(c, `evaluateCondition("${c}")`);
                }
            }

            this.logger.debug(`Re-written rule for lazy evaluation: ${lazyConditionExpression}`);

            /**
             * Filtrex only has 2 types and arrays of these:
             * - Number
             * - String
             */
            expression = compileExpression(lazyConditionExpression, options);

            const result = expression(json);

            this.logger.debug(`Rule '${rule.title}' detection result: ${result}`);

            return result;
        }
        catch (e)
        {
            this.logger.error(`Exception compiling condition ${rule.detection.condition}: ${e.message}`);
            return false;
        }
    }

    //#region Utilities
    private evaluateCondition(rule: SigmaRule, conditionName: string, json: ObjectLiteral): boolean
    {
        this.logger.debug(`Running condition: ${JSON.stringify(conditionName)}`);
        this.logger.debug('---------------------------------------------------');

        const [group, child] = conditionName.split('.'); // May not have a sub group

        let condition: Record<string, object> = (rule.detection as any)[group];

        if(condition === undefined)
        {
            this.logger.error(`Rule ${rule.description} doesn't have a condition named ${conditionName}`);
            return false;
        }

        if(child)
        {
            condition = condition[child] as Record<string, object>;
        }

        if(condition === undefined)
        {
            this.logger.error(`Rule ${rule.description} doesn't have a condition named ${conditionName}`);
            return false;
        }

        const identifierTree = new Identifier(conditionName, condition);

        this.logger.debug(`Identifiers: ${JSON.stringify(identifierTree, null, 2)}`);

        return this.matchCondition(json, identifierTree);
    }

    private matchCondition(caseJSON: ObjectLiteral, condition: Identifier): boolean
    {
        let matchCount = 0;

        //
        // Conditions are named by user and 'always' a Map type due to Case JSON structure
        // Thus, we should AND them all
        //

        let matched = false;

        for (let id in condition.values)
        {
            const sectionIdentifier = condition.values[id] as Identifier;

            matched = this.filterByIdentifier(caseJSON, sectionIdentifier);

            this.logger.debug(`Condition section ${sectionIdentifier.name} match result: ${matched}`);

            // If a section fails matching, we should not continue
            if (!matched)
            {
                return false;
            }
            else
            {
                matchCount++;
            }
        }

        //
        // If multiple sections are provided we will match the case itself!
        //

        return matchCount === condition.values.length;
    }

    private getModifier(list: Modifier[], modifierValue: ModifierValue): Modifier|null
    {
        const found = list.find((m:Modifier) => m.value === modifierValue);

        if(!found)
        {
            return null;
        }

        return found;
    }

    private shouldNegate(modifiers: Modifier[])
    {
        // We assume there won't be weird negations combined
        return modifiers.find((m: Modifier) => m.negate === true) !== undefined;
    }

    private matchString(sourceParam: string, targetParam: string, modifiers: Modifier[]): boolean
    {
        const source = sourceParam?.toLowerCase();
        const target = targetParam?.toLowerCase();

        let modifier: Modifier = null;
        let matched = false;

        if(source.indexOf('*') >= 0 || source.indexOf('?') >= 0)
        {
            // Convert wildcard to regex
            const reWildcard = new RegExp('^' + source.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

            matched = reWildcard.test(target);
        }
        else
        {
            if ((modifier = this.getModifier(modifiers, ModifierValue.Contains)) != null)
            {
                matched = target?.indexOf(source) >= 0 ?? false;
            }
            else if ((modifier = this.getModifier(modifiers, ModifierValue.StartsWith)) != null)
            {
                matched = target?.startsWith(source) ?? false;
            }
            else if ((modifier = this.getModifier(modifiers, ModifierValue.EndsWith)) != null)
            {
                matched = target?.endsWith(source) ?? false;
            }
            else
            {
                matched = source === target;
            }
        }

        return (modifier?.negate) ? !matched : matched;
    }

    private matchPrimitive(source: Primitive, target: Primitive, modifiers: Modifier[]): boolean
    {
        let matched = false;

        const type = typeof target;

        switch (type)
        {
            case "string":
                matched = this.matchString(source as string, target as string, modifiers);
                break;
            case "number":
            case "boolean":
            default: // covers null value
                matched = source === target;
        }

        this.logger.debug(`Source ${source} == Target ${target} = ${matched}`);

        return matched;
    }

    private filterByPrimitive(json: any, identifier: Identifier): boolean
    {
        this.logger.debug(`Filter primitive ${JSON.stringify(json)} => ${JSON.stringify(identifier)}`);

        const target = json[identifier.name]; // Check if exists on target json

        if (target === undefined)
        {
            return false;
        }

        const all = this.getModifier(identifier.modifiers, ModifierValue.All);

        let matchCount = 0;

        for (let i in identifier.values)
        {
            const value = identifier.values[i] as Primitive;

            const matched = this.matchPrimitive(value, target, identifier.modifiers);

            if (matched)
            {
                matchCount++;

                if (!all)
                {
                    // No need to match all. We can complete here.
                    return true;
                }
            }
            else
            {
                if (all)
                {
                    // One match failed. No need to continue matching...
                    return false;
                }
            }
        }

        return (all) ? matchCount === identifier.values.length : matchCount > 0;
    }

    private filterByIdentifier(json: ObjectLiteral, identifier: Identifier): boolean
    {
        if (!json)
        {
            this.logger.debug(`Undefined json provided for matching with identifier ${JSON.stringify(identifier)}`);
            return false;
        }

        const target = json[identifier.name];

        if (TypeUtils.isArray(target))
        {
            // JSON property is an array. Recurse for each member
            for (let idx in target)
            {
                const matched = this.filterByIdentifier(target[idx], identifier);

                // We are matching on all elements until one matches
                if (matched)
                {
                    return matched;
                }
            }

            // None matched, return false
            return false;
        }

        let matched = false;

        for (let i in identifier.values)
        {
            const currentIdentifier = identifier.values[i] as Identifier;

            if (currentIdentifier.type === IdentifierType.Primitive)
            {
                matched = this.filterByPrimitive(json, currentIdentifier);
            }
            else
            {
                matched = this.filterByIdentifier(json, currentIdentifier);
            }

            this.logger.debug(`Match result for ${currentIdentifier.name} is ${matched}`);

            if (!matched)
            {
                //
                // One identifier not matched, let's check the type or 'all' modifier to decide
                // this should break the chain or not.
                //
                if(this.getModifier(identifier.modifiers, ModifierValue.All) ||
                   identifier.type === IdentifierType.Map)
                {
                    return false;
                }
            }
        }

        return matched;
    }
    //#endregion
}
