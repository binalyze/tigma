import {IEngine} from "./engine.interface";
import {SigmaRule} from "../rule/sigma-rule";
import {ObjectLiteral} from "../types/object-literal";
import {inject, injectable} from "inversify";
import {DI} from "../container.types";
import {ILoggerService} from "../services/logger/logger.service.interface";
import {IEngineOptions} from "./engine-opts.interface";
import {ISigmaLoader} from "../services/sigma/loader/sigma-loader.interface";
import {ISigmaScanner} from "../services/sigma/scanner/sigma-scanner.interface";
import {Identifier} from "../rule/identifier";

@injectable()
export class Engine implements IEngine
{
    private options: IEngineOptions = {};

    constructor(
       @inject(DI.ILoggerService) private readonly logger: ILoggerService,
       @inject(DI.ISigmaLoader) private readonly loader: ISigmaLoader,
       @inject(DI.ISigmaScanner) private readonly scanner: ISigmaScanner)
    {
        this.logger.info(`Sigma Engine created`);
    }

    init(options: IEngineOptions): void
    {
        this.options = options;
    }

    load(ruleContent: string): SigmaRule|null
    {
        if(!ruleContent || ruleContent.length === 0)
        {
            this.logger.error(`Empty rule yaml provided!`);
            return null;
        }

        return this.loader.load(ruleContent);
    }

    parse(rule: SigmaRule): Identifier[]
    {
        const list: Identifier[] = [];

        const names = rule.detection.getConditionNames();

        names.forEach(n =>
        {
            const tree = new Identifier(n, rule.detection.getConditionByName(n));

            list.push(tree);
        });

        return list;
    }

    scan(rule: SigmaRule, json: ObjectLiteral): boolean
    {
        return this.scanner.scan(rule, json);
    }
}
