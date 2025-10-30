// src/chats/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, set, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) { }

  async create(createChatDto: CreateChatDto): Promise<ChatDocument> {
    const createdChat = new this.chatModel(createChatDto);
    return createdChat.save();
  }

  // async getMyChats(userId: string): Promise<ChatDocument[]> {
  //   const newuserId = new Types.ObjectId(userId);
  //   return this.chatModel.find({ $or: [{ sender: newuserId }, { reciver: newuserId }] }).exec();
  // }

async getMyChats(userId: string): Promise<ChatDocument[]> {  
  // Find chats where the user is either sender or receiver
  const chats = await this.chatModel.find({
    $or: [
      { sender: userId.toString() }, 
      { reciver: userId.toString() }
    ]
  })
    .populate('sender').select('-password')
    .populate('reciver').select('-password')
    .populate({
      path: 'messages',
      options: { sort: { createdAt: -1 }, limit: 1 },
      populate: [
        { path: 'sender', select: '-password' },
        { path: 'reciver', select: '-password' }
      ]
    })
    .sort({ updatedAt: -1 })
    .exec();
    
  return chats;
}


  async findAll(): Promise<ChatDocument[]> {
    return this.chatModel.find().populate('sender', 'reciver').exec();
  }

  async chatwithMessages(id1: string, id2: string): Promise<ChatDocument> {
    return this.chatModel.findOne({ $or: [{ sender: id1, reciver: id2 }, { sender: id2, reciver: id1 }] }).populate({
      path: 'messages', // The main array field to populate
      populate: [ // An array of nested fields to populate within each message object
        {
          path: 'sender', // The 'sender' field inside the 'messages' array
          // select: 'username email avatar', // Optional: Select specific fields
        },
        {
          path: 'reciver', // The 'reciver' field inside the 'messages' array
          // select: 'username email avatar', // Optional: Select specific fields
        }
      ]
    }).exec();
  }



  async findChatBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<ChatDocument | null> {
    return this.chatModel.findOne({
      $or: [
        // Case 1: userId1 is sender, userId2 is reciver
        { sender: userId1, reciver: userId2 },
        // Case 2: userId2 is sender, userId1 is reciver
        { sender: userId2, reciver: userId1 },
      ],
    }).exec();
  }

  async findOne(id: string): Promise<ChatDocument> {
    return this.chatModel.findById(id).populate('sender', 'reciver').exec();
  }

  async findOneAndUpdate(id: string, expression: any): Promise<ChatDocument> {
    return this.chatModel.findOneAndUpdate({ _id: id }, { $set: expression }, { new: true }).exec();
  }

  async remove(id: string): Promise<ChatDocument> {
    return this.chatModel.findByIdAndDelete(id).exec();
  }
}