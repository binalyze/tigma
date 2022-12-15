import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Product } from "./product.enum";
import { OperatingSystem } from "./operating-system.enum";

export class LogSource {
  @IsOptional()
  @IsString()
  public category: string;

  @IsOptional()
  @IsString()
  public product: Product;

  @IsOptional()
  @IsString()
  public service: string;

  @IsOptional()
  @IsString()
  public definition: string;
}
