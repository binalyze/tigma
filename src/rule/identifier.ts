import { Modifier } from "./modifier";
import { IdentifierType } from "./identifier-type.enum";
import { TypeUtils } from "../utils/type-utils";

export type Primitive = string | number | boolean;
export type IdentifierValue = Identifier | Primitive;

export class Identifier {
  public key: string;
  public name: string;
  public type: IdentifierType;
  public modifiers: Modifier[];
  public values: IdentifierValue[];

  constructor(identifier: string, value: any) {
    const reName = /(\w+)/; // Matches Processes or Processes[*]

    const [_, name] = reName.exec(identifier);

    this.key = identifier;

    this.name = name;

    this.type = Identifier.getIdentifierType(value);

    this.modifiers = Modifier.extractModifiers(identifier);

    this.values = [];

    switch (this.type) {
      case IdentifierType.Map:
        Identifier.traverse(value, this);
        break;
      case IdentifierType.List:
        if (TypeUtils.isPrimitive(value[0])) {
          this.type = IdentifierType.Primitive;
        }
        this.values = value;
        break;
      case IdentifierType.Primitive:
        this.values.push(value);
        break;
    }
  }

  private static getIdentifierType(value: any) {
    if (TypeUtils.isArray(value)) {
      return IdentifierType.List;
    } else {
      return TypeUtils.isPrimitive(value)
        ? IdentifierType.Primitive
        : IdentifierType.Map;
    }
  }

  private static traverse(obj: any, node: Identifier) {
    for (let i in obj) {
      if (TypeUtils.isPrimitive(obj[i])) {
        node.values.push(new Identifier(i, obj[i]));
      }

      if (obj[i] !== null && typeof obj[i] === "object") {
        const child = new Identifier(i, obj[i]);

        node.values.push(child);
      }
    }
  }
}
