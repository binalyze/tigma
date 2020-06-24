import {Container} from "inversify";
import {DI} from "../src/container.types";
import {ILoggerService} from "../src/services/logger/logger.service.interface";
import {MockLoggerService} from "./mocks/logger.service.mock";

export const testContainer = new Container();

export function configureTestContainer(): Container
{
    const logger = new MockLoggerService();

    testContainer.bind<ILoggerService>(DI.ILoggerService).toConstantValue(logger);

    return testContainer;
}
