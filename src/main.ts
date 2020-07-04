import "reflect-metadata" // Should only be called once!!!
import {DI} from "./container.types";
import {configureContainer} from "./container.bindings";
import {IEngineOptions} from "./engine/engine-opts.interface";
import {IEngine} from "./engine/engine.interface";
import {ILoggerService} from "./services/logger/logger.service.interface";

function createEngine(options?: IEngineOptions): IEngine
{
  const container = configureContainer({
    logger: options?.logger
  });

  const logger = container.get<ILoggerService>(DI.ILoggerService);
  const engine = container.get<IEngine>(DI.IEngine);

  logger.info(`CreateEngine succeeded`);

  engine.load('an-invalid-rule');

  return engine;
}

export default createEngine;
