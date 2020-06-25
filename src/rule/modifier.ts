import {ModifierValue} from "./modifier-value.enum";

export class Modifier
{
    public value: ModifierValue;
    public negate: boolean;

    constructor(modifier: string)
    {
        this.negate = modifier.indexOf('!') == 0;

        //TODO(emre): We better validate this against supported modifiers
        this.value = ((this.negate) ? modifier.substring(1) : modifier) as ModifierValue;
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
