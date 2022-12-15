import { ILoggerService } from "./logger.service.interface";
import { injectable } from "inversify";

@injectable()
export class LoggerService implements ILoggerService {
  private debugLoggingEnabled: boolean = false;

  setDebugLogging(enabled: boolean): void {
    this.debugLoggingEnabled = enabled;
  }

  debug(message: string): void {
    if (this.debugLoggingEnabled !== true) {
      return;
    }

    console.debug(`Binalyze DEBUG: ${message}`);
  }

  info(message: string): void {
    console.info(`Binalyze INFO: ${message}`);
  }

  warn(message: string): void {
    console.warn(`Binalyze WARN: ${message}`);
  }

  error(message: string): void {
    console.error(`Binalyze ERROR: ${message}`);
  }
}
