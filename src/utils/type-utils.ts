export class TypeUtils
{
    public static isArray(value: any): boolean
    {
        return Array.isArray(value);
    }

    public static isPrimitive(value: any): boolean
    {
        const type = typeof value;

        return (value === null || ["string", "number", "boolean"].indexOf(type) >= 0);
    }
}
