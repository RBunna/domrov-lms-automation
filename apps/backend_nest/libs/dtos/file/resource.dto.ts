import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ResourceDTO {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    url: string; // The URL returned by your file service earlier
}