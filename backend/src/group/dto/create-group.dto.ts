import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";



export class CreateGroupDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsMongoId()
    @IsNotEmpty()
    adminId: string;


}
