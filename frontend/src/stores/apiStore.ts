// src/stores/apiStore.ts

import { create } from 'zustand';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// --- Imports for Interfaces (assuming you move them here or reference existing) ---
// You should ensure these interfaces are available (e.g., in src/common/interfaces)
import type { User } from '../common/interfaces/user';
import type { Message } from '../common/interfaces/message';
import type { Chat } from '../common/interfaces/chat';
import type { Group } from '../common/interfaces/group';
import type { FileUploadResponse } from '../common/interfaces/fileUploadResponse';

// --- Type Definitions for API Payloads ---
interface LoginCredentials { email: string; password: string; }
interface RegisterData { username: string; password: string; email: string; }
interface AuthResponse { user: User; accessToken: string; refreshToken: string; }


// --- API URL Constant ---
const API_URL = 'http://localhost:3000';


// --- 1. Axios Instance Factory Function ---
// This function creates the Axios instances, allowing the store to recreate/update them.
const createAxiosInstances = (accessToken: string | null) => {
  // Base API Instance (for JSON communication)
  const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': accessToken ? `Bearer ${accessToken}` : '',
      'Content-Type': 'application/json',
    }
  });

  // File Upload API Instance (no Content-Type specified)
  const fileUploadApi: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': accessToken ? `Bearer ${accessToken}` : '',
      // 'Content-Type': 'multipart/form-data' will be set automatically by the browser
    }
  });

  return { api, fileUploadApi };
};


// --- 2. Define the Store State and Actions ---
interface ApiStoreState {
  // State
  api: AxiosInstance;
  fileUploadApi: AxiosInstance;

  // Actions
  // This is the crucial method to update headers when a user logs in or refreshes a token
  setAuthTokens: (accessToken: string | null) => void; 

  // API Call Helpers (Encapsulated functions for easy use)
  authAPI: {
    getAccessToken: (refreshToken: string) => Promise<AxiosResponse<{ accessToken: string }>>;
    login: (credentials: LoginCredentials) => Promise<AxiosResponse<AuthResponse>>;
    signup: (userData: RegisterData) => Promise<AxiosResponse<AuthResponse>>;
    getProfile: () => Promise<AxiosResponse<User>>;
  };
  userAPI: {
    getAll: () => Promise<AxiosResponse<User[]>>;
    getAllOnline: () => Promise<AxiosResponse<User[]>>;
    getById: (id: string) => Promise<AxiosResponse<User>>;
    update: (id: string, data: Partial<User>) => Promise<AxiosResponse<User>>;
  };
  chatAPI: {
    getMyChats: () => Promise<AxiosResponse<Chat[]>>;
    getChatMessages: (user1: string, user2: string) => Promise<AxiosResponse<Chat>>;
    create: (data: Partial<Message>) => Promise<AxiosResponse<Message>>;
    delete: (id: string) => Promise<AxiosResponse<void>>;
  };
  groupAPI: {
    getAll: () => Promise<AxiosResponse<Group[]>>;
    getById: (id: string) => Promise<AxiosResponse<Group>>;
    create: (data: { name: string; description?: string; adminId: string }) => Promise<AxiosResponse<Group>>;
    update: (id: string, data: Partial<Group>) => Promise<AxiosResponse<Group>>;
    delete: (id: string) => Promise<AxiosResponse<void>>;
    joinGroup: (groupId: string) => Promise<AxiosResponse<Group>>;
    leaveGroup: (groupId: string) => Promise<AxiosResponse<Group>>;
    addMember: (id: string, data: { userId: string }) => Promise<AxiosResponse<Group>>;
    removeMember: (id: string, data: { userId: string }) => Promise<AxiosResponse<Group>>;
    sendMessage: (id: string, data: { content: string; messageType?: string }) => Promise<AxiosResponse<Message>>;
    getMessages: (id: string) => Promise<AxiosResponse<Message[]>>;
  };
  fileAPI: {
    uploadFile: (file: File) => Promise<AxiosResponse<FileUploadResponse>>;
    deleteFile: (publicId: string) => Promise<AxiosResponse<{ message: string }>>;
  };
}


// --- 3. Create the Zustand Store ---
export const useApiStore = create<ApiStoreState>((set, get) => {
  // Initialize with tokens from localStorage (or null if not found)
  const initialToken = localStorage.getItem('accessToken');
  
  let { api, fileUploadApi } = createAxiosInstances(initialToken);
  
  // --- Core API Helpers (Bound to the current 'api' and 'fileUploadApi' instances) ---
  const createApiHelpers = (api: AxiosInstance, fileUploadApi: AxiosInstance) => ({
    authAPI: {
      getAccessToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
      login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
      signup: (userData: RegisterData) => api.post('/auth/signup', userData),
      getProfile: () => api.get('/auth/profile'),
    },
    userAPI: {
      getAll: () => api.get('/users'),
      getAllOnline: () => api.get('/users/online'),
      getById: (id: string) => api.get(`/users/${id}`),
      update: (id: string, data: Partial<User>) => api.patch(`/users/${id}`, data),
    },
    chatAPI: {
      getMyChats: () => api.get(`/chats/myChats`),
      getChatMessages: (user1: string, user2: string) => api.get(`/chats/${user1}/${user2}`),
      create: (data: Partial<Message>) => api.post('/chats', data),
      delete: (id: string) => api.delete(`/chats/${id}`),
    },
    groupAPI: {
      getAll: () => api.get('/group'),
      getById: (id: string) => api.get(`/group/${id}`),
      create: (data: { name: string; description?: string; adminId: string }) =>
        api.post('/group', data),
      update: (id: string, data: Partial<Group>) =>
        api.put(`/group/${id}`, data),
      delete: (id: string) => api.delete(`/group/${id}`),
      joinGroup: (groupId: string) => api.post('/group/joinGroup', { groupId }),
      leaveGroup: (groupId: string) => api.post('/group/leaveGroup', { groupId }),
      addMember: (id: string, data: { userId: string }) =>
        api.patch(`/group/${id}/add-member`, data),
      removeMember: (id: string, data: { userId: string }) =>
        api.patch(`/group/${id}/remove-member`, data),
      sendMessage: (id: string, data: { content: string; messageType?: string }) =>
        api.post(`/group/${id}/message`, data),
      getMessages: (id: string) => api.get(`/group/${id}/messages`),
    },
    fileAPI: {
      uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fileUploadApi.post('/files/upload', formData);
      },
      deleteFile: (publicId: string) => {
        return api.delete('/files/remove-file', { data: { public_id: publicId } });
      }
    }
  });
  
  // Set initial state and helpers
  let apiHelpers = createApiHelpers(api, fileUploadApi);

  return {
    // Initial State
    api,
    fileUploadApi,
    ...apiHelpers,

    // Action to dynamically update headers
    setAuthTokens: (accessToken: string | null) => {
      // 1. Recreate Axios instances with the new token
      const newInstances = createAxiosInstances(accessToken);
      
      // 2. Re-bind API helper functions to the new instances
      const newApiHelpers = createApiHelpers(newInstances.api, newInstances.fileUploadApi);

      // 3. Update the Zustand store state
      set({ 
        api: newInstances.api, 
        fileUploadApi: newInstances.fileUploadApi,
        ...newApiHelpers 
      });
      
      // OPTIONAL: Update localStorage here if the authStore doesn't handle it
      if (accessToken) {
         localStorage.setItem('accessToken', accessToken);
      } else {
         localStorage.removeItem('accessToken');
      }
    },
  };
});