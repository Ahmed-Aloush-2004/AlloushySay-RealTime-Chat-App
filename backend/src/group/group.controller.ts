import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }


  @Post('joinGroup')
  @UseGuards(JwtAuthGuard)
  joinToGroup(
    @Body('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    console.log('this is hi!!!!!!');
    
    return this.groupService.joinGroup({ userId: user.userId, groupId });
  }


  @Post('leaveGroup')
  @UseGuards(JwtAuthGuard)
  leaveFromGroup(
    @Body('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupService.leaveGroup({ userId: user.userId, groupId });
  }

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.groupService.getOneForShowing(id,user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.groupService.delete(id);
  }
}
