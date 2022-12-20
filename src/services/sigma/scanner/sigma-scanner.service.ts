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
export class SigmaScanner implements ISigmaScanner
{
    private matchedElements: Record<string, object>;

    constructor(
        @inject(DI.ILoggerService) private readonly logger: ILoggerService)
    {
        this.matchedElements = {};
    }

    public scan(rules: SigmaRule[], json: ObjectLiteral) : Record<string, object>
    {
        for (let i in rules)
        {
            const rule = rules[i];

            this.clearMatchedElements();

            if(this.scanRule(rule, json))
            {
                return this.matchedElements;
            }
        }

        return null;
    }

    //#region Utilities
    private clearMatchedElements()
    {
        this.matchedElements = {};
    }

    private addMatchedElement(section: string, element: object)
    {
        this.matchedElements[section] = element;
    }

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
        // Thus, we should AND them all!
        //

        let matched = false;

        for (let id in condition.values) // Example: Condition is "selection" whereas values are Processes, Prefetch and etc.
        {
            const sectionIdentifier = condition.values[id] as Identifier; // Example: sectionIdentifier = Processes

            const sectionJSON = caseJSON[sectionIdentifier.name];

            matched = this.filterByIdentifier(sectionJSON, sectionIdentifier, 0);

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
        const source = sourceParam.toLowerCase();
        const target = targetParam.toLowerCase();

        let matched = false;

        //
        // Evaluate operators
        //

        if ((this.getModifier(modifiers, ModifierType.Contains)) != null)
        {
            matched = target.indexOf(source) >= 0;
        }
        else if ((this.getModifier(modifiers, ModifierType.StartsWith)) != null)
        {
            matched = target.startsWith(source);
        }
        else if ((this.getModifier(modifiers, ModifierType.EndsWith)) != null)
        {
            matched = target.endsWith(source);
        }
        else if((this.getModifier(modifiers, ModifierType.Equals)) != null ||
                (this.getModifier(modifiers, ModifierType.Eq)) != null)
        {
            matched = source === target;
        }
        else if ((this.getModifier(modifiers, ModifierType.Re)) != null)
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
        let matched: boolean;

        if ((this.getModifier(modifiers, ModifierType.LessThan)) != null)
        {
            matched = target < source;
        }
        else if ((this.getModifier(modifiers, ModifierType.LessThanOrEqual)) != null)
        {
            matched = target <= source;
        }
        else if ((this.getModifier(modifiers, ModifierType.GreaterThan)) != null)
        {
            matched = target > source;
        }
        else if ((this.getModifier(modifiers, ModifierType.GreaterThanOrEqual)) != null)
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
        let matched: boolean;

        const targetType: string = typeof target;
        const sourceType: string = typeof source;

        if(sourceType === targetType)
        {
            switch (targetType)
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
        }
        else
        {
            //
            // Handle in-consistent source and destination types.
            // Rule may have boolean whereas JSON having a number
            // Examples:
            // FileExists: 1 vs true
            // DigitalSignStatus: 0 vs false
            // SourcePort: 80 vs "80"
            //

            if(sourceType === "boolean")
            {
                matched = (source) ? (target > 0)
                                   : (target === 0);
            }
            else if(sourceType === "number" && targetType === "string")
            {
                const targetNumber = parseInt(target as string);

                if(!isNaN(targetNumber))
                {
                    matched = this.matchNumber(source as number, targetNumber, modifiers);
                }
            }
            else if(sourceType === "string" && targetType === "number")
            {
                const sourceNumber = parseInt(source as string);

                if(!isNaN(sourceNumber))
                {
                    matched = this.matchNumber(sourceNumber, target as number, modifiers);
                }
            }
        }

        return this.shouldNegate(modifiers) ? !matched : matched;
    }

    private filterByPrimitive(target: any, identifier: Identifier): boolean
    {
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

    private filterByIdentifier(json: object|object[], identifier: Identifier, depth: number): boolean
    {
        if (!json)
        {
            this.logger.debug(`Undefined target provided for matching with identifier ${JSON.stringify(identifier)}`);
            return false;
        }

        let matched = false;

        if(TypeUtils.isArray(json))
        {
            const jsonArray = json as object[];

            for(let i in jsonArray)
            {
                const jsonElement = jsonArray[i];

                matched = this.filterByIdentifier(jsonElement, identifier, depth);

                if(matched)
                {
                    return true;
                }
            }

            return false;
        }

        this.logger.debug(`Matching identifier ${identifier.name} on target: ${JSON.stringify(json)}`);

        for (let i in identifier.values)
        {
            const subIdentifier = identifier.values[i] as Identifier;

            this.logger.debug(`Matching sub-identifier ${subIdentifier.name} on target: ${JSON.stringify(json)}`);

            const jsonElement = (json as any)[subIdentifier.name];

            if (subIdentifier.type === IdentifierType.Primitive)
            {
                matched = this.filterByPrimitive(jsonElement, subIdentifier);
            }
            else
            {
                matched = this.filterByIdentifier(jsonElement, subIdentifier, depth + 1);
            }

            this.logger.debug(`Match result for ${subIdentifier.name} is ${matched}`);

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

        if(matched && depth === 0)
        {
            this.addMatchedElement(identifier.name, json);
        }

        return matched;
    }
    //#endregion
}
