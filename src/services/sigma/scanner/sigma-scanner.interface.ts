import {SigmaRule} from "../../../rule/sigma-rule";
import {ObjectLiteral} from "../../../types/object-literal";

export interface ISigmaScanner
{
    scan(rule: SigmaRule, json: ObjectLiteral) : boolean;
}
