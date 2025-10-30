import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageDocument } from './schemas/message.schema';
import { GetMessagesForUsersDto } from './dto/get-messages-for-users.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }


  @Get('/specific-chat')
  async getChatMessagesForUsers(
    @Body() getMessagesForUsersDto: GetMessagesForUsersDto
  ): Promise<MessageDocument[]> {
    return this.messageService.getChatMessagesForUsers(getMessagesForUsersDto);
  }

  @Get()
  async findAll(): Promise<MessageDocument[]> {
    return this.messageService.findAll();
  }

  @Get(':id')
  async findOne(@Body() id: string): Promise<MessageDocument> {
    return this.messageService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageDocument> {
    return this.messageService.update(id, updateMessageDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ): Promise<MessageDocument> {
    return this.messageService.delete(id);
  }

}
