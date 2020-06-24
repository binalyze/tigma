import {ArrayUtils} from "./array-utils";

describe('Array Utils', () =>
{
    test('Providing empty array should throw error', () =>
    {
        const array:string[] = [];

        expect(() => {
            ArrayUtils.createNCombinations(array, 2);
        }).toThrow();
    });

    test('Providing N that is greater than array length should throw error', () =>
    {
        const array = ['a'];

        expect(() => {
            ArrayUtils.createNCombinations(array, 2);
        }).toThrow();
    });

    test('Combinations of 2 should be 1', () =>
    {
        const array = ['a', 'b'];
        const combinations = ArrayUtils.createNCombinations(array, 2);
        expect(combinations.length).toBe(1);
    });

    test('Combinations of 3 should be 3', () =>
    {
        const array = ['a', 'b', 'c'];
        const combinations = ArrayUtils.createNCombinations(array, 2);
        expect(combinations.length).toBe(3);
    });
});
