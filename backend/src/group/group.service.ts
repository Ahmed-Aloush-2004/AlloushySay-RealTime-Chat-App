// import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
// import { CreateGroupDto } from './dto/create-group.dto';
// import { UpdateGroupDto } from './dto/update-group.dto';
// import { InjectModel } from '@nestjs/mongoose';
// import { Group, GroupDocument } from './schemas/group.schema';
// import { Model, Types } from 'mongoose';
// import { UserService } from 'src/user/user.service'; // Assuming UserService path
// import { GroupMembershipDto } from './dto/group-membership.dto';

// @Injectable()
// export class GroupService {

//   constructor(
//     @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
//     private readonly userService: UserService, // Assumed dependency

//   ) { }

//   /**
//    * Creates a new group, setting the provided adminId as the admin and initial member.
//    */
//   async create(createGroupDto: CreateGroupDto): Promise<GroupDocument> {
//     // Note: Assuming userService.findOne returns a user document or null/undefined
//     const admin = await this.userService.findOne(createGroupDto.adminId);
//     if (!admin) {
//       throw new NotFoundException('Admin user not found');
//     }

//     const createdGroup = new this.groupModel({
//       name: createGroupDto.name,
//       description: createGroupDto?.description,
//       admin: admin._id,
//       members: [admin._id],
//     });

//     return createdGroup.save();
//   }


//   async joinGroup(joinGroupPayload: GroupMembershipDto): Promise<GroupDocument> {
//     // 1. Check if the user exists
//     const user = await this.userService.findOne(joinGroupPayload.userId);
//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     // 2. Attempt to atomically add the user to the group
//     const group = await this.groupModel.findOneAndUpdate(
//       {
//         _id: joinGroupPayload.groupId,
//         members: { $ne: user._id } // Condition: only update if the user is NOT already a member
//       },
//       {
//         $addToSet: { members: user._id } // Action: add user ID to the members array
//       },
//       {
//         new: true // Return the updated document
//       }
//     )
//       .populate([
//         { path: 'admin', select: '-password' },
//         { path: 'members', select: '-password' }
//       ])
//       .exec();

//     // 3. Handle results
//     if (!group) {
//       // Check if the group exists to distinguish between NotFound and Conflict
//       const existingGroup = await this.groupModel.findById(joinGroupPayload.groupId);
//       if (!existingGroup) {
//         throw new NotFoundException('Group not found');
//       }
//       // If the group exists, the update failed because the user was already a member
//       throw new ConflictException('User is already a member of this group');
//     }

//     return group;
//   }




//   async leaveGroup(leaveGroupPayload: GroupMembershipDto): Promise<GroupDocument> {
//   const user = await this.userService.findOne(leaveGroupPayload.userId);
//   if (!user) {
//     throw new NotFoundException('User not found');
//   }

//   const groupId = leaveGroupPayload.groupId;
//   const userId = user._id;

//   // 1. Check if the user is the admin. If so, delete the group.
//   const group = await this.groupModel.findById(groupId).exec();
//   if (!group) {
//     throw new NotFoundException('Group not found');
//   }

//   // Mongoose automatically compares ObjectId/string, but explicit conversion is safer
//   if (group.admin.toString() === userId.toString()) {
//     // Admin leaves, group is deleted
//     return this.delete(groupId); 
//   }

//   // 2. Attempt to atomically remove the user from the group
//   const updatedGroup = await this.groupModel.findOneAndUpdate(
//     { 
//       _id: groupId, 
//       members: userId // Condition: only update if the user IS a member
//     },
//     { 
//       $pull: { members: userId } // Action: remove the user ID from the members array
//     },
//     { new: true }
//   )
//   .populate([
//     { path: 'admin', select: '-password' },
//     { path: 'members', select: '-password' }
//   ])
//   .exec();

//   // 3. Handle results
//   if (!updatedGroup) {
//     // If update failed, it means the user was not a member (since the group was found in step 1)
//     throw new NotFoundException('User is not a member of this group');
//   }

//   return updatedGroup;
// }




//   /**
//    * Retrieves all groups, populating admin and members and excluding user passwords.
//    */
//   findAll(): Promise<GroupDocument[]> {
//     return this.groupModel.find()
//       .populate([
//         // Populate admin and exclude password
//         { path: 'admin', select: '-password' },
//         // Populate members and exclude password
//         { path: 'members', select: '-password' },
//       ])
//       .exec();
//   }

//   /**
//    * Retrieves a single group by ID, populating all refs and excluding user passwords.
//    */
//   findOne(id: string): Promise<GroupDocument | null> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid group ID format');
//     }

