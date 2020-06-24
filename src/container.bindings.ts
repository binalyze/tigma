/* istanbul ignore file */
import {Container} from "inversify";
import {DI, IContainerOptions} from "./container.types";
import {LoggerService} from "./services/logger/logger.service";
import {SigmaLoader} from "./services/sigma/loader/sigma-loader.service";
import {SigmaScanner} from "./services/sigma/scanner/sigma-scanner.service";
import {ISigmaLoader} from "./services/sigma/loader/sigma-loader.interface";
import {ISigmaScanner} from "./services/sigma/scanner/sigma-scanner.interface";
import {ILoggerService} from "./services/logger/logger.service.interface";
import {IEngine} from "./engine/engine.interface";
import {Engine} from "./engine/engine";

const container: Container = new Container();

function setDefaultBindings()
{
    container.bind<IEngine>(DI.IEngine).to(Engine);
    container.bind<ISigmaLoader>(DI.ISigmaLoader).to(SigmaLoader);
    container.bind<ISigmaScanner>(DI.ISigmaScanner).to(SigmaScanner);
}

export function configureContainer(options?: IContainerOptions): Container
{
    if(options?.logger) {
        container.bind<ILoggerService>(DI.ILoggerService).toConstantValue(options.logger);
    } else {
        container.bind<ILoggerService>(DI.ILoggerService).toConstantValue(new LoggerService());
    }

    setDefaultBindings();

    return container;
}
