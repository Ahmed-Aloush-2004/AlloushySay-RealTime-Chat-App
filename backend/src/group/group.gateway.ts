import { Logger, NotFoundException, UseGuards } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MessageService } from "src/message/message.service";
import { UserService } from "src/user/user.service";
import { GroupService } from "./group.service";
import { MessageType } from "src/message/schemas/message.schema";
import { AuthGuard } from "@nestjs/passport";

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  methods: ['GET', 'POST'],
  transports: ["websocket", "polling"],
})
export class GroupGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('GroupGateway');

  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private groups: Map<string, Set<string>> = new Map(); // groupId -> Set of userIds

  constructor(
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly groupService: GroupService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      this.logger.warn(`Connection rejected: No userId provided`);
      client.disconnect();
      return;
    }

    // Verify user exists
    const user = await this.userService.findOne(userId);
    if (!user) {
      this.logger.warn(`Connection rejected: User ${userId} not found`);
      client.disconnect();
      return;
    }

    this.userSockets.set(userId, client.id);
    this.logger.log(`User ${userId} connected with socket ${client.id}`);

    // Join all groups the user is a member of
    const groups = await this.groupService.findAll();
    const userGroups = groups.filter(group => 
      group.members.some(member => member._id.toString() === userId)
    );

    userGroups.forEach(group => {
      client.join(group._id.toString());
      if (!this.groups.has(group._id.toString())) {
        this.groups.set(group._id.toString(), new Set());
      }
      this.groups.get(group._id.toString()).add(userId);
      
      // Notify other members that this user is online
      client.to(group._id.toString()).emit('userOnline', { 
        groupId: group._id.toString(), 
        userId 
      });
      
    });
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.userSockets.entries())
      .find(([_, socketId]) => socketId === client.id)?.[0];

    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(`User ${userId} disconnected`);

      // Leave all groups and notify other members
      this.groups.forEach((members, groupId) => {
        if (members.has(userId)) {
          members.delete(userId);
          client.to(groupId).emit('userOffline', { 
            groupId, 
            userId 
          });
        }
      });
    }
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(client: Socket, payload: { groupId: string, userId: string }) {
    const { groupId, userId } = payload;
    console.error('this is the payload : ',payload);
    

    try {
      const group = await this.groupService.joinGroup(payload);
      console.log('this is something!!!!!!!!');
      
      // Join socket room
      client.join(groupId);
      
      // Update groups map
      if (!this.groups.has(groupId)) {
        this.groups.set(groupId, new Set());
      }
      this.groups.get(groupId).add(userId);

      this.logger.log(`User ${userId} joined group ${groupId}`);

      // Emit to all clients in the group
      this.server.to(groupId).emit('groupMemberJoined', { 
        group,
        userId
      });

      return { success: true, group };

      
    } catch (error) {
      this.logger.error(`Error joining group: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(client: Socket, payload: { groupId: string, userId: string }) {
    const { groupId, userId } = payload;
 
    try { 
      console.log('this is something!!!!!!!! payload : ', payload );
      const group = await this.groupService.leaveGroup(payload);
      console.log('this is something!!!!!!!!');
      
      // Leave socket room
      client.leave(groupId);
      
      // Update groups map
      if (this.groups.has(groupId)) {
        this.groups.get(groupId).delete(userId);
      }

      this.logger.log(`User ${userId} left group ${groupId}`);

      // Emit to all clients in the group
      this.server.to(groupId).emit('groupMemberLeft', { 
        groupId,
        userId,
        group
      });

      return { success: true, group };
    } catch (error) {
      this.logger.error(`Error leaving group: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('sendMessageToGroup')
  async handleGroupMessage(client: Socket, payload: { 
    groupId: string; 
    content: string; 
    messageType?: MessageType;
    replyTo?: string;
  }) {
    const { groupId, content, messageType, replyTo } = payload;
    const senderId = client.handshake.query.userId as string;

    try {
      // Verify user is a member of the group
      const group = await this.groupService.findOne(groupId);
      if (!group) {
        throw new NotFoundException('Group not found');
      }

      const isMember = group.members.some(member => member._id.toString() === senderId);
      if (!isMember) {
        throw new Error('You are not a member of this group');
      }

      // Create message
      const createdMessage = await this.messageService.create({
        content,
        sender: senderId,
        reciver: null,
        messageType: messageType || MessageType.TEXT,
        replyTo, 
      });

      // Add message to group
      await this.groupService.addMessage(groupId, createdMessage._id.toString());

      // Populate sender info
      await createdMessage.populate('sender', '-password');

      this.logger.log(`User ${senderId} sent message to group ${groupId}: ${content}`);

      // Emit to all clients in the group
      this.server.to(groupId).emit('newGroupMessage', {
        groupId,
        senderId,
        message: createdMessage,
      });

      return { success: true, message: createdMessage };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typingInGroup')
  handleTypingInGroup(client: Socket, payload: { groupId: string; isTyping: boolean }) {
    const { groupId, isTyping } = payload;
    const senderId = client.handshake.query.userId as string;
    
    client.to(groupId).emit('groupTypingUpdate', {
      groupId,
      senderId,
      isTyping,
    });
    
    this.logger.log(`User ${senderId} is ${isTyping ? 'typing' : 'not typing'} in group ${groupId}`);
  }

  @SubscribeMessage('markMessageAsRead')
  async handleMarkMessageAsRead(client: Socket, payload: { groupId: string; messageId: string }) {
    const { groupId, messageId } = payload;
    const userId = client.handshake.query.userId as string;

    try {
      // Update message read status
      await this.messageService.markAsRead(messageId, userId);

      // Notify sender that message was read
      const message = await this.messageService.findOne(messageId);
      if (message && message.sender.toString() !== userId) {
        this.server.to(this.userSockets.get(message.sender.toString()) || '').emit('messageRead', {
          groupId,
          messageId,
          userId
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('transferAdmin')
  async handleTransferAdmin(client: Socket, payload: { groupId: string; newAdminId: string }) {
    const { groupId, newAdminId } = payload;
    const currentAdminId = client.handshake.query.userId as string;

    try {
      const group = await this.groupService.transferAdmin(groupId, currentAdminId, newAdminId);
      
      // Populate admin info
      await group.populate('admin', '-password');

      this.logger.log(`Admin rights transferred from ${currentAdminId} to ${newAdminId} in group ${groupId}`);

      // Emit to all clients in the group
      this.server.to(groupId).emit('adminTransferred', {
        groupId,
        oldAdminId: currentAdminId,
        newAdminId,
        group
      });

      return { success: true, group };
    } catch (error) {
      this.logger.error(`Error transferring admin: ${error.message}`);
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }
}