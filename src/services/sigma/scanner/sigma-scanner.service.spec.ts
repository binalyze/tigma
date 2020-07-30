import * as path from "path";
import * as fs from "fs";
import {configureTestContainer} from "../../../../test/container.bindings";
import {DI} from "../../../container.types";
import {setDefaultBindings} from "../../../container.bindings";
import {ISigmaScanner} from "./sigma-scanner.interface";
import {ISigmaLoader} from "../loader/sigma-loader.interface";
import {testCaseJSON} from "../../../../test/case";
import {ILoggerService} from "../../logger/logger.service.interface";

describe('Sigma Scanner', () =>
{
    const container = configureTestContainer();
    setDefaultBindings(container);
    const yamlDir = path.resolve(__dirname, "../../../../test/sigma");
    let scanner: ISigmaScanner;

    beforeEach(() =>
    {
        scanner = container.get(DI.ISigmaScanner);
    });

    test('Scanning group conditions should succeed', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-multiple-group.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(ruleContent);

        const result = scanner.scan(rule, testCaseJSON);

        expect(result).not.toBe(null);
    });

    test('Invalid condition groups should output error message', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-multiple-group.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(ruleContent);

        rule[0].detection.condition = 'some invalid 2020 2029 12313';

        const logger = container.get<ILoggerService>(DI.ILoggerService);

        const spy = jest.spyOn(logger, 'error');
        scanner.scan(rule, testCaseJSON);

        expect(spy.mock.calls[0][0]).toContain('Lazy condition looks erroneous');

        spy.mockClear();
    });

    test('Invalid condition names should output error', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-multiple-group.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(ruleContent);

        rule[0].detection.condition = 'invalid';

        const logger = container.get<ILoggerService>(DI.ILoggerService);

        const spy = jest.spyOn(logger, 'error');
        scanner.scan(rule, testCaseJSON);

        expect(spy.mock.calls[0][0]).toContain('Lazy condition looks erroneous');

        spy.mockClear();
    });

    test('Not matching rule should return as early as possible', () =>
    {
        const filePath = path.resolve(yamlDir, "not-matching.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        scanner.scan(rule, testCaseJSON);
    });

    test('Wildcard matching should succeed', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-wildcard.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).not.toBe(null);
    });

    test('Modifiers should be handled properly', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-modifiers.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).not.toBe(null);
    });

    test('Invalid property matching', () =>
    {
        const filePath = path.resolve(yamlDir, "invalid-prop.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).toBe(null);
    });

    test('Invalid case section should return false', () =>
    {
        const filePath = path.resolve(yamlDir, "invalid-case-section.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, null);
        expect(result).toBe(null);
    });

    test('Failing one item should fail when "all" modifier is in use', () =>
    {
        const filePath = path.resolve(yamlDir, "all-modifier.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).toBe(null);
    });

    test('RE modifier should succeed', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-re.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).not.toBe(null);
    });

    test('Undefined or null properties should succeeed', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-undefined-prop.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).toBe(null);
    });

    test('Undefined or null properties should succeeed when negated', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-scan-undefined-prop-negate.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).toBe(null);
    });

    test('One non-matching element should break the chain', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule-break-all-chain.yaml");
        const content = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rule = loader.load(content);

        const result = scanner.scan(rule, testCaseJSON);
        expect(result).toBe(null);
    });
});
