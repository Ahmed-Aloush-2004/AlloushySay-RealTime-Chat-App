// src/services/api.ts
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { User } from '../common/interfaces/user';
import type { Message } from '../common/interfaces/message';
import type { Chat } from '../common/interfaces/chat';
import type { Group } from '../common/interfaces/group';
import type { FileUploadResponse } from '../common/interfaces/fileUploadResponse';

const API_URL = 'http://localhost:3000';
const token = localStorage.getItem('accessToken');

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});


// 2. Separate Axios instance for File Uploads (must NOT set Content-Type to JSON)
const fileUploadApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    // Axios will automatically set 'Content-Type': 'multipart/form-data' 
    // when a FormData object is provided as data.
  }
});




interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}


// Response structure from NestJS /files/upload endpoint






export const authAPI = {

  getAccessToken: (refreshToken: string): Promise<AxiosResponse<{ accessToken: string }>> => api.post('/auth/refresh-token', { refreshToken }),
  login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> => api.post('/auth/login', credentials),
  signup: (userData: RegisterData): Promise<AxiosResponse<AuthResponse>> => api.post('/auth/signup', userData),
  getProfile: (): Promise<AxiosResponse<User>> => api.get('/auth/profile'),
};

export const userAPI = {
  getAll: (): Promise<AxiosResponse<User[]>> => api.get('/users'),
  getAllOnline: (): Promise<AxiosResponse<User[]>> => api.get('/users/online'),
  getById: (id: string): Promise<AxiosResponse<User>> => api.get(`/users/${id}`),
  update: (id: string, data: Partial<User>): Promise<AxiosResponse<User>> => api.patch(`/users/${id}`, data),
};


export const chatAPI = {
  getMyChats: (): Promise<AxiosResponse<Chat[]>> => api.get(`/chats/myChats`),
  getChatMessages: (user1: string, user2: string): Promise<AxiosResponse<Chat>> => api.get(`/chats/${user1}/${user2}`),
  create: (data: Partial<Message>): Promise<AxiosResponse<Message>> => api.post('/chats', data),
  delete: (id: string): Promise<AxiosResponse<void>> => api.delete(`/chats/${id}`),
};

// src/services/api.ts (add these to your existing API service)
export const groupAPI = {
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
};


export const fileAPI = {
  /**
   * Uploads a file to the NestJS endpoint.
   * @param file The file object (from an input element).
   */
  uploadFile: (file: File): Promise<AxiosResponse<FileUploadResponse>> => {
    const formData = new FormData();
    formData.append('file', file); // 'file' matches the FileInterceptor('file') key in NestJS

    // Use the fileUploadApi instance to ensure correct headers for FormData
    return fileUploadApi.post('/files/upload', formData);
  },

  /**
   * Sends a request to the NestJS endpoint to delete a file from Cloudinary.
   * @param publicId The Cloudinary public ID of the file to delete.
   */
  deleteFile: (publicId: string): Promise<AxiosResponse<{ message: string }>> => {
    // Note: Deleting with a body in a DELETE request is not standard but necessary for NestJS @Body
    // We send a JSON body containing the public_id
    return api.delete('/files/remove-file', { data: { public_id: publicId } });
  }
};



export default api;