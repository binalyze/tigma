import {configureTestContainer} from "../../test/container.bindings";
import {Engine} from "./engine";
import {DI} from "../container.types";
import {SigmaLoader} from "../services/sigma/loader/sigma-loader.service";
import {SigmaScanner} from "../services/sigma/scanner/sigma-scanner.service";
import {Container} from "inversify";
import {IEngine} from "./engine.interface";
import * as path from "path";
import * as fs from "fs";
import {SigmaRule} from "../rule/sigma-rule";
import {ILoggerService} from "../services/logger/logger.service.interface";
import {Identifier} from "../rule/identifier";
import {testCaseJSON} from "../../test/case";

describe('Engine', () =>
{
   let container:Container = null;
   const yamlDir = path.resolve(__dirname, "../../test/sigma");

   beforeAll(() =>
   {
       container = configureTestContainer();

       container.bind(DI.ISigmaLoader).to(SigmaLoader);
       container.bind(DI.ISigmaScanner).to(SigmaScanner);
       container.bind(DI.IEngine).to(Engine);
   });

   test('Engine creation should succeed', () =>
   {
       const engine = container.get(DI.IEngine);
       expect(engine).toBeInstanceOf(Engine);
   });

    test('Engine.init should succeed', () =>
    {
        const engine = container.get<IEngine>(DI.IEngine);
        engine.init({});
    });

    test('Engine.load should succeed for a valid rule', () =>
    {
        const engine = container.get<IEngine>(DI.IEngine);

        const filePath = path.resolve(yamlDir, "valid-rule.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules = engine.load(ruleContent);
        expect(rules[0]).toBeInstanceOf(SigmaRule);
    });

    test('Engine.load should return null for an empty rule', () =>
    {
        const engine = container.get<IEngine>(DI.IEngine);

        const rules = engine.load('');
        expect(rules).toBe(null);
    });

    test('Engine.load should output error for an invalid rule', () =>
    {
        const engine = container.get<IEngine>(DI.IEngine);
        const logger = container.get<ILoggerService>(DI.ILoggerService);

        const ruleContent = "an-invalid-rule";

        const spy = jest.spyOn(logger, "error");

        const rules = engine.load(ruleContent);
        expect(rules).toBe(null);

        expect(spy.mock.calls[0][0]).toContain('unexpected result');

        spy.mockClear();
    });

    test('Engine.parse should succeed for a valid rule', () =>
    {
        const engine = container.get<IEngine>(DI.IEngine);

        const filePath = path.resolve(yamlDir, "valid-rule.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules = engine.load(ruleContent);
        expect(rules[0]).toBeInstanceOf(SigmaRule);

        const identifiers:Identifier[] = engine.parse(rules);
        expect(identifiers.length).toBe(3);
    });

    test('Engine.scan should succeed for a valid rule', () =>
    {
        const engine = container.get<IEngine>(DI.IEngine);

        const filePath = path.resolve(yamlDir, "valid-scan.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules = engine.load(ruleContent);

        const result = engine.scan(rules, testCaseJSON);
        expect(result).toBe(true);
    });
});
