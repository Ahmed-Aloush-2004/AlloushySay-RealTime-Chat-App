// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import type { Group } from '../common/interfaces/group';
// import type { Message } from '../common/interfaces/message';
// import { useSocketStore } from './socketStore';
// import { useApiStore } from './apiStore';
// import { useAuthStore } from './authStore';

// interface GroupMessage extends Message {
//   groupId: string;
// }

// interface GroupState {
//   // State
//   groups: Group[];
//   currentGroup: Group | null;
//   groupMessages: Record<string, GroupMessage[]>; // groupId -> messages
//   typingUsers: Record<string, Set<string>>; // groupId -> Set of userIds
//   onlineUsers: Record<string, Set<string>>; // groupId -> Set of userIds
//   isLoading: boolean;
//   isJoining: boolean;
//   isLeaving: boolean;
//   error: string | null;

//   // Actions
//   fetchGroups: () => Promise<void>;
//   fetchGroupById: (id: string) => Promise<void>;
//   createGroup: (groupData: { name: string; description?: string; adminId: string }) => Promise<Group>;
//   updateGroup: (id: string, groupData: Partial<Group>) => Promise<void>;
//   deleteGroup: (id: string) => Promise<void>;
//   addMemberToGroup: (groupId: string, userId: string) => Promise<void>;
//   removeMemberFromGroup: (groupId: string, userId: string) => Promise<void>;
//   joinGroup: (groupId: string, userId: string) => void;
//   leaveGroup: (groupId: string) => void;
//   sendMessageToGroup: (groupId: string, content: string, messageType: string, replyTo?: string) => Promise<void>;
//   startTypingInGroup: (groupId: string) => void;
//   stopTypingInGroup: (groupId: string) => void;
//   markMessageAsRead: (groupId: string, messageId: string) => void;
//   transferAdmin: (groupId: string, newAdminId: string) => void;
//   clearError: () => void;
//   setCurrentGroup: (group: Group | null) => void;

// }

// export const useGroupStore = create<GroupState>()(
//   persist(
//     (set, get) => ({
//       // Initial state
//       groups: [],
//       currentGroup: null,
//       groupMessages: {},
//       typingUsers: {},
//       onlineUsers: {},
//       isLoading: false,
//       isJoining: false,
//       isLeaving: false,
//       error: null,

//       // Actions
//       fetchGroups: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await useApiStore.getState().groupAPI.getAll();
//           set({ groups: response.data, isLoading: false });
//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to fetch groups',
//             isLoading: false
//           });
//         }
//       },

//       fetchGroupById: async (id: string) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await useApiStore.getState().groupAPI.getById(id);
//           const group = response.data;
//           set({
//             currentGroup: group,
//             groupMessages: {
//               ...get().groupMessages,
//               [id]: group?.messages || []
//             },
//             isLoading: false
//           });

//           console.log('this is the groupMessages : ', groupMessages);


//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to fetch group',
//             isLoading: false
//           });
//         }
//       },

//       createGroup: async (groupData) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await useApiStore.getState().groupAPI.create(groupData);
//           const newGroup = response.data;

//           set(state => ({
//             groups: [...state.groups, newGroup],
//             isLoading: false
//           }));

//           return newGroup;
//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to create group',
//             isLoading: false
//           });
//           throw error;
//         }
//       },

//       updateGroup: async (id, groupData) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await useApiStore.getState().groupAPI.update(id, groupData);
//           const updatedGroup = response.data;

//           set(state => ({
//             groups: state.groups.map(group =>
//               group._id === id ? updatedGroup : group
//             ),
//             currentGroup: state.currentGroup?._id === id ? updatedGroup : state.currentGroup,
//             isLoading: false
//           }));

//           return updatedGroup;
//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to update group',
//             isLoading: false
//           });
//           throw error;
//         }
//       },

//       deleteGroup: async (id) => {
//         const socket = useSocketStore.getState().socket;
//         set({ isLoading: true, error: null });
//         try {
//           await useApiStore.getState().groupAPI.delete(id);

//           if (socket) {
//             socket.emit('deleteGroup', { groupId: id });
//           }

//           set(state => {
//             const newGroups = state.groups.filter(group => group._id !== id);
//             const newGroupMessages = { ...state.groupMessages };
//             delete newGroupMessages[id];

//             return {
//               groups: newGroups,
//               currentGroup: state.currentGroup?._id === id ? null : state.currentGroup,
//               groupMessages: newGroupMessages,
//               isLoading: false
//             };
//           });
//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to delete group',
//             isLoading: false
//           });
//           throw error;
//         }
//       },

//       addMemberToGroup: async (groupId, userId) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await useApiStore.getState().groupAPI.addMember(groupId, { userId });
//           const updatedGroup = response.data;

//           set(state => ({
//             groups: state.groups.map(group =>
//               group._id === groupId ? updatedGroup : group
//             ),
//             currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
//             isLoading: false
//           }));

//           return updatedGroup;
//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to add member to group',
//             isLoading: false
//           });
//           throw error;
//         }
//       },

//       removeMemberFromGroup: async (groupId, userId) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await useApiStore.getState().groupAPI.removeMember(groupId, { userId });
//           const updatedGroup = response.data;

//           set(state => ({
//             groups: state.groups.map(group =>
//               group._id === groupId ? updatedGroup : group
//             ),
//             currentGroup: state.currentGroup?._id === groupId ? updatedGroup : state.currentGroup,
//             isLoading: false
//           }));

//           return updatedGroup;
//         } catch (error: any) {
//           set({
//             error: error.response?.data?.message || error.message || 'Failed to remove member from group',
//             isLoading: false
//           });
//           throw error;
//         }
//       },

