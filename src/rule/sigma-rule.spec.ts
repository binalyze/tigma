import * as path from "path";
import {configureTestContainer} from "../../test/container.bindings";
import {setDefaultBindings} from "../container.bindings";
import * as fs from "fs";
import {ISigmaLoader} from "../services/sigma/loader/sigma-loader.interface";
import {DI} from "../container.types";
import {SigmaRule} from "./sigma-rule";

describe("Sigma Rule", () =>
{
    const container = configureTestContainer();
    setDefaultBindings(container);
    const yamlDir = path.resolve(__dirname, "../../test/sigma");

    test('AST should succeed', () =>
    {
        const filePath = path.resolve(yamlDir, "valid-rule-minimal.yaml");
        const ruleContent = fs.readFileSync(filePath, "utf8");

        const loader = container.get<ISigmaLoader>(DI.ISigmaLoader);
        const rules: SigmaRule[] = loader.load(ruleContent);

        expect(rules).toHaveLength(1);

        const ast = rules[0].toAST();

        expect(ast[0].key).toBe("selection");
    });
});
