// src/chats/dto/create-chat.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../schemas/message.schema';

export class CreateMessageDto {
  @IsNotEmpty()
  sender: string;

  @IsNotEmpty()
  reciver: string; // Fixed typo

  @IsString()
  @IsNotEmpty()
  content: string;


  @IsEnum(MessageType)
  @IsNotEmpty()
  messageType: MessageType;


  @IsString()
  @IsOptional()
  replyTo?: string;
  

  @IsString()
  @IsOptional()
  fileType?: string;
  
  @IsString()
  @IsOptional()
  fileName?: string;
  

}