// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Message, MessageDocument } from './schemas/message.schema';
// import { Model } from 'mongoose';
// import { CreateMessageDto } from './dto/create-message.dto';
// import { UpdateMessageDto } from './dto/update-message.dto';
// import { UserService } from 'src/user/user.service';
// import { GetMessagesForUsersDto } from './dto/get-messages-for-users.dto';

// @Injectable()
// export class MessageService {
//     constructor(
//         @InjectModel(Message.name)
//         private readonly messageModel: Model<Message>,
//         private readonly userService: UserService,
//     ) { }

//     async create(createMessageDto: CreateMessageDto): Promise<MessageDocument> {
//         const sender = await this.userService.findOne(createMessageDto.sender);
//         const reciver = await this.userService.findOne(createMessageDto.reciver);
//         const createdMessage = new this.messageModel({
//             content: createMessageDto.content,
//             sender,
//             reciver,
//             messageType:createMessageDto.messageType,
//         });
//         return createdMessage.save();
//     }

//     async findAll(): Promise<MessageDocument[]> {
//         return this.messageModel.find().exec();
//     }

//     async getChatMessagesForUsers(getMessagesForUsersDto: GetMessagesForUsersDto): Promise<MessageDocument[]> {
//         const user1 = await this.userService.findOne(getMessagesForUsersDto.user1);
//         const user2 = await this.userService.findOne(getMessagesForUsersDto.user2);
//         return this.messageModel.find({ $or: [{ sender: user1, reciver: user2 }, { sender: user2, reciver: user1 }] }).populate('sender reciver').exec();
//     }


//     async findOne(id: string): Promise<MessageDocument> {
//         return this.messageModel.findById(id).exec();
//     }
    
