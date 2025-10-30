// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({  })
  password?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: true })
  isOnline: boolean;

  @Prop()
  avatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);