import type { User } from "./user";

// export enum MessageType {
//   TEXT = 'text',
//   IMAGE = 'image',
//   VIDEO = 'video',
//   RAW = 'raw'
// }
export interface Message {
    _id: string;
    content: string;
    sender: User | string;  // Can be populated user object or user ID
    reciver?: User | string | null; // Can be populated user object or user ID
    messageType: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    isNotified: boolean;
    isRead: boolean;
    replyTo: Message | null;
    fileName?: string;
    fileType?: string;
    readBy?: User | string;
}   