//     async update(id: string, updateMessageDto: UpdateMessageDto): Promise<MessageDocument> {
//         return this.messageModel.findByIdAndUpdate(id, updateMessageDto, { new: true });
//     }
//     async delete(id: string): Promise<MessageDocument> {
//         return this.messageModel.findByIdAndDelete(id);
//     }
// }


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Model, Types } from 'mongoose';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GetMessagesForUsersDto } from './dto/get-messages-for-users.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message.name)
        private readonly messageModel: Model<Message>,
        private readonly userService: UserService,
    ) { }

    async create(createMessageDto: CreateMessageDto): Promise<MessageDocument> {
        // Verify sender exists
        const sender = await this.userService.findOne(createMessageDto.sender);
        if (!sender) {
            throw new NotFoundException('Sender not found');
        }

        // Verify reciver exists (if provided)
        let reciver = null;
        if (createMessageDto.reciver) {
            reciver = await this.userService.findOne(createMessageDto.reciver);
            if (!reciver) {
                throw new NotFoundException('Reciver not found');
            }
        }

        // Create message with all required fields
        const createdMessage = new this.messageModel({
            content: createMessageDto.content,
            sender: sender._id,
            reciver: reciver ? reciver._id : null,
            messageType: createMessageDto.messageType,
            fileName: createMessageDto?.fileName,
            fileType: createMessageDto?.fileType,
            replyTo: createMessageDto.replyTo,
        });

        // Save and populate the message
        const savedMessage = await createdMessage.save();
        return savedMessage.populate([
            { path: 'sender', select: '-password' },
            { path: 'reciver', select: '-password' },
            { path: 'replyTo' }
        ]);
    }

    async findAll(): Promise<MessageDocument[]> {
        return this.messageModel.find()
            .populate([
                { path: 'sender', select: '-password' },
                { path: 'reciver', select: '-password' },
                { path: 'replyTo' }
            ])
            .exec();
    }

    async getChatMessagesForUsers(getMessagesForUsersDto: GetMessagesForUsersDto): Promise<MessageDocument[]> {
        const user1 = await this.userService.findOne(getMessagesForUsersDto.user1);
        const user2 = await this.userService.findOne(getMessagesForUsersDto.user2);
        
        if (!user1 || !user2) {
            throw new NotFoundException('One or both users not found');
        }

        return this.messageModel.find({ 
            $or: [
                { sender: user1._id, reciver: user2._id }, 
                { sender: user2._id, reciver: user1._id }
            ] 
        })
        .populate([
            { path: 'sender', select: '-password' },
            { path: 'reciver', select: '-password' },
            { path: 'replyTo' }
        ])
        .sort({ createdAt: 1 })
        .exec();
    }

    async findOne(id: string): Promise<MessageDocument> {
        const message = await this.messageModel.findById(id)
            .populate([
                { path: 'sender', select: '-password' },
                { path: 'reciver', select: '-password' },
                { path: 'replyTo' }
            ])
            .exec();
            
        if (!message) {
            throw new NotFoundException('Message not found');
        }
        
        return message;
    }
    
    async update(id: string, updateMessageDto: UpdateMessageDto): Promise<MessageDocument> {
        const updatedMessage = await this.messageModel.findByIdAndUpdate(
            id, 
            updateMessageDto, 
            { new: true }
        )
        .populate([
            { path: 'sender', select: '-password' },
            { path: 'reciver', select: '-password' },
            { path: 'replyTo' }
        ])
        .exec();
        
        if (!updatedMessage) {
            throw new NotFoundException('Message not found');
        }
        
        return updatedMessage;
    }

    async delete(id: string): Promise<MessageDocument> {
        const deletedMessage = await this.messageModel.findByIdAndDelete(id)
            .populate([
                { path: 'sender', select: '-password' },
                { path: 'reciver', select: '-password' },
                { path: 'replyTo' }
            ])
            .exec();
            
        if (!deletedMessage) {
            throw new NotFoundException('Message not found');
        }
        
        return deletedMessage;
    }

    async markAsRead(messageId: string, userId: string): Promise<MessageDocument> {
        // Verify message exists
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new NotFoundException('Message not found');
        }

        // Verify user exists
        const user = await this.userService.findOne(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user is the reciver of the message
        if (message.reciver && message.reciver.toString() !== userId) {
            throw new Error('Only the reciver can mark a message as read');
        }

        // Mark message as read
        message.isRead = true;
        
        // Add user to readBy array if it doesn't exist
        if (!message.readBy) {
            message.readBy = [];
        }
        
        if (!message.readBy.includes(new Types.ObjectId(userId))) {
            message.readBy.push(new Types.ObjectId(userId));
        }

        return message.save();
    }

    async markMultipleAsRead(messageIds: string[], userId: string): Promise<MessageDocument[]> {
        // Verify user exists
        const user = await this.userService.findOne(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const userIdObj = new Types.ObjectId(userId);
        const updatedMessages: MessageDocument[] = [];

        for (const messageId of messageIds) {
            try {
                const message = await this.messageModel.findById(messageId);
                
                if (!message) {
                    continue; // Skip if message doesn't exist
                }

                // Check if user is the reciver of the message
                if (message.reciver && message.reciver.toString() !== userId) {
                    continue; // Skip if user is not the reciver
                }

                // Mark message as read
                message.isRead = true;
                
                // Add user to readBy array if it doesn't exist
                if (!message.readBy) {
                    message.readBy = [];
                }
                
                if (!message.readBy.includes(userIdObj)) {
                    message.readBy.push(userIdObj);
                }

                const savedMessage = await message.save();
                updatedMessages.push(savedMessage);
            } catch (error) {
                // Log error but continue with other messages
                console.error(`Error marking message ${messageId} as read:`, error.message);
            }
        }

        return updatedMessages;
    }

    async getUnreadCountForUser(userId: string): Promise<number> {
        // Verify user exists
        const user = await this.userService.findOne(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.messageModel.countDocuments({
            reciver: user._id,
            isRead: false
        }).exec();
    }
}