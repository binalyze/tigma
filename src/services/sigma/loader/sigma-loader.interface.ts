import {SigmaRule} from "../../../rule/sigma-rule";

export interface ISigmaLoader
{
    load(ruleContent: string) : SigmaRule|null;
}
