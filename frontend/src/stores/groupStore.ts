import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { groupAPI } from '../services/api';
import { initializeSocket } from '../services/socket';
import type { Group } from '../common/interfaces/group';
import type { Message } from '../common/interfaces/message';
import { showNotification } from '../services/notification';

interface GroupMessage extends Message {
  groupId: string;
}

interface GroupState {
  // State
  groups: Group[];
  currentGroup: Group | null;
  groupMessages: Record<string, GroupMessage[]>; // groupId -> messages
  typingUsers: Record<string, Set<string>>; // groupId -> Set of userIds
  onlineUsers: Record<string, Set<string>>; // groupId -> Set of userIds
  isLoading: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  error: string | null;
  socket: any | null;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (groupData: { name: string; description?: string; adminId: string }) => Promise<Group>;
  updateGroup: (id: string, groupData: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addMemberToGroup: (groupId: string, userId: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<void>;
  joinGroup: (groupId: string, userId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessageToGroup: (groupId: string, content: string, messageType: string, replyTo?: string) => Promise<void>;
  startTypingInGroup: (groupId: string) => void;
  stopTypingInGroup: (groupId: string) => void;
  markMessageAsRead: (groupId: string, messageId: string) => void;
  transferAdmin: (groupId: string, newAdminId: string) => void;
  clearError: () => void;
  setCurrentGroup: (group: Group | null) => void;
  initializeSocket: (userId: string) => void;
  disconnectSocket: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      // Initial state
      groups: [],
      currentGroup: null,
      groupMessages: {},
      typingUsers: {},
      onlineUsers: {},
      isLoading: false,
      isJoining: false,
      isLeaving: false,
      error: null,
      socket: null,

      // Actions
      fetchGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupAPI.getAll();
          set({ groups: response.data, isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to fetch groups',
            isLoading: false
          });
        }
      },

      fetchGroupById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupAPI.getById(id);
          const group = response.data;
          set({
            currentGroup: group,
            groupMessages: {
              ...get().groupMessages,
              [id]: group?.messages || []
            },
            isLoading: false
          });

          console.log('this is the groupMessages : ', groupMessages);


        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to fetch group',
            isLoading: false
          });
        }
      },

      createGroup: async (groupData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupAPI.create(groupData);
          const newGroup = response.data;

          set(state => ({
            groups: [...state.groups, newGroup],
            isLoading: false
          }));

          return newGroup;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to create group',
            isLoading: false
          });
          throw error;
        }
      },

      updateGroup: async (id, groupData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupAPI.update(id, groupData);
          const updatedGroup = response.data;

          set(state => ({
            groups: state.groups.map(group =>
              group._id === id ? updatedGroup : group
            ),
            currentGroup: state.currentGroup?._id === id ? updatedGroup : state.currentGroup,
            isLoading: false
          }));

          return updatedGroup;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to update group',
            isLoading: false
          });
          throw error;
        }
      },

      deleteGroup: async (id) => {
        const { socket } = get();

        set({ isLoading: true, error: null });
        try {
          await groupAPI.delete(id);

          if (socket) {
            socket.emit('deleteGroup', { groupId: id });
          }

          set(state => {
            const newGroups = state.groups.filter(group => group._id !== id);
            const newGroupMessages = { ...state.groupMessages };
            delete newGroupMessages[id];

            return {
              groups: newGroups,
              currentGroup: state.currentGroup?._id === id ? null : state.currentGroup,
              groupMessages: newGroupMessages,
              isLoading: false
            };
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to delete group',
            isLoading: false
          });
          throw error;
        }
      },

      addMemberToGroup: async (groupId, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupAPI.addMember(groupId, { userId });
          const updatedGroup = response.data;

          set(state => ({
            groups: state.groups.map(group =>
              group._id === groupId ? updatedGroup : group
            ),
            currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
            isLoading: false
          }));

          return updatedGroup;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to add member to group',
            isLoading: false
          });
          throw error;
        }
      },

      removeMemberFromGroup: async (groupId, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await groupAPI.removeMember(groupId, { userId });
          const updatedGroup = response.data;

          set(state => ({
            groups: state.groups.map(group =>
              group._id === groupId ? updatedGroup : group
            ),
            currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
            isLoading: false
          }));

          return updatedGroup;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to remove member from group',
            isLoading: false
          });
          throw error;
        }
      },

      joinGroup: async (groupId, userId) => {
        let { socket, currentGroup } = get();

        // Check if user is already a member
        if (currentGroup && currentGroup._id === groupId) {
          const isMember = currentGroup.members.some(member => member._id === userId);
          if (!socket) {
            socket = initializeSocket(userId)
          }

          if (isMember) {
            return;
          }
        }

        if (socket) {
          socket.emit('joinGroup', { groupId, userId });
        }
      },

      leaveGroup: async (groupId) => {
        const { socket } = get();

        set({ isLeaving: true, error: null });
        try {
          const response = await groupAPI.leaveGroup(groupId);
          set({
            currentGroup: response.data,
            groupMessages: response.data?.messages,
            isLeaving: false
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Failed to leave group',
            isLeaving: false
          });
        }

        if (socket) {
          const userId = localStorage.getItem('userId');
          socket.emit('leaveGroup', { groupId, userId });
        }
      },

      sendMessageToGroup: async (groupId, content, messageType, replyTo) => {
        const { socket } = get();

        if (socket) {
          const userId = localStorage.getItem('userId');
          socket.emit('sendMessageToGroup', { groupId, content, messageType, replyTo });
        }

      },

      startTypingInGroup: (groupId) => {
        const { socket } = get();
        if (socket) {
          socket.emit('typingInGroup', { groupId, isTyping: true });
        }
      },

      stopTypingInGroup: (groupId) => {
        const { socket } = get();
        if (socket) {
          socket.emit('typingInGroup', { groupId, isTyping: false });
        }
      },

      markMessageAsRead: (groupId, messageId) => {
        const { socket } = get();
        if (socket) {
          socket.emit('markMessageAsRead', { groupId, messageId });
        }
      },

      transferAdmin: (groupId, newAdminId) => {
        const { socket } = get();
        if (socket) {
          socket.emit('transferAdmin', { groupId, newAdminId });
        }
      },

      clearError: () => set({ error: null }),

      setCurrentGroup: (group) => set({ currentGroup: group }),

      initializeSocket: (userId) => {
        const socket = initializeSocket(userId);
        if (!socket) return;


        socket.on('newGroupMessage', (data: { groupId: string; senderId: string; message: GroupMessage }) => {
          const { groupId, message } = data;
          set(state => {
            const existingMessages = state.groupMessages[groupId] || [];
            const messageExists = existingMessages.find(msg => msg._id === message._id);

            if (messageExists) {
              return state; // Message already exists, don't add it again
            }

            showNotification(message.sender?.username,message?.content,groupId)


            return {
              groupMessages: {
                ...state.groupMessages,
                [groupId]: [...existingMessages, message]
              }
            };
          });
        });

        socket.on('groupTypingUpdate', (data: { groupId: string; senderId: string; isTyping: boolean }) => {
          const { groupId, senderId, isTyping } = data;

          set(state => {
            const newTypingUsers = { ...state.typingUsers };

            if (isTyping) {
              if (!newTypingUsers[groupId]) {
                newTypingUsers[groupId] = new Set();
              }
              newTypingUsers[groupId].add(senderId);
            } else {
              if (newTypingUsers[groupId]) {
                newTypingUsers[groupId].delete(senderId);
              }
            }

            return { typingUsers: newTypingUsers };
          });
        });

        socket.on('userOnline', (data: { groupId: string; userId: string }) => {
          const { groupId, userId } = data;

          set(state => {
            const newOnlineUsers = { ...state.onlineUsers };

            if (!newOnlineUsers[groupId]) {
              newOnlineUsers[groupId] = new Set();
            }
            newOnlineUsers[groupId].add(userId);

            return { onlineUsers: newOnlineUsers };
          });
        });

        socket.on('userOffline', (data: { groupId: string; userId: string }) => {
          const { groupId, userId } = data;

          set(state => {
            const newOnlineUsers = { ...state.onlineUsers };

            if (newOnlineUsers[groupId]) {
              newOnlineUsers[groupId].delete(userId);
            }

            return { onlineUsers: newOnlineUsers };
          });
        });

        socket.on('groupMemberJoined', (data: { group: Group; userId: string }) => {
          const { group, userId } = data;
          console.log('this is the group, userId : ', group, userId);
          const groupId = group._id.toString() 
          set(state => ({
            groups: state.groups.map(g => g._id === group._id ? group : g),
            currentGroup: state.currentGroup?._id === group._id ? group : state.currentGroup,
            groupMessages: {
              ...get().groupMessages,
              [groupId]: group?.messages || []
            },
          }));

          // If current user joined the group, update current group
          if (userId === localStorage.getItem('userId')) {
            set({ currentGroup: group });
          }
        });

        socket.on('groupMemberLeft', (data: { groupId: string; userId: string; group: Group }) => {
          const { groupId, userId, group } = data;

          set(state => ({
            groups: state.groups.map(g => g._id === groupId ? group : g),
            currentGroup: state.currentGroup?._id === groupId ? group : state.currentGroup
          }));

          // If current user left the group, clear current group
          if (userId === localStorage.getItem('userId')) {
            set({ currentGroup: null });
          }
        });

        socket.on('adminTransferred', (data: { groupId: string; oldAdminId: string; newAdminId: string; group: Group }) => {
          const { groupId, group } = data;

          set(state => ({
            groups: state.groups.map(g => g._id === groupId ? group : g),
            currentGroup: state.currentGroup?._id === groupId ? group : state.currentGroup
          }));
        });

        socket.on('messageRead', (data: { groupId: string; messageId: string; userId: string }) => {
          const { groupId, messageId, userId } = data;

          set(state => {
            const newGroupMessages = { ...state.groupMessages };

            if (newGroupMessages[groupId]) {
              newGroupMessages[groupId] = newGroupMessages[groupId].map(msg =>
                msg._id === messageId
                  ? { ...msg, isRead: true }
                  : msg
              );
            }

            return { groupMessages: newGroupMessages };
          });
        });

        socket.on('error', (data: { message: string }) => {
          set({ error: data.message });
        });

        set({ socket });
      },

      disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      }
    }),
    {
      name: 'group-storage',
      partialize: (state) => ({
        groups: state.groups,
        currentGroup: state.currentGroup
      }),
    }
  )
);