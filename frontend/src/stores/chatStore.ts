import { create } from 'zustand';
import type { Message } from '../common/interfaces/message';
import type { User } from '../common/interfaces/user';
import type { Chat } from '../common/interfaces/chat';
import { showNotification } from '../services/notification';
import { useSocketStore } from './socketStore';
import { useApiStore } from './apiStore';
import toast from 'react-hot-toast';

interface ChatState {
  messages: Message[];
  isLoading: boolean,
  error: string | null;
  chats: Chat[];
  currentChat: string | null;
  onlineUsers: User[]; // Array of user objects, not just IDs
}

type ChatActions = {
  getChatMessagesForUsers: (senderId: string, receiverId: string) => Promise<void>;
  getMyChats: () => Promise<void>;
  sendMessage: (message: Message) => void;
  reciveMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addUserOnline: (user: User) => void;
  removeUserOffline: (userId: string) => void;
}

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({

  isLoading: false,
  error: null,
  messages: [],
  chats: [],
  currentChat: null,
  onlineUsers: [],




  getMyChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await useApiStore.getState().chatAPI.getMyChats();
      set({
        chats: response.data,
        isLoading: false,
      });
    }
    catch (err: Error | any) {
      console.error("Failed to fetch chats:", err);
      set({
        isLoading: false, error: err.message || 'Failed to load chats. Please try again.'
      });
    }
  },

  getChatMessagesForUsers: async (senderId: string, receiverId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await useApiStore.getState().chatAPI.getChatMessages(senderId, receiverId);
      set({
        messages: response.data.messages as Message[],
        isLoading: false,
      });
      toast.success('Messages loaded successfully!');
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
      set({
        messages: [],
        isLoading: false,
        error: 'Failed to load messages. Please try again.',
      });
      toast.error('Failed to load messages.');
    }
  },


  sendMessage: (message: Message) => {
    const  socket  = useSocketStore.getState().socket;
    if (socket) {
      socket.emit('sendMessage', message);
    }
  },

  reciveMessage: () => {

    const  socket  = useSocketStore.getState().socket;

    if (socket) {
      socket.on('reciveMessage', (message: Message) => {
        set({ messages: [...get().messages, message] })
        if (typeof message.sender === 'object' && message.sender) {
          showNotification(message.sender.username, message?.content, new Date().toDateString())
        }
        toast.success('New message received!');
      });
    }
  },

  setMessages: (messages: Message[]) => set({ messages }),

  addMessage: (message: Message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  addUserOnline: (user: User) => set((state) => ({
    onlineUsers: [...state.onlineUsers, user]
  })),

  removeUserOffline: (userId: string) => set((state) => ({
    onlineUsers: state.onlineUsers.filter(user => user._id !== userId)
  })),

}));