//       joinGroup: async (groupId, userId) => {

//         const socket = useSocketStore.getState().socket;

//         if (!socket) {
//           useSocketStore.getState().initializeSocket(userId)
//         }

//         let { currentGroup } = get();

//         // Check if user is already a member
//         if (currentGroup && currentGroup._id === groupId) {
//           const isMember = currentGroup.members.some(member => member._id === userId);
//           if (!socket) {
//             useSocketStore.getState().initializeSocket(userId)
//           }

//           if (isMember) {
//             return;
//           }
//         }

//         set({ isJoining: true, error: null });
//         try {

//           socket?.emit('joinGroup', { groupId, userId });
//           socket?.on('groupMemberJoined', (data) => {
//             set({
//               currentGroup: data.group,
//               groupMessages: { [data.group._id]: data.group?.messages || [] },
//               isJoining: false
//             })
//           })

//         } catch (error) {
//           set({
//             error: error?.message || error?.response?.data?.message || 'Failed to join group',
//             isJoining: false
//           })
//         }
//       },

//       leaveGroup: async (groupId) => {
//         const socket = useSocketStore.getState().socket;
//         set({ isLeaving: true, error: null });

//         try {

//           socket?.emit('leaveGroup', { groupId, userId: useAuthStore().user?._id });

//           socket?.on('groupMemberLeft', (data) => {
//             set({
//               currentGroup: data.group,
//               groupMessages: { [data.group._id]: data.group?.messages || [] },
//               isLeaving: false
//             })
//           })
//         } catch (error) {
//           set({
//             error: error?.response?.data?.message || error?.message || 'Failed to leave group',
//             isLeaving: false
//           })
//         }
//       },

//       sendMessageToGroup: async (groupId, content, messageType, replyTo) => {
//         const socket = useSocketStore.getState().socket;
//         if (socket) {
//           socket.emit('sendMessageToGroup', { groupId, content, messageType, replyTo });
//         }

//       },

//       startTypingInGroup: (groupId) => {
//         const socket = useSocketStore.getState().socket;
//         if (socket) {          
//           socket.emit('typingInGroup', { groupId, isTyping: true });
//         }
//       },

//       stopTypingInGroup: (groupId) => {
//         const socket = useSocketStore.getState().socket;
//         if (socket) {
//           socket.emit('typingInGroup', { groupId, isTyping: false });
//         }
//       },

//       markMessageAsRead: (groupId, messageId) => {
//         const socket = useSocketStore.getState().socket;
//         if (socket) {
//           socket.emit('markMessageAsRead', { groupId, messageId });
//         }
//       },

//       transferAdmin: (groupId, newAdminId) => {
//         const socket = useSocketStore.getState().socket;
//         if (socket) {
//           socket.emit('transferAdmin', { groupId, newAdminId });
//         }
//       },

//       clearError: () => set({ error: null }),

//       setCurrentGroup: (group) => set({ currentGroup: group }),

//     }),
//     {
//       name: 'group-storage',
//       partialize: (state) => ({
//         groups: state.groups,
//         currentGroup: state.currentGroup
//       }),
//     }
//   )
// );



import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Group } from '../common/interfaces/group';
import type { Message } from '../common/interfaces/message';
import { useSocketStore } from './socketStore';
import { useApiStore } from './apiStore';
import { useAuthStore } from './authStore';

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
          set({
            error: error.response?.data?.message || error.message || 'Failed to fetch groups',
            isLoading: false
          });
        }
      },

      fetchGroupById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await useApiStore.getState().groupAPI.getById(id);
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
          const response = await useApiStore.getState().groupAPI.create(groupData);
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
          const response = await useApiStore.getState().groupAPI.update(id, groupData);
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
          const response = await useApiStore.getState().groupAPI.addMember(groupId, { userId });
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
          const response = await useApiStore.getState().groupAPI.removeMember(groupId, { userId });
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

        const socket = useSocketStore.getState().socket;

        if (!socket) {
          useSocketStore.getState().initializeSocket(userId)
        }

        let { currentGroup } = get();

        // Check if user is already a member
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
          })

        } catch (error) {
          set({
            error: error?.message || error?.response?.data?.message || 'Failed to join group',
            isJoining: false
          })
        }
      },

      leaveGroup: async (groupId) => {
        const socket = useSocketStore.getState().socket;
        set({ isLeaving: true, error: null });

        try {

          socket?.emit('leaveGroup', { groupId, userId: useAuthStore().user?._id });

          socket?.on('groupMemberLeft', (data) => {
            set({
              currentGroup: data.group,
              groupMessages: { [data.group._id]: data.group?.messages || [] },
              isLeaving: false
            })
          })
        } catch (error) {
          set({
            error: error?.response?.data?.message || error?.message || 'Failed to leave group',
            isLeaving: false
          })
        }
      },

      sendMessageToGroup: async (groupId, content, messageType, replyTo) => {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit('sendMessageToGroup', { groupId, content, messageType, replyTo });
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

        // Add user to the typing set
        groupTypingUsers.add(userId);

        // Update state
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

        // Remove user from the typing set
        groupTypingUsers.delete(userId);

        // Update state
        set({
          typingUsers: {
            ...typingUsers,
            [groupId]: new Set(groupTypingUsers)
          }
        });
      },


      // NEW: Implementation for adding a new message from socket
      addNewGroupMessage: (groupId, message) => {
        set(state => {
          const currentMessages = state.groupMessages[groupId] || [];
          // Prevent adding duplicate messages
          if (currentMessages.some(m => m._id === message._id)) {
            return state;
          }
          return {
            groupMessages: {
              ...state.groupMessages,
              [groupId]: [...currentMessages, message]
            }
          };
        });
      },

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