import type { Message } from "./message";
import type { User } from "./user";


export interface Group {
    _id: string;
    name: string;
    description?: string  | null;
    members: User[];
    messages?: Message[] | null;
    admin: User;
    unreadCount?: number;
}