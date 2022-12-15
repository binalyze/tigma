import { ModifierType } from "./modifier-type.enum";

export class Modifier {
  public type: ModifierType;
  public negate: boolean;

  constructor(modifier: string) {
    this.negate = modifier.indexOf("!") == 0;

    const typeName = this.negate ? modifier.substring(1) : modifier;

    if (!Object.values(ModifierType).includes(typeName as ModifierType)) {
      throw new Error(`Unsupported modifier provided: ${typeName}`);
    }

    this.type = typeName as ModifierType;
  }

  static extractModifiers(identifier: string): Modifier[] {
    const parts = identifier.split("|");

    const modifiers = parts.splice(1); // Skip the first part which is name

    const list: Modifier[] = [];

    for (let i in modifiers) {
      const m = modifiers[i];

      list.push(new Modifier(m));
    }

    return list;
  }
}
