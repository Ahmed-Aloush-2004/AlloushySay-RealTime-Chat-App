import type { Message } from "./message";
import type { User } from "./user";


// common/interfaces/chat.ts
export interface Chat {
  _id: string;
  sender: User | string;
  reciver: User | string;
  messages: Message[] | string[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}