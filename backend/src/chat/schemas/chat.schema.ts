// src/chats/schemas/chat.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({
  timestamps: true
})
export class Chat {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reciver: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], required: true, ref: 'Message',default:[] })
  messages: Types.ObjectId[];




}

export const ChatSchema = SchemaFactory.createForClass(Chat);