import {Detection} from "./detection";
import {plainToClass} from "class-transformer";

describe('Detection', () =>
{
    const validDetection:Detection = new Detection();
    validDetection.cond1 = {process: 'test1.exe'};
    validDetection.cond2 = {process: 'test2.exe'};
    validDetection.condition = 'cond1 or cond2';
    validDetection.timeframe = '5w';

    test('Get condition names should return correct names', () =>
    {
        expect(validDetection.getConditionNames()).toEqual(['cond1', 'cond2']);
    });

    test('Get condition by name should succeed for valid conditions', () =>
    {
        const condition = validDetection.getConditionByName('cond1');
        expect(condition.process).toBe('test1.exe');
    });

    test('Should return undefined for invalid condition name', () =>
    {
        const condition = validDetection.getConditionByName('some-name');
        expect(condition).toBeUndefined();
    });

    test("Should throw exception when 'condition' property is missing", () =>
    {
        expect(() => {
            const detection = plainToClass(Detection, {});
            detection.validate();
        }).toThrow();
    });

    test('Should throw exception when no condition section is provided', () =>
    {
        const detection: Detection = new Detection();
        detection.condition = 'selection';

        expect(() => {
            detection.validate();
        }).toThrow();
    });

    test('Condition should not be null or empty', () =>
    {
        const detection: Detection = new Detection();
        detection.selection = null;
        detection.condition = 'selection';

        expect(() => {
            detection.validate();
        }).toThrow();
    });

    test('Normal condition statement should not be expanded', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test2.exe'};
        detection.condition = 'cond1 or cond2';

        expect(detection.expandCondition()).toEqual(detection.condition);
    });

    test('"any of them" statement should be expanded correctly', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test2.exe'};
        detection.condition = 'any of them';

        expect(detection.expandCondition()).toEqual('(cond1 or cond2)');
    });

    test('"all of them" statement should be expanded correctly', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test2.exe'};
        detection.condition = 'all of them';

        expect(detection.expandCondition()).toEqual('(cond1 and cond2)');
    });

    test('"1 of them" statement should be expanded correctly', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test2.exe'};
        detection.condition = '1 of them';

        expect(detection.expandCondition()).toEqual('((cond1) or (cond2))');
    });

    test('"N of them" statement should be expanded correctly', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test2.exe'};
        detection.cond3 = {process: 'test3.exe'};
        detection.condition = '2 of them';

        expect(detection.expandCondition()).toEqual("((cond1 and cond2) or (cond1 and cond3) or (cond2 and cond3))");
    });

    test('"N of wildcard*" statement should be expanded correctly', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test2.exe'};
        detection.cond3 = {process: 'test3.exe'};
        detection.condition = '2 of cond*';

        expect(detection.expandCondition()).toEqual("((cond1 and cond2) or (cond1 and cond3) or (cond2 and cond3))");
    });

    test('"N of condition" statement should be expanded correctly', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {sub1:{process: 'test1.exe'}, sub2:{process: 'test1.exe'}};
        detection.cond2 = {sub1:{process: 'test2.exe'}, sub2:{process: 'test2.exe'}};
        detection.cond3 = {sub1:{process: 'test3.exe'}, sub2:{process: 'test3.exe'}};
        detection.condition = '(2 of cond1) or (1 of cond2)';

        expect(detection.expandCondition()).toEqual("(((cond1.sub1 and cond1.sub2))) or (((cond2.sub1) or (cond2.sub2)))");
    });

    test('"N of condition" statement should fail for invalid group', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {sub1:{process: 'test1.exe'}, sub2:{process: 'test1.exe'}};
        detection.condition = '2 of condNone';

        expect(() =>
        {
            detection.expandCondition();
        }).toThrow();
    });

    test('"N of condition" statement should fail when invalid number provided', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test1.exe'};
        detection.condition = 'x of them';

        expect(() => {
            detection.expandCondition();
        }).toThrow();
    });

    test('"N of condition" statement should fail for numbers greater than condition count', () =>
    {
        const detection:Detection = new Detection();
        detection.cond1 = {process: 'test1.exe'};
        detection.cond2 = {process: 'test1.exe'};
        detection.condition = '3 of them';

        expect(() => {
            detection.expandCondition();
        }).toThrow();
    });
});
