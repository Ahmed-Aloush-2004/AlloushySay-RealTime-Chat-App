import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from '@nestjs/config';
import { MessageModule } from './message/message.module';
import { GroupModule } from './group/group.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/webrtc-app'), // Update with your MongoDB connection string
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule available everywhere
      envFilePath: '.env', // Optional: specify the path to your .env file
    }),
    UserModule,
    ChatModule,
    AuthModule,
    MessageModule,
    GroupModule,
    CloudinaryModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}