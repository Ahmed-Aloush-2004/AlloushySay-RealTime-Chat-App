import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  RAW = 'raw'
}


@Schema({
  timestamps: true
})
export class Message {

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reciver?: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({
    required: true, 
    type: String, // Mongoose stores it as a string
    enum: Object.values(MessageType)
  })
  messageType: MessageType;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: false })
  isNotified: boolean;

  // Additional fields for file messages
  @Prop()
  fileName?: string;

  @Prop()
  fileType?: string;

  // Reply functionality
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo?: Types.ObjectId;

  // Read receipts
  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  readBy?: Types.ObjectId[];


}

export const MessageSchema = SchemaFactory.createForClass(Message);