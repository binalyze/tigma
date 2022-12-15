import { ITigmaEngine } from "./tigma-engine.interface";
import { SigmaRule } from "../rule/sigma-rule";
import { ObjectLiteral } from "../types/object-literal";
import { inject, injectable } from "inversify";
import { DI } from "../container.types";
import { ILoggerService } from "../services/logger/logger.service.interface";
import { ITigmaOptions } from "./tigma-options.interface";
import { ISigmaLoader } from "../services/sigma/loader/sigma-loader.interface";
import { ISigmaScanner } from "../services/sigma/scanner/sigma-scanner.interface";

@injectable()
export class TigmaEngine implements ITigmaEngine {
  private options: ITigmaOptions = {};

  constructor(
    @inject(DI.ILoggerService) private readonly logger: ILoggerService,
    @inject(DI.ISigmaLoader) private readonly loader: ISigmaLoader,
    @inject(DI.ISigmaScanner) private readonly scanner: ISigmaScanner
  ) {}

  init(options: ITigmaOptions): void {
    this.options = options;
  }

  load(ruleContent: string): SigmaRule[] | null {
    if (!ruleContent || ruleContent.length === 0) {
      this.logger.error(`Empty rule yaml provided!`);
      return null;
    }

    return this.loader.load(ruleContent);
  }

  scan(rules: SigmaRule[], json: ObjectLiteral): Record<string, object> | null {
    return this.scanner.scan(rules, json);
  }
}
