// src/chats/chat.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto);
  }

  @Get('/:id1/:id2')
  getChat(@Param('id1') id1: string, @Param('id2') id2: string) {
    return this.chatService.chatwithMessages(id1, id2);
  }


  @Get()
  findAll() {
    return this.chatService.findAll();
  }

  @Get('myChats')
  @UseGuards(JwtAuthGuard)
  getMyChats(
    @CurrentUser() user: { userId: string, username: string }
  ) {
    return this.chatService.getMyChats(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatService.remove(id);
  }
}