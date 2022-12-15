import { configureTestContainer } from "../../test/container.bindings";
import { TigmaEngine } from "./tigma-engine";
import { DI } from "../container.types";
import { SigmaLoader } from "../services/sigma/loader/sigma-loader.service";
import { SigmaScanner } from "../services/sigma/scanner/sigma-scanner.service";
import { Container } from "inversify";
import { ITigmaEngine } from "./tigma-engine.interface";
import * as path from "path";
import * as fs from "fs";
import { SigmaRule } from "../rule/sigma-rule";
import { ILoggerService } from "../services/logger/logger.service.interface";
import { testCaseJSON } from "../../test/case";

describe("Engine", () => {
  let container: Container = null;
  const yamlDir = path.resolve(__dirname, "../../test/sigma");

  beforeAll(() => {
    container = configureTestContainer();

    container.bind(DI.ISigmaLoader).to(SigmaLoader);
    container.bind(DI.ISigmaScanner).to(SigmaScanner);
    container.bind(DI.ITigmaEngine).to(TigmaEngine);
  });

  test("Engine creation should succeed", () => {
    const engine = container.get(DI.ITigmaEngine);
    expect(engine).toBeInstanceOf(TigmaEngine);
  });

  test("Engine.init should succeed", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);
    engine.init({});
  });

  test("Engine.load should succeed for a valid rule", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

    const filePath = path.resolve(yamlDir, "valid-rule.yaml");
    const ruleContent = fs.readFileSync(filePath, "utf8");

    const rules = engine.load(ruleContent);
    expect(rules[0]).toBeInstanceOf(SigmaRule);
  });

  test("Engine.load should return null for an empty rule", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

    const rules = engine.load("");
    expect(rules).toBe(null);
  });

  test("Engine.load should output error for an invalid rule", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);
    const logger = container.get<ILoggerService>(DI.ILoggerService);

    const ruleContent = "an-invalid-rule";

    const spy = jest.spyOn(logger, "error");

    const rules = engine.load(ruleContent);
    expect(rules).toBe(null);

    expect(spy.mock.calls[0][0]).toContain("unexpected");

    spy.mockClear();
  });

  test("Engine.parse should succeed for a valid rule", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

    const filePath = path.resolve(yamlDir, "valid-rule.yaml");
    const ruleContent = fs.readFileSync(filePath, "utf8");

    const rules = engine.load(ruleContent);
    expect(rules[0]).toBeInstanceOf(SigmaRule);
  });

  test("Engine.scan should succeed for a valid rule", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

    const filePath = path.resolve(yamlDir, "valid-scan.yaml");
    const ruleContent = fs.readFileSync(filePath, "utf8");

    const rules = engine.load(ruleContent);

    const result = engine.scan(rules, testCaseJSON);
    expect(result).not.toBe(null);
  });

  test("Engine.scan should match different types such as boolean ?= number", () => {
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

    const filePath = path.resolve(yamlDir, "valid-scan-different-types.yaml");
    const ruleContent = fs.readFileSync(filePath, "utf8");

    const rules = engine.load(ruleContent);

    const result = engine.scan(rules, testCaseJSON);
    expect(result).not.toBe(null);
  });
});
