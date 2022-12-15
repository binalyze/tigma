import { LoggerService } from "./logger.service";
import { ILoggerService } from "./logger.service.interface";

describe("LoggerService", () => {
  let logger: ILoggerService;

  beforeEach(() => {
    logger = new LoggerService();
  });

  test("Debug messages should *not* be written when debug logging is not enabled", () => {
    const spy = jest.spyOn(console, "debug").mockImplementation(() => {});
    logger.setDebugLogging(false);
    logger.debug("This is a debug message");
    expect(spy).not.toBeCalled();
    spy.mockClear();
  });

  test("Debug messages should be written when debug logging is enabled", () => {
    const spy = jest.spyOn(console, "debug").mockImplementation(() => {});
    logger.setDebugLogging(true);
    logger.debug("This is a debug message");
    expect(spy.mock.calls[0][0]).toContain("This is a debug message");
    spy.mockClear();
  });

  test("Info messages should call console.info", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});
    logger.info("This is an info message");
    expect(spy.mock.calls[0][0]).toContain("This is an info message");
    spy.mockClear();
  });

  test("Warn messages should call console.warn", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("This is a warn message");
    expect(spy.mock.calls[0][0]).toContain("This is a warn message");
    spy.mockClear();
  });

  test("Warn messages should call console.error", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    logger.error("This is an error message");
    expect(spy.mock.calls[0][0]).toContain("This is an error message");
    spy.mockClear();
  });
});
