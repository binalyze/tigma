import * as YAML from "yaml";
import {SigmaRule} from "../../../rule/sigma-rule";
import {inject, injectable} from "inversify";
import {DI} from "../../../container.types";
import {ILoggerService} from "../../logger/logger.service.interface";
import {ISigmaLoader} from "./sigma-loader.interface";
import {validateSync} from "class-validator";
import {plainToClass} from "class-transformer";
import {TypeUtils} from "../../../utils/type-utils";
import {ObjectLiteral} from "../../../types/object-literal";
import {Action} from "../../../rule/action.enum";
import * as _ from "lodash";

@injectable()
export class SigmaLoader implements ISigmaLoader
{
    constructor(
        @inject(DI.ILoggerService) private readonly logger: ILoggerService)
    {}

    load(ruleContent: string) : SigmaRule[]|null
    {

        if(!ruleContent || ruleContent.length === 0) {
            this.logger.error(`Empty rule yaml provided!`);
            throw new Error(`Empty rule yaml provided!`);
        }
        let rules: SigmaRule[] = [];
        let json: any = null;

        try
        {
            json = (ruleContent.indexOf('action:') >= 0) ? YAML.parseAllDocuments(ruleContent)
                                                         : YAML.parse(ruleContent);
        }
        catch (e)
        {
            this.logger.error(`Exception parsing rule with YAML parser: ${e.message}`);
            throw e;
        }

        if(TypeUtils.isArray(json))
        {
            let globalDocument: ObjectLiteral = null;

            for(let id in json)
            {
                const document = json[id].toJSON();

                switch (document.action)
                {
                    case Action.Global:
                        //
                        // Global action should not be treated as a rule.
                        // Save it to global variable and continue...
                        //
                        globalDocument = TypeUtils.deepCopy(document);
                        continue;

                    case Action.Reset:
                        globalDocument = null;
                        break;

                    case Action.Repeat:
                        const previousId = parseInt(id) - 1;
                        globalDocument = TypeUtils.deepCopy(json[previousId].toJSON());
                        break;
                }

                if(globalDocument)
                {
                    const merged = _.merge(globalDocument, document);

                    const rule = this.jsonToRule(merged);

                    rules.push(rule);
                }
                else
                {
                    const rule = this.jsonToRule(document);

                    rules.push(rule);
                }
            }
        }
        else
        {
            const rule = this.jsonToRule(json);

            if(!rule)
            {
                return null;
            }

            rules.push(rule);
        }

        return rules;
    }

    private jsonToRule(json: any): SigmaRule|null
    {
        let rule: SigmaRule = plainToClass(SigmaRule, json);

    if (typeof rule !== "object") {
      this.logger.error(
        `Rule parsing returned with unexpected type: ${typeof rule}`
      );
      throw new Error(
        `Rule parsing returned with unexpected type  ${typeof rule}`
      );
    }

        const errors = validateSync(rule);

        if(errors.length >= 1)
        {
            this.logger.error(`Sigma rule validation failed: ${errors}`);
            throw errors
        }

        return rule;
    }
}
