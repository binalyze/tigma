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

            conditions.forEach((c:string) => {

                //
                // We have the condition group here. Possibilities are:
                // - selection
                // - selection.cond1
                //

                const reDotAccessorPattern = `(${c}\.\\w+)`;
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
            });

            this.logger.debug(`Re-written rule for lazy evaluation: ${lazyConditionExpression}`);

            /**
             * Filtrex only has 2 types and arrays of these:
             * - Number
             * - String
             */
            expression = compileExpression(lazyConditionExpression, options);

            const result = expression(json);

            this.logger.debug(`Rule '${rule.description}' detection result: ${result}`);

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

        const matched = this.matchCondition(json, identifierTree);

        return matched != null;
    }

    private matchCondition(json: ObjectLiteral, condition: Identifier): object
    {
        const multiple = condition.values.length > 1;

        //
        // Conditions are named by user and 'always' a Map type due to Case JSON structure
        // Thus, we should AND them all
        //

        let matched = null;

        for (let id in condition.values)
        {
            const identifier = condition.values[id] as Identifier;

            matched = this.filterByIdentifier(json, identifier);

            // If a section fails matching, we should not continue
            if (!matched)
            {
                return null;
            }
        }

        //
        // If multiple sections are provided we will match the case itself!
        //

        return (multiple) ? json : matched;
    }

    private matchPrimitive(source: Primitive, target: Primitive, modifiers: Modifier[]): boolean
    {
        let matched = false;

        if (modifiers.find((m:Modifier) => m.value === 'contains'))
        {
            //TODO(emre): Check type here
            matched = (target as string).indexOf(source as string) >= 0;
        }
        else if (modifiers.find((m:Modifier) => m.value === 'startswith'))
        {
            matched = (target as string).startsWith(source as string);
        }
        else if (modifiers.find((m:Modifier) => m.value === 'endswith'))
        {
            matched = (target as string).endsWith(source as string);
        }
        else
        {
            matched = source === target;
        }

        return matched;
    }

    private filterByPrimitive(json: any, identifier: Identifier): boolean
    {
        const target = json[identifier.name]; // Check if exists on target json

        if (target === undefined)
        {
            return false;
        }

        const all = identifier.modifiers.find((m:any) => m.value === 'all') != undefined;

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

    private filterByIdentifier(json: any, identifier: Identifier): any
    {
        if (!json)
        {
            return null;
        }

        const target = json[identifier.name];

        if (Array.isArray(target))
        {
            for (let idx in target)
            {
                const matched = this.filterByIdentifier(target[idx], identifier);

                // We are matching on all elements until one matches
                if (matched)
                {
                    return matched;
                }
            }

            return null;
        }

        let matched = null;

        for (let i in identifier.values)
        {
            const currentIdentifier = identifier.values[i] as Identifier;

            if (currentIdentifier.type === IdentifierType.Primitive)
            {
                if (this.filterByPrimitive(json, currentIdentifier))
                {
                    matched = json;
                }
            }
            else
            {
                matched = this.filterByIdentifier(json, currentIdentifier);
            }

            if (!matched)
            {
                return null;
            }
        }

        return matched;
    }
    //#endregion
}
