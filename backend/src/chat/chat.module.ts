// src/chats/chats.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { UserModule } from 'src/user/user.module';
import { MessageModule } from 'src/message/message.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    UserModule,
    MessageModule, 
  ],
  providers: [ChatService,ChatGateway],
  controllers: [ChatController],
  exports: [ChatService,ChatGateway],
})
export class ChatModule {} 