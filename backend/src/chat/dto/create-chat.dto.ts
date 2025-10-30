// src/chats/dto/create-chat.dto.ts
import { IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  sender: string;

  @IsNotEmpty()
  reciver: string; 
}