import {Identifier, IdentifierValue} from "./identifier";
import {IdentifierType} from "./identifier-type.enum";

describe('Identifier', () =>
{
    const Constraint = {
        "Process[]": {
            "Name|base64|!contains": "process.exe",
            "Module": {
                "DllName": [
                    "ntdll.dll",
                    "kernel32.dll"
                ],
                "Memory": [
                    { "Path": "deneme"}
                ],
                "DllSize": 1000
            }
        },
        "Prefetch[*]": {
            "Name": "Mimikatz.exe",
            "Path|!contains": 'tmp'
        }
    };

    test('Loading a valid identifier should succeed', () =>
    {
        const identifier = new Identifier('Constraint', Constraint);

        expect(identifier.key).toBe('Constraint');
        expect(identifier.name).toBe('Constraint');
        expect(identifier.type).toBe(IdentifierType.Map);
        expect(identifier.modifiers).toHaveLength(0);
        expect(identifier.values).toHaveLength(2);
    });

    test('Modifier parsing should should succeed', () =>
    {
        const identifier = new Identifier('Constraint', Constraint);

        const childIdentifier = identifier.values[0] as Identifier;
        const values = childIdentifier.values as Identifier[];

        const value = values[0];

        expect(value.key).toBe('Name|base64|!contains');
        expect(value.name).toBe('Name');
        expect(value.type).toBe(IdentifierType.Primitive);
        expect(value.modifiers).toHaveLength(2);
        expect(value.modifiers[0].type).toBe('base64');
        expect(value.modifiers[0].negate).toBe(false);
        expect(value.modifiers[1].type).toBe('contains');
        expect(value.modifiers[1].negate).toBe(true);
        expect(value.values).toContain('process.exe');
    });
});
