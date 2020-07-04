import {DI} from "../../../container.types";
import {ISigmaLoader} from "./sigma-loader.interface";
import {configureTestContainer} from "../../../../test/container.bindings";
import {Container} from "inversify";
import {SigmaLoader} from "./sigma-loader.service";
import * as fs from "fs";
import * as path from "path";
import {SigmaRule} from "../../../rule/sigma-rule";
import {Detection} from "../../../rule/detection";
import {LogSource} from "../../../rule/log-source";

describe('Sigma Loader', () =>
{
    let container: Container;
    let sigmaLoader: ISigmaLoader;
    const yamlDir = path.resolve(__dirname, "../../../../test/sigma");

    beforeAll(() =>
    {
        container = configureTestContainer();
        container.bind(DI.ISigmaLoader).to(SigmaLoader);

        sigmaLoader = container.get(DI.ISigmaLoader);
    });

    test('Should throw exception for empty files', () =>
    {
        const rule = sigmaLoader.load(null);
        expect(rule).toBeNull();
    });

    test('Should return null for invalid YAML files', () =>
    {
        const rules = sigmaLoader.load('some invalid');
        expect(rules).toBeNull();
    });

    test('Should succeed for Minimal Sigma file', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule-minimal.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules: SigmaRule[] = sigmaLoader.load(ruleContent);
        expect(rules[0].title).toBe('Minimal Rule');
        expect(rules[0].detection).toBeInstanceOf(Detection);
        expect(rules[0].logsource).toBeInstanceOf(LogSource);
    });

    test('Should succeed for a valid Sigma file', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules = sigmaLoader.load(ruleContent);
        expect(rules[0].title).toBe('Valid Rule');
        expect(rules[0].description).toBe('Just a sample valid rule');
    });

    test('Should fail when a required property not present', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule-missing-property.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules: SigmaRule[] = sigmaLoader.load(ruleContent);
        expect(rules).toBeNull();
    });

    test('Should succeed for multiple document files', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-multiple.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rules: SigmaRule[] = sigmaLoader.load(ruleContent);
        expect(rules).not.toBeNull();
    });
});
