import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Group } from '../common/interfaces/group';
import type { Message } from '../common/interfaces/message';
import { useSocketStore } from './socketStore';
import { useApiStore } from './apiStore';
import { useAuthStore } from './authStore';
import toast from 'react-hot-toast';



interface GroupState {
  // State
  groups: Group[];
  currentGroup: Group | null;
  groupMessages: Record<string, Message[]>; // groupId -> messages
  typingUsers: Record<string, Set<string>>; // groupId -> Set of userIds
  onlineUsers: Record<string, Set<string>>; // groupId -> Set of userIds
  isLoading: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  error: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (groupData: { name: string; description?: string; adminId: string }) => Promise<Group>;
  updateGroup: (id: string, groupData: Partial<Group>) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
  addMemberToGroup: (groupId: string, userId: string) => Promise<Group>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<Group>;
  joinGroup: (groupId: string, userId: string) => void;
  leaveGroup: (groupId: string, userId: string) => void;
  sendMessageToGroup: (groupId: string, content: string, messageType: string, replyTo?: string, fileName?: string, fileType?: string) => Promise<void>;
  startTypingInGroup: (groupId: string) => void;
  stopTypingInGroup: (groupId: string) => void;
  markMessageAsRead: (groupId: string, messageId: string) => void;
  transferAdmin: (groupId: string, newAdminId: string) => void;
  clearError: () => void;
  setCurrentGroup: (group: Group | null) => void;
  setUserTyping: (groupId: string, userId: string) => void;
  removeUserTyping: (groupId: string, userId: string) => void;
  addNewGroupMessage: (groupId: string, message: Message) => void;

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

      // Actions
      fetchGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.getAll();
          set({ groups: response.data, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch groups';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
        }
      },

      fetchGroupById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.getById(id);
          const group = response.data;

          const onlineMembers = group.members.filter((member) => member.isOnline === true);
          const onlineUserIds: string[] = onlineMembers.map((member) => member._id);

