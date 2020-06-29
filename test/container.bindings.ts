import {Container} from "inversify";
import {DI} from "../src/container.types";
import {ILoggerService} from "../src/services/logger/logger.service.interface";
import {MockLoggerService} from "./mocks/logger.service.mock";
import {setDefaultBindings} from "../src/container.bindings";

export function configureTestContainer(): Container
{
    const container = new Container();

    const logger = new MockLoggerService();

    container.bind<ILoggerService>(DI.ILoggerService).toConstantValue(logger);

    return container;
}
