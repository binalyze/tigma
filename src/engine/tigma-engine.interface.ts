import {SigmaRule} from "../rule/sigma-rule";
import {ObjectLiteral} from "../types/object-literal";
import {ITigmaOptions} from "./tigma-options.interface";

export interface ITigmaEngine
{
    init(options: ITigmaOptions): void;
    load(ruleContent: string): SigmaRule[];
    scan(rules: SigmaRule[], json: ObjectLiteral): Record<string, object>|null;
}