          set({
            currentGroup: group,
            groupMessages: {
              ...get().groupMessages,
              [id]: group?.messages || []
            },
            onlineUsers: {
              ...get().onlineUsers,
              [id]: new Set(onlineUserIds)
            },
            isLoading: false
          });

        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch group';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
        }
      },

      createGroup: async (groupData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.create(groupData);
          const newGroup = response.data;

          set(state => ({
            groups: [...state.groups, newGroup],
            isLoading: false
          }));

          toast.success('Group created successfully!');
          return newGroup;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to create group';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      updateGroup: async (id, groupData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.update(id, groupData);
          const updatedGroup = response.data;

          set(state => ({
            groups: state.groups.map(group =>
              group._id === id ? updatedGroup : group
            ),
            currentGroup: state.currentGroup?._id === id ? updatedGroup : state.currentGroup,
            isLoading: false
          }));

          toast.success('Group updated successfully!');
          return updatedGroup;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update group';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      deleteGroup: async (id) => {
        const socket = useSocketStore.getState().socket;
        set({ isLoading: true, error: null });
        try {
          await useApiStore.getState().groupAPI.delete(id);

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
          toast.success('Group deleted successfully!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to delete group';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      addMemberToGroup: async (groupId, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.addMember(groupId, { userId });
          const updatedGroup = response.data;

          set(state => ({
            groups: state.groups.map(group =>
              group._id === groupId ? updatedGroup : group
            ),
            currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
            isLoading: false
          }));

          toast.success('Member added successfully!');
          return updatedGroup;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to add member to group';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      removeMemberFromGroup: async (groupId, userId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.removeMember(groupId, { userId });
          const updatedGroup = response.data;

          set(state => ({
            groups: state.groups.map(group =>
              group._id === groupId ? updatedGroup : group
            ),
            currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
            isLoading: false
          }));

          toast.success('Member removed successfully!');
          return updatedGroup;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to remove member from group';
          set({
            error: errorMessage,
            isLoading: false
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      joinGroup: async (groupId, userId) => {

        const socket = useSocketStore.getState().socket;

        if (!socket) {
          useSocketStore.getState().initializeSocket(userId)
        }

        let { currentGroup } = get();

        if (currentGroup && currentGroup._id === groupId) {
          const isMember = currentGroup.members.some(member => member._id === userId);
          if (!socket) {
            useSocketStore.getState().initializeSocket(userId)
          }

          if (isMember) {
            return;
          }
        }

        set({ isJoining: true, error: null });
        try {

          socket?.emit('joinGroup', { groupId, userId });
          socket?.on('groupMemberJoined', (data) => {
            set({
              currentGroup: data.group,
              groupMessages: { [data.group._id]: data.group?.messages || [] },
              isJoining: false
            })
            toast.success('Joined group successfully!');
          })

        } catch (error: any) {
          const errorMessage = error?.message || error?.response?.data?.message || 'Failed to join group';
          set({
            error: errorMessage,
            isJoining: false
          })
          toast.error(errorMessage);
        }
      },

      leaveGroup: async (groupId, userId) => {
        const socket = useSocketStore.getState().socket;
        set({ isLeaving: true, error: null });

        try {

          socket?.emit('leaveGroup', { groupId, userId });

          // Set a timeout to reset the state if we don't get a response
          const timeoutId = setTimeout(() => {
            set({ isLeaving: false });
            toast.error('Failed to leave group. Please try again.');
          }, 5000);

          socket?.once('groupMemberLeft', (data) => {
            clearTimeout(timeoutId);
            console.log('this is inside the groupMemberLeft : ', data);

            set({
              currentGroup: data.group,
              groupMessages: { [data.group._id]: data.group?.messages || [] },
              isLeaving: false
            })
            toast.success('Left group successfully!');
          })



        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to leave group';
          set({
            error: errorMessage,
            isLeaving: false
          })
          toast.error(errorMessage);
        }
      },

      sendMessageToGroup: async (groupId, content, messageType, replyTo, fileName, fileType) => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit('sendMessageToGroup', { groupId, content, messageType, replyTo, fileName, fileType });
        }
      },

      startTypingInGroup: (groupId) => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit('typingInGroup', { groupId, isTyping: true });
        }
      },

      stopTypingInGroup: (groupId) => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit('typingInGroup', { groupId, isTyping: false });
        }
      },

      markMessageAsRead: (groupId, messageId) => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit('markMessageAsRead', { groupId, messageId });
        }
      },

      transferAdmin: (groupId, newAdminId) => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit('transferAdmin', { groupId, newAdminId });
        }
      },

      clearError: () => set({ error: null }),

      setCurrentGroup: (group) => set({ currentGroup: group }),

      setUserTyping: (groupId, userId) => {
        const { typingUsers } = get();
        const groupTypingUsers = typingUsers[groupId] || new Set();

        groupTypingUsers.add(userId);

        set({
          typingUsers: {
            ...typingUsers,
            [groupId]: new Set(groupTypingUsers)
          }
        });
      },

      removeUserTyping: (groupId, userId) => {
        const { typingUsers } = get();
        const groupTypingUsers = typingUsers[groupId] || new Set();

        groupTypingUsers.delete(userId);

        set({
          typingUsers: {
            ...typingUsers,
            [groupId]: new Set(groupTypingUsers)
          }
        });
      },


      addNewGroupMessage: (groupId, message) => {
        const user = useAuthStore.getState().user
        set(state => {
          const currentMessages = state.groupMessages[groupId] || [];
          if (currentMessages.some(m => m._id === message._id)) {
            return state;
          }

          if (typeof message.sender === 'object' && message.sender?._id !== user?._id) {
            toast.success(`${message.sender?.username} has sent a new message!`)
          }

          return {
            groupMessages: {
              ...state.groupMessages,
              [groupId]: [...currentMessages, message]
            }
          };
        });
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