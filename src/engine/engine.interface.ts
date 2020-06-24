import {SigmaRule} from "../rule/sigma-rule";
import {ObjectLiteral} from "../types/object-literal";
import {IEngineOptions} from "./engine-opts.interface";
import {Identifier} from "../rule/identifier";

export interface IEngine
{
    init(options: IEngineOptions): void;
    load(ruleContent: string): SigmaRule;
    parse(rule: SigmaRule): Identifier[];
    scan(rule: SigmaRule, json: ObjectLiteral): boolean;
}
