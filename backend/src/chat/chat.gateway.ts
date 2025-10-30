import { Logger, NotFoundException } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UserService } from "src/user/user.service";
import { ChatService } from "./chat.service";
import { ChatDocument } from "./schemas/chat.schema";
import { MessageService } from "src/message/message.service";
import { Message, MessageDocument, MessageType } from "src/message/schemas/message.schema";

interface TypingPayload {
    reciverId: string; // The user ID that should receive the update
    senderId: string; // The user ID that is typing
}


@WebSocketGateway({
    cors: {
        origin: '*',
    },
    methods: ['GET', 'POST'],
    transports: ["websocket"],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');
    // Map stores userId -> socketId
    private users: Map<string, string> = new Map();

    constructor(
        private userService: UserService,
        private chatService: ChatService,
        private messageService: MessageService,
    ) { }

    async handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        // Ensure userId is present in handshake auth
        const userId = client.handshake.query.userId as string;

        if (!userId) {
            this.logger.error(`Connection failed: userId missing from handshake for socket ${client.id}`);
            client.disconnect(true);
            return;
        }

        const user = await this.userService.findOne(userId);
        if (!user) {
            this.logger.error(`Connection failed: User ${userId} not found`);
            client.disconnect(true);
            return;
        }

        // Store the mapping: userId -> client.id (socket ID)
        this.users.set(userId, client.id);

        // Update user online status
        await this.userService.updateOnlineStatus(userId, true);

        // OPTIONAL: Broadcast online status change to all other users
        // this.server.emit('userOnline', { userId, isOnline: true });
        this.logger.log(`User ${userId} connected. Socket ID: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        // Find the userId associated with the disconnecting socket ID
        const userId = [...this.users.entries()].find(([_, socketId]) => socketId === client.id)?.[0];

        if (userId) {
            // Remove the user from the map
            this.users.delete(userId);

            // Update user online status
            await this.userService.updateOnlineStatus(userId, false);

            // OPTIONAL: Broadcast offline status change to all other users
            // this.server.emit('userOffline', { userId, isOnline: false });
            this.logger.log(`User ${userId} disconnected.`);
        }
    }

    // New handler for room joining
    @SubscribeMessage('joinChat')
    handleJoinChat(client: Socket, payload: { chatId: string }) {
        const { chatId } = payload;

        // 1. Join the room named after the chat ID
        client.join(chatId);

        // 2. OPTIONAL: Leave any previous chat if the user is switching chats
        // client.chats.forEach(chat => {
        //     if (chat !== client.id && chat !== this.server.name && chat !== chatId) {
        //         client.leave(chat);
        //     }
        // });

        this.logger.log(`User ${client.handshake.query.userId} joined chat: ${chatId}`);
    }

    @SubscribeMessage('typingStart')
    handleTypingStart(client: Socket, payload: TypingPayload): void {
        const { reciverId, senderId } = payload;

        console.log(`[Typing] Sender ${senderId} is typing to Receiver ${reciverId}`);

        // 1. Find the target socket ID for the receiver
        const receiverSocketId = this.users.get(reciverId);

        if (receiverSocketId) {
            // 2. Emit the 'typingUpdate' event directly to the receiver's socket
            // We use 'typingUpdate' to prevent confusion with the 'typingStart' event name
            // 'to(receiverSocketId)' ensures only the intended recipient sees the indicator
            this.server.to(receiverSocketId).emit('typingUpdate', {
                senderId: senderId,
            });
            console.log(`[Typing] Broadcasted typing update to socket ${receiverSocketId}`);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(client: Socket, payload: { reciverId: string; content: string; messageType: MessageType }) {
        const { reciverId, content, messageType } = payload;
        const senderId = client.handshake.query.userId as string;

        this.logger.log(`User ${senderId} attempting to send message to ${reciverId}`);
        let message;
        if (!messageType) {
            message = await this.messageService.create({
                sender: senderId,
                reciver: reciverId,
                content,
                messageType: MessageType.TEXT,
            });
        } else {

            // 1. Save message to database
            message = await this.messageService.create({
                sender: senderId,
                reciver: reciverId,
                content,
                messageType,
            });
        }


        // 2. Update or create chat document
        let chat = await this.chatService.findChatBetweenUsers(
            reciverId,
            senderId
        );

        if (!chat) {
            chat = await this.chatService.create({ sender: senderId, reciver: reciverId })
        }

        chat.messages.push(message._id);
        await chat.save();

        client.emit('joinChat', chat._id.toString())

        // 3. Find the recipient's socket ID
        const reciverSocketId = this.users.get(reciverId);

        // 4. Emit the message to the specific recipient's socket
        if (reciverSocketId) {
            this.server.to(reciverSocketId).emit('receiveMessage', message);
            this.logger.log(`Message successfully sent to recipient socket: ${reciverSocketId}`);
        } else {
            // Handle case where recipient is offline or not connected via WS
            this.logger.warn(`Recipient ${reciverId} is not connected or socket ID is unknown.`);
            // You might want to notify the sender that the recipient is offline here
        }

        // 5. OPTIONAL: Emit the message back to the sender so they can see it instantly
        client.to(chat._id.toString()).emit('receiveMessage', message);
    }

    // @SubscribeMessage('receiveMessage')
    // async handleNewMessage(client: Socket, message: MessageDocument) {
    //     // This handler seems designed to mark the message as read/delivered/notified
    //     this.logger.warn(`Message received confirmation for ID: ${message._id.toString()}`);
    //     console.warn('this is the message : ', message);

    //     await this.messageService.update(message._id.toString(), { isNotified: true });
    // }


}
