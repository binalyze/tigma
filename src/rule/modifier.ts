import {ModifierType} from "./modifier-type.enum";

export class Modifier
{
    public type: ModifierType;
    public negate: boolean;

    constructor(modifier: string)
    {
        this.negate = modifier.indexOf('!') == 0;

        this.type = ((this.negate) ? modifier.substring(1) : modifier) as ModifierType;
    }

    static extractIdentifiers(identifier: string): Modifier[]
    {
        const parts = identifier.split('|');

        const modifiers = parts.splice(1); // Skip the first part

        const list: Modifier[] = [];

        modifiers.forEach(m =>
        {
           list.push(new Modifier(m));
        });

        return list;
    }
}
