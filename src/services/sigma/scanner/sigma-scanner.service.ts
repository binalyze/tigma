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
import {ModifierType} from "../../../rule/modifier-type.enum";
import {TypeUtils} from "../../../utils/type-utils";
import * as _ from "lodash";

@injectable()
export class SigmaScanner implements ISigmaScanner {
    constructor(
        @inject(DI.ILoggerService) private readonly logger: ILoggerService) {

    }

    public scan(rules: SigmaRule[], json: ObjectLiteral) : boolean
    {
        for (let i in rules)
        {
            const rule = rules[i];

            if(this.scanRule(rule, json))
            {
                return true;
            }
        }

        return false;
    }

    //#region Utilities
    private scanRule(rule: SigmaRule, json: ObjectLiteral) : boolean
    {
        const self = this;

        let expression: any;

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

        if(lazyConditionExpression.indexOf('evaluateCondition') === -1)
        {
            this.logger.error(`Lazy condition looks erroneous due to the lack of lazy evaluation function: ${lazyConditionExpression}`);
            return false;
        }

        /**
         * Filtrex only has 2 types and arrays of these:
         * - Number
         * - String
         */
        expression = compileExpression(lazyConditionExpression, options);

        const result = expression(json);

        this.logger.debug(`Rule '${rule.title}' detection result: ${result}`);

        //
        // Filtrex: For single conditions result is true, for multiple groups it will return 1
        //
        return result === true || result === 1;
    }

    private evaluateCondition(rule: SigmaRule, conditionName: string, json: ObjectLiteral): boolean
    {
        this.logger.debug(`Running condition: ${JSON.stringify(conditionName)}`);
        this.logger.debug('---------------------------------------------------');

        const [group, child] = conditionName.split('.'); // May not have a sub group

        let condition: Record<string, object> = (rule.detection as any)[group];

        if(child)
        {
            condition = condition[child] as Record<string, object>;
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

    private getModifier(list: Modifier[], modifierValue: ModifierType): Modifier|null
    {
        const found = list.find((m:Modifier) => m.type === modifierValue);

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

        if ((modifier = this.getModifier(modifiers, ModifierType.Contains)) != null)
        {
            matched = target?.indexOf(source) >= 0 ?? false;
        }
        else if ((modifier = this.getModifier(modifiers, ModifierType.StartsWith)) != null)
        {
            matched = target?.startsWith(source) ?? false;
        }
        else if ((modifier = this.getModifier(modifiers, ModifierType.EndsWith)) != null)
        {
            matched = target?.endsWith(source) ?? false;
        }
        else if((modifier = this.getModifier(modifiers, ModifierType.Equals)) != null ||
                (modifier = this.getModifier(modifiers, ModifierType.Eq)) != null)
        {
            matched = source === target;
        }
        else if ((modifier = this.getModifier(modifiers, ModifierType.Re)) != null)
        {
            const re = new RegExp(source);

            return re.test(target);
        }
        else
        {
            const matches = source.match(/[\\]?[\\]?[*?]/g);

            const notEscaped = matches?.filter((m) => m !== '\\*' && m !== '\\?');

            if(_.some(notEscaped))
            {
                //
                // Convert wildcard to regex
                //
                const reWildcard = new RegExp('^' + source.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

                return reWildcard.test(target);
            }
            else
            {
                matched = source === target;
            }
        }

        return matched;
    }

    private matchNumber(source: number, target: number, modifiers: Modifier[]): boolean
    {
        let modifier: Modifier = null;
        let matched = false;

        if ((modifier = this.getModifier(modifiers, ModifierType.LessThan)) != null)
        {
            matched = target < source;
        }
        else if ((modifier = this.getModifier(modifiers, ModifierType.LessThanOrEqual)) != null)
        {
            matched = target <= source;
        }
        else if ((modifier = this.getModifier(modifiers, ModifierType.GreaterThan)) != null)
        {
            matched = target > source;
        }
        else if ((modifier = this.getModifier(modifiers, ModifierType.GreaterThanOrEqual)) != null)
        {
            matched = target >= source;
        }
        else
        {
            matched = source === target;
        }

        return matched;
    }

    private matchBoolean(source: boolean, target: boolean): boolean
    {
        return source === target;
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
                matched = this.matchNumber(source as number, target as number, modifiers);
                break;
            case "boolean":
                matched = this.matchBoolean(source as boolean, target as boolean);
                break;
            default: // covers null value
                matched = source === target;
                break;
        }

        return this.shouldNegate(modifiers) ? !matched : matched;
    }

    private filterByPrimitive(json: any, identifier: Identifier): boolean
    {
        const target = json[identifier.name]; // Check if exists on target json

        if (target === undefined)
        {
            return false;
        }

        const all = this.getModifier(identifier.modifiers, ModifierType.All);

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
                if(this.getModifier(identifier.modifiers, ModifierType.All) || identifier.type === IdentifierType.Map)
                {
                    return false;
                }
            }
        }

        return matched;
    }
    //#endregion
}
