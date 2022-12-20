export interface ILoggerService
{
    setDebugLogging(enabled: boolean): void;
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
