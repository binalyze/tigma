import {Modifier} from "./modifier";
import {ModifierType} from "./modifier-type.enum";

describe('Modifier', () =>
{
    test('Single modifier should be parsed correctly', () =>
    {
        const modifier = new Modifier('contains');

        expect(modifier.type).toBe(ModifierType.Contains);
    });

    test('Invalid modifier should throw exception', () =>
    {
        expect(() => {
            const modifier = new Modifier('invalidmodifier');
        }).toThrow();
    });

    test('Multiple modifiers should be parsed correctly', () =>
    {
        const modifiers = Modifier.extractModifiers('Name|contains');

        expect(modifiers).toHaveLength(1);
        expect(modifiers[0].type).toBe(ModifierType.Contains);
        expect(modifiers[0].negate).toBe(false);
    });

    test('Negate operator should be parsed correctly', () =>
    {
        const modifiers = Modifier.extractModifiers('Name|!contains');

        expect(modifiers).toHaveLength(1);
        expect(modifiers[0].type).toBe(ModifierType.Contains);
        expect(modifiers[0].negate).toBe(true);
    });
});
