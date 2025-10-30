import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/group.schema';
import { UserModule } from 'src/user/user.module';
import { GroupGateway } from './group.gateway';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    UserModule, // Ensure UserService is available
        MessageModule, 

  ],
  controllers: [GroupController],
  providers: [GroupService,GroupGateway],
  exports: [GroupService,GroupGateway],
})
export class GroupModule { }  
