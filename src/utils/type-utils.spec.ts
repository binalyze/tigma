import {TypeUtils} from "./type-utils";

describe('Type Utils', () =>
{
    describe('IsArray', () =>
    {
        test('Should succeed for arrays', () =>
        {
            expect(TypeUtils.isArray([])).toBe(true);
        });

        test('Should fail for other types', () =>
        {
            expect(TypeUtils.isArray({})).toBe(false);
            expect(TypeUtils.isArray('some-text')).toBe(false);
        });
    });

    describe('IsPrimitive', () =>
    {
        test('Should succeed for primitives', () =>
        {
           expect(TypeUtils.isPrimitive(true)).toBe(true);
           expect(TypeUtils.isPrimitive('some-text')).toBe(true);
           expect(TypeUtils.isPrimitive(1)).toBe(true);
        });

        test('Should succeed for null', () =>
        {
            expect(TypeUtils.isPrimitive(null)).toBe(true);
        });

        test('Should fail for other types', () =>
        {
            expect(TypeUtils.isPrimitive([])).toBe(false);
            expect(TypeUtils.isPrimitive({})).toBe(false);
        });
    });
});