//     return this.groupModel.findOne({
//       _id: new Types.ObjectId(id)
//     })
//       // Populate direct User references and exclude password
//       .populate([
//         { path: 'admin', select: '-password' },
//         { path: 'members', select: '-password' }
//       ])
//       // Populate messages and the nested sender/receiver fields
//       // .populate({
//       //   path: 'messages',
//       //   // Nested population for sender and receiver inside the messages array
//       //   populate: [
//       //     {
//       //       path: 'sender',
//       //       select: '-password',
//       //     }
//       //   ]
//       // })
//       .exec();
//   }



//   async getOneForShowing(groupId: string, userId: string): Promise<GroupDocument> {
//   if (!Types.ObjectId.isValid(groupId)) {
//     throw new BadRequestException('Invalid group ID format');
//   }

//   // 1. Fetch the group and populate users (admin/members)
//   const group = await this.groupModel.findOne({
//     _id: new Types.ObjectId(groupId)
//   })
//     .populate([
//       { path: 'admin', select: '-password' },
//       { path: 'members', select: '-password' }
//     ])
//     .exec();

//   if (!group) {
//    throw new NotFoundException('Group not found')
//   }

//   // 2. Check if the requesting user is a member
//   // Use .some() for a clean boolean check
//   const isMember = group.members.some(m => m._id.toString() === userId);

//   // 3. Conditionally populate messages and MUST AWAIT the result
//   if (isMember) {
//     // AWAIT the population call to ensure the messages are loaded into the document
//     await group.populate({
//       path: 'messages',
//       // Nested population for the sender of each message
//       populate: [
//         {
//           path: 'sender',
//           select: '-password',
//         }
//       ]
//     });
//   }

//   // 4. Return the (conditionally) populated group document
//   return group;
// }

//   /**
//    * Updates group properties and manages adding/removing members.
//    * NOTE: This assumes an ID of type string (MongoDB ObjectId).
//    */
//   async update(id: string, updateGroupDto: UpdateGroupDto): Promise<GroupDocument | null> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid group ID format');
//     }

//     const group = await this.groupModel.findById(id);

//     if (!group) {
//       throw new NotFoundException('Group not found');
//     }

//     // Handle members to add
//     if (updateGroupDto.membersToAdd && updateGroupDto.membersToAdd.length > 0) {
//       const newMembers = updateGroupDto.membersToAdd
//         .map(memberId => new Types.ObjectId(memberId))
//         .filter(memberId => !group.members.includes(memberId)); // Avoid duplicates
//       group.members.push(...newMembers);
//     }

//     // Handle members to remove
//     if (updateGroupDto.membersToRemove && updateGroupDto.membersToRemove.length > 0) {
//       const membersToRemove = updateGroupDto.membersToRemove.map(memberId => memberId.toString());
//       group.members = group.members.filter(memberId => !membersToRemove.includes(memberId.toString()));
//     }

//     // Update name and description
//     if (updateGroupDto.name) {
//       group.name = updateGroupDto.name;
//     }
//     if (updateGroupDto.description) {
//       group.description = updateGroupDto.description;
//     }

//     await group.save();

//     // Return the fully populated document after save
//     return this.findOne(id);
//   }

//   /**
//    * Removes a group by ID.
//    * NOTE: This assumes an ID of type string (MongoDB ObjectId).
//    */
//   async delete(id: string): Promise<GroupDocument> {
//     if (!Types.ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid group ID format');
//     }
//     const result = await this.groupModel.findByIdAndDelete(id).exec();
//     if (!result) {
//       throw new NotFoundException('Group not found');
//     }


//     return result;
//   }
// }




