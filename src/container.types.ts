import {ILoggerService} from "./services/logger/logger.service.interface";

export const DI =
{
    ILoggerService: "ILoggerService",

    ITigmaEngine: "ITigmaEngine",

    ISigmaLoader: "ISigmaLoader",
    ISigmaScanner: "ISigmaScanner",
};

export interface IContainerOptions
{
    logger?: ILoggerService;
}
