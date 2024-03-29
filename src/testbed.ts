import "reflect-metadata" // Should only be called once!!!
import * as fs from "fs";
import {configureContainer} from "./container.bindings";
import {DI} from "./container.types";
import {SigmaLoader} from "./services/sigma/loader/sigma-loader.service";
import {SigmaRule} from "./rule/sigma-rule";
import {SigmaScanner} from "./services/sigma/scanner/sigma-scanner.service";
import {ILoggerService} from "./services/logger/logger.service.interface";
import {ITigmaEngine} from "./engine/tigma-engine.interface";
import * as path from "path";

const caseObj = {
    Processes: [
        {
            Name: 'csrss.exe',
            CommandLine: 'Some SharedSection=1024,20480',
            Modules: [
                {
                    DllPath: 'smss.dll'
                }
            ]
        },
        {
            Name: 'smss.exe',
            CommandLine: 'C:\\ProgramFiles\\smss.exe',
            Modules: [
                {
                    DllPath: 'smss.dll'
                }
            ]
        }
    ],
    Prefetch: [
        {
            CommandLine: 'C:\\tmp\\Mimikatz.exe'
        }
    ],
    Event: [
        { ID: 4624 },
        { ID: 1900 }
    ]
};

async function main()
{
    const container = configureContainer();

    const logger = container.get<ILoggerService>(DI.ILoggerService);
    const engine = container.get<ITigmaEngine>(DI.ITigmaEngine);

    const ruleContent = "title: Minimal Rule\n" +
        "logsource:\n" +
        "  os: windows\n" +
        "  category: case\n" +
        "  product: air\n" +
        "detection:\n" +
        "  selection:\n" +
        "    Property: value\n" +
        "  condition:  selection";

    const rule = engine.load(ruleContent);
}

const result = main();

result.then(() =>
{
   console.log("Execution completed");
}).catch((reason) =>
{
   console.log(reason);
});
