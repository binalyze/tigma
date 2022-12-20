import {SigmaRule} from "../../../rule/sigma-rule";
import {ObjectLiteral} from "../../../types/object-literal";

export interface ISigmaScanner
{
    scan(rules: SigmaRule[], json: ObjectLiteral): Record<string, object>;
}
