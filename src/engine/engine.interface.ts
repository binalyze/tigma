import {SigmaRule} from "../rule/sigma-rule";
import {ObjectLiteral} from "../types/object-literal";
import {IEngineOptions} from "./engine-opts.interface";

export interface IEngine
{
    init(options: IEngineOptions): void;
    load(ruleContent: string): SigmaRule[];
    scan(rules: SigmaRule[], json: ObjectLiteral): Map<string, object>|null;
}
