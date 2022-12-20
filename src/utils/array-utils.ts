export class ArrayUtils
{
    /**
     * Creates N combinations of the provided array
     * @param list: Array of items to combine
     * @param N: Length of combinations
     *
     * Example:
     * ['a','b','c'] => [['a','b'], ['a','c'], ['b','c']]
     */
    public static createNCombinations(list: string[], N: number)
    {
        if(!list || list.length === 0)
        {
            throw new Error(`Empty array provided`);
        }

        if(N > list.length)
        {
            throw new Error(`Provided number ${N} is greater than total count of array ${list.length}`);
        }

        const array = new Array(1 << list.length).fill('').map(
            (e1,i) => list.filter((e2, j) => i & 1 << j));

        return array.filter((c:string[]) => c.length === N);
    }
}
