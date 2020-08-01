import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNotEmptyObject,
    Length,
    ValidateNested,
    IsEnum,
    IsArray
} from "class-validator";
import {LogSource} from "./log-source";
import {Detection} from "./detection";
import {Related} from "./related";
import {Status} from "./status.enum";
import {Level} from "./level.enum";
import {Type} from "class-transformer";
import {Action} from "./action.enum";
import {Identifier} from "./identifier";

/**
 * @see https://github.com/Neo23x0/sigma/wiki/Specification
 */
export class SigmaRule
{
    //#region Required Properties
    @IsNotEmpty()
    @IsString()
    @Length(1, 256)
    public title: string;

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => LogSource)
    public logsource: LogSource;

    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Detection)
    public detection: Detection;
    //#endregion

    //#region Optional Properties
    @IsOptional()
    @IsEnum(Action)
    public action: Action;

    @IsOptional()
    @IsString()
    @Length(1, 64)
    public id: string;

    @IsOptional()
    @IsArray()
    public related: Related[];

    @IsOptional()
    @IsEnum(Status)
    public status: Status;

    @IsOptional()
    @IsString()
    public description: string;

    @IsOptional()
    @IsString()
    public author: string;

    @IsOptional()
    @IsString()
    public license: string;

    @IsOptional()
    @IsArray()
    public references: string[];

    @IsOptional()
    @IsArray()
    public fields: string[];

    @IsOptional()
    public falsepositives: string|string[];

    @IsOptional()
    @IsEnum(Level)
    public level: Level;

    @IsOptional()
    @IsArray()
    public tags: string[];
    //#endregion

    public toAST(): Identifier[]
    {
        const list: Identifier[] = [];

        const names = this.detection.getConditionNames();

        for(let i in names)
        {
            const name = names[i];

            const tree = new Identifier(name, this.detection.getConditionByName(name));

            list.push(tree);
        }

        return list;
    }
}
