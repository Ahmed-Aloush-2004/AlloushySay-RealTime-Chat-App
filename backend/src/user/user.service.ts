// src/users/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {

    const createdUser = new this.userModel({
      ...createUserDto,
    });

    if (createUserDto.password) {
      createdUser.password = await bcrypt.hash(createUserDto.password, 10);
    }

    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findAllOnlineUsers(userId: string): Promise<UserDocument[]> {
    const objectId = new Types.ObjectId(userId);
    return this.userModel.find({
      isOnline: true,
      _id: { $ne: objectId }
    }).select('-password')
      .exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    return this.userModel.findOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument> {
    return this.userModel.findOne({ username });
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email });
  }

  async update(id: string, updateUserDto: any): Promise<UserDocument> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async remove(id: string): Promise<UserDocument> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(id, { isOnline }).exec();
  }
}