import { Identifier, IdentifierValue } from "./identifier";
import { IdentifierType } from "./identifier-type.enum";
import { ModifierType } from "./modifier-type.enum";

describe("Identifier", () => {
  const IdentifierObj = {
    "Process[]": {
      "Name|!contains": "process.exe",
      Module: {
        DllName: ["ntdll.dll", "kernel32.dll"],
        Memory: [{ Path: "deneme" }],
        DllSize: 1000,
      },
    },
    "Prefetch[*]": {
      Name: "Mimikatz.exe",
      "Path|!contains": "tmp",
    },
  };

  test("Loading a valid identifier should succeed", () => {
    const identifier = new Identifier("Identifier", IdentifierObj);

    expect(identifier.key).toBe("Identifier");
    expect(identifier.name).toBe("Identifier");
    expect(identifier.type).toBe(IdentifierType.Map);
    expect(identifier.modifiers).toHaveLength(0);
    expect(identifier.values).toHaveLength(2);
  });

  test("Modifier parsing should should succeed", () => {
    const identifier = new Identifier(ModifierType.Equals, IdentifierObj);

    const childIdentifier = identifier.values[0] as Identifier;
    const values = childIdentifier.values as Identifier[];

    const value = values[0];

    expect(value.key).toBe(`Name|!${ModifierType.Contains}`);
    expect(value.name).toBe("Name");
    expect(value.type).toBe(IdentifierType.Primitive);
    expect(value.modifiers).toHaveLength(1);
    expect(value.modifiers[0].type).toBe(ModifierType.Contains);
    expect(value.modifiers[0].negate).toBe(true);
    expect(value.values).toContain("process.exe");
  });
});
