import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../schemas/message.schema';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {


    @IsString()
    @IsOptional()
    content?: string;

    @IsEnum(MessageType)
    @IsOptional()
    messageType?: MessageType;

    @IsString()
    @IsOptional()
    fileName?: string;

    @IsString()
    @IsOptional()
    fileType?: string;

    @IsString()
    @IsOptional()
    replyTo?: string;

    @IsOptional()
    isRead?: boolean;

}
