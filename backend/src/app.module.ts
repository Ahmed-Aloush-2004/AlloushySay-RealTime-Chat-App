import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "./user/user.module";
import { ChatModule } from "./chat/chat.module";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageModule } from './message/message.module';
import { GroupModule } from './group/group.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    // MongooseModule.forRoot('mongodb://localhost:27017/webrtc-app'), // Update with your MongoDB connection string

    // 3. Configure the database connection using forRootAsync
    MongooseModule.forRootAsync({
      // The useFactory is a function that returns the Mongoose connection options
      useFactory: async (configService: ConfigService) => ({
        // Read the MONGO_URI from the environment variables
        uri: configService.get<string>('MONGO_URI'),
  
      }),  
      // Inject the ConfigService to make it available in the useFactory
      inject: [ConfigService],

    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
export class AppModule { }  