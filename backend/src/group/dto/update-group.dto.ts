import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';
import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    membersToAdd?: string[]; // IDs of users to add

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    membersToRemove?: string[]; // IDs of users to remove
}
