import {ILoggerService} from "./services/logger/logger.service.interface";

export const DI =
{
    ILoggerService: "ILoggerService",

    IEngine: "IEngine",

    ISigmaLoader: "ISigmaLoader",
    ISigmaScanner: "ISigmaScanner",
};

export interface IContainerOptions
{
    logger?: ILoggerService;
}
