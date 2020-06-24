import {DI} from "../../../container.types";
import {ISigmaLoader} from "./sigma-loader.interface";
import {configureTestContainer, testContainer} from "../../../../test/container.bindings";
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

        sigmaLoader = testContainer.get(DI.ISigmaLoader);
    });

    test('Should throw exception for empty files', () =>
    {
        const rule = sigmaLoader.load(null);
        expect(rule).toBeNull();
    });

    test('Should throw exception for invalid YAML files', () =>
    {
        const rule = sigmaLoader.load('some invalid');
        expect(rule).toBeNull();
    });

    test('Should succeed for Minimal Sigma file', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule-minimal.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rule: SigmaRule = sigmaLoader.load(ruleContent);
        expect(rule.title).toBe('Minimal Rule');
        expect(rule.detection).toBeInstanceOf(Detection);
        expect(rule.logsource).toBeInstanceOf(LogSource);
    });

    test('Should succeed for a valid Sigma file', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rule = sigmaLoader.load(ruleContent);
        expect(rule.title).toBe('Valid Rule');
        expect(rule.description).toBe('Just a sample valid rule');
    });

    test('Should fail when a required property not present', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule-missing-property.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rule: SigmaRule = sigmaLoader.load(ruleContent);
        expect(rule).toBeNull();
    });

    test('Should fail for multiple document files', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-multiple.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const rule: SigmaRule = sigmaLoader.load(ruleContent);
        expect(rule).toBeNull();
    });
});