import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { Model, Types } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { GroupMembershipDto } from './dto/group-membership.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    private readonly userService: UserService,
  ) { }

  async create(createGroupDto: CreateGroupDto): Promise<GroupDocument> {
    const admin = await this.userService.findOne(createGroupDto.adminId);
    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    const createdGroup = new this.groupModel({
      name: createGroupDto.name,
      description: createGroupDto?.description,
      admin: admin._id,
      members: [admin._id],
    });

    return createdGroup.save();
  }

  async joinGroup(joinGroupPayload: GroupMembershipDto): Promise<GroupDocument> {
    const user = await this.userService.findOne(joinGroupPayload.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const group = await this.groupModel.findOneAndUpdate(
      {
        _id: joinGroupPayload.groupId,
        members: { $ne: user._id }
      },
      {
        $addToSet: { members: user._id }
      },
      {
        new: true
      }
    )
      .populate([
        { path: 'admin', select: '-password' },
        { path: 'members', select: '-password' },
        {
          path: 'messages',
          populate: [
            {
              path: 'sender',
              select: '-password',
            },
          ]
        }
      ])
      .exec();

    if (!group) {
      const existingGroup = await this.groupModel.findById(joinGroupPayload.groupId);
      if (!existingGroup) {
        throw new NotFoundException('Group not found');
      }
      throw new ConflictException('User is already a member of this group');
    }

    return group;
  }

  async leaveGroup(leaveGroupPayload: GroupMembershipDto): Promise<GroupDocument> {

    const user = await this.userService.findOne(leaveGroupPayload.userId);
    console.log('this is the leaveGroupPayload : ', leaveGroupPayload);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const groupId = leaveGroupPayload.groupId;
    const userId = user._id;

    const group = await this.groupModel.findById(groupId).exec();
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.admin.toString() === userId.toString()) {
      // Admin leaves, group is deleted
      await this.delete(groupId);
      return group;
    }

    const updatedGroup = await this.groupModel.findOneAndUpdate(
      {
        _id: groupId,
        members: userId
      },
      {
        $pull: { members: userId }
      },
      { new: true }
    )
      .populate([
        { path: 'admin', select: '-password' },
        { path: 'members', select: '-password' }
      ])
      .exec();

    if (!updatedGroup) {
      throw new NotFoundException('User is not a member of this group');
    }

    return updatedGroup;
  }

  findAll(): Promise<GroupDocument[]> {
    return this.groupModel.find()
      .populate([
        { path: 'admin', select: '-password' },
        { path: 'members', select: '-password' },
        { path: 'messages',
          populate: [
            {
              path: 'sender',
              select: '-password',
            },
          ]
        }
      ])
      .exec();
  }

  findOne(id: string): Promise<GroupDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID format');
    }

    return this.groupModel.findOne({
      _id: new Types.ObjectId(id)
    })
      .populate([
        { path: 'admin', select: '-password' },
        { path: 'members', select: '-password' }
      ])
      .exec();
  }

  async getOneForShowing(groupId: string, userId: string): Promise<GroupDocument> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new BadRequestException('Invalid group ID format');
    }

    const group = await this.groupModel.findOne({
      _id: new Types.ObjectId(groupId)
    })
      .populate([
        { path: 'admin', select: '-password' },
        { path: 'members', select: '-password' }
      ])
      .exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isMember = group.members.some(m => m._id.toString() === userId.toString());

    if (isMember) {

      await group.populate({
        path: 'messages',
        populate: [
          {
            path: 'sender',
            select: '-password',
          },

        ]
      });
    } else {
      const groupObject = group.toObject();

      // Remove the messages property
      delete groupObject.messages;

      // Return the plain object, not the Mongoose document
      return groupObject;
    }

    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto): Promise<GroupDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID format');
    }

    const group = await this.groupModel.findById(id);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Handle members to add
    if (updateGroupDto.membersToAdd && updateGroupDto.membersToAdd.length > 0) {
      const newMembers = updateGroupDto.membersToAdd
        .map(memberId => new Types.ObjectId(memberId))
        .filter(memberId => !group.members.includes(memberId));
      group.members.push(...newMembers);
    }

    // Handle members to remove
    if (updateGroupDto.membersToRemove && updateGroupDto.membersToRemove.length > 0) {
      const membersToRemove = updateGroupDto.membersToRemove.map(memberId => memberId.toString());
      group.members = group.members.filter(memberId => !membersToRemove.includes(memberId.toString()));
    }

    // Update name and description
    if (updateGroupDto.name) {
      group.name = updateGroupDto.name;
    }
    if (updateGroupDto.description) {
      group.description = updateGroupDto.description;
    }

    await group.save();

    return this.findOne(id);
  }

  async delete(id: string): Promise<GroupDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid group ID format');
    }
    const result = await this.groupModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Group not found');
    }

    return result;
  }

  async addMessage(groupId: string, messageId: string): Promise<GroupDocument> {
    return this.groupModel.findByIdAndUpdate(
      groupId,
      { $push: { messages: messageId } },
      { new: true }
    ).exec();
  }

  async transferAdmin(groupId: string, currentAdminId: string, newAdminId: string): Promise<GroupDocument> {
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.admin.toString() !== currentAdminId) {
      throw new BadRequestException('Only the current admin can transfer admin rights');
    }

    if (!group.members.includes(new Types.ObjectId(newAdminId))) {
      throw new BadRequestException('New admin must be a member of the group');
    }

    group.admin = new Types.ObjectId(newAdminId);
    return group.save();
  }
}