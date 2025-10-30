// src/store/messageStore.ts (Example file name)
import { create } from "zustand";
import { chatAPI } from "../services/api"; // Adjust the import path as needed
import type { Message } from "../common/interfaces/message";

// --- Store Interfaces (Refined based on your provided data) ---






interface MessageState {
  /** The array of messages for the currently viewed chat. */
  messages: Message[];
  /** Loading state for fetching messages. */
  isLoading: boolean;
  /** Error state for message fetching. */
  error: string | null;
  /** Action to fetch chat messages for a specific sender and receiver. */
  getChatMessagesForUsers: (senderId: string, receiverId: string) => Promise<void>;
  /** Action to clear the current chat messages. */
  clearMessages: () => void;
  /** Optional: Action to add a new message locally (e.g., after sending). */
  addMessage: (message: Message) => void;
}

// --- Zustand Store Implementation ---

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  /**
   * Fetches chat messages between two users and updates the store state.
   * @param senderId The ID of the first user.
   * @param receiverId The ID of the second user.
   */
  getChatMessagesForUsers: async (senderId: string, reciverId: string) => {
    // 1. Set loading state
    set({ isLoading: true, error: null });

    try {
      // 2. Call the API function
      const response = await chatAPI.getChatMessages(senderId, reciverId);
      // console.log('this is the getChatMessagesForUsers : ', response);


      // 3. Update the store with the fetched messages
      set({
        messages: response.data.messages || [],
        isLoading: false,
      });
    } catch (err) {
      // 4. Handle errors
      console.error("Failed to fetch chat messages:", err);
      set({
        messages: [],
        isLoading: false,
        error: 'Failed to load messages. Please try again.',
      });
    }
  },

  /** Clears all messages from the store. */
  clearMessages: () => {
    set({ messages: [], error: null });
  },

  /** Adds a new message to the current list (useful for real-time updates or post-send). */
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },
}));
