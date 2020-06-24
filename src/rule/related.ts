import {IsEnum, IsNotEmpty, IsString, Length} from "class-validator";

export enum RelationType
{
    Derived = 'derived',
    Obsoletes = 'obsoletes',
    Merged = 'merged',
    Renamed = 'renamed'
}

export class Related
{
    @IsNotEmpty()
    @IsEnum(RelationType)
    public type: RelationType;

    @IsNotEmpty()
    @Length(1, 64)
    public id: string|string[];
}
