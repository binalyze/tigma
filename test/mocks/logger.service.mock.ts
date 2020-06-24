import {ILoggerService} from "../../src/services/logger/logger.service.interface";

export class MockLoggerService implements ILoggerService
{
    debug(message: string): void {
    }

    error(message: string): void {
    }

    info(message: string): void {
    }

    setDebugLogging(enabled: boolean): void {
    }

    warn(message: string): void {
    }
}
