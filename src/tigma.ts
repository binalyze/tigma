import "reflect-metadata"; // Should only be called once!!!
import { DI } from "./container.types";
import { configureContainer } from "./container.bindings";
import { ITigmaOptions } from "./engine/tigma-options.interface";
import { ITigmaEngine } from "./engine/tigma-engine.interface";
import { ILoggerService } from "./services/logger/logger.service.interface";

export function Tigma(options?: ITigmaOptions): ITigmaEngine {
  const container = configureContainer({
    logger: options?.logger,
  });

  const logger = container.get<ILoggerService>(DI.ILoggerService);
  const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

  logger.debug(`Tigma Engine successfully created`);

  return engine;
}
