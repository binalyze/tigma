import * as YAML from "yaml";
import {SigmaRule} from "../../../rule/sigma-rule";
import {inject, injectable} from "inversify";
import {DI} from "../../../container.types";
import {ILoggerService} from "../../logger/logger.service.interface";
import {ISigmaLoader} from "./sigma-loader.interface";
import {validateSync} from "class-validator";
import {plainToClass} from "class-transformer";

@injectable()
export class SigmaLoader implements ISigmaLoader
{
    constructor(
        @inject(DI.ILoggerService) private readonly logger: ILoggerService)
    {}

    load(ruleContent: string) : SigmaRule|null
    {
        let json: any = null;

        try
        {
            json = YAML.parse(ruleContent);
        }
        catch (e)
        {
            this.logger.error(`Exception parsing rule with YAML parser: ${e.message}`);
            return null;
        }

        if(typeof json !== 'object')
        {
            this.logger.error(`YAML parser for ${ruleContent} returned unexpected result ${JSON.stringify(json, null, 2)}`);
            return null;
        }

        let rule: SigmaRule = plainToClass(SigmaRule, json);

        const errors = validateSync(rule);

        if(errors.length >= 1)
        {
            this.logger.error(`Sigma rule validation failed: ${errors}`);
            return null;
        }

        return rule;
    }
}
