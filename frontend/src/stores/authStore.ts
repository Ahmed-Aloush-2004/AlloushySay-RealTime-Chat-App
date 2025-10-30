import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI, userAPI } from '../services/api';
import { useChatStore } from './chatStore';
import type { User } from '../common/interfaces/user';
interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    username: string;
    password: string;
    email: string;
}

interface AuthState {
    user: User | null;
    onlineUsers: User[];
    loading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (userData: RegisterData) => Promise<void>;
    signupOrLoginByGoogle: (user: User, refreshToken: string, accessToken: string) => Promise<void>;
    getAccessToken: () => Promise<void>;
    logout: () => void;
    fetchOnlineUser: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            onlineUsers: [],
            loading: true,
            isAuthenticated: false,


            signupOrLoginByGoogle: async (user: User, refreshToken: string, accessToken: string) => {
                try {
                    set({ user: user,isAuthenticated:true })
                    localStorage.setItem('accessToken',accessToken);
                    localStorage.setItem('refreshToken',refreshToken);
                    useChatStore.getState().initializeSocket(user._id);
                } catch (error) {
                    throw error;
                }
            },


            login: async (credentials: LoginCredentials) => {
                try {
                    const response = await authAPI.login(credentials);
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    set({ user: response.data.user, isAuthenticated: true, loading: false });
                    useChatStore.getState().initializeSocket(response.data.user._id);
                } catch (error) {
                    throw error;
                }
            },

            signup: async (userData) => {
                try {
                    const response = await authAPI.signup(userData);
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    set({ user: response.data.user, isAuthenticated: true, loading: false });
                    useChatStore.getState().initializeSocket(response.data.user._id);
                } catch (error) {
                    throw error;
                }
            },

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                useChatStore.getState().disconnectSocket();
                set({ user: null, isAuthenticated: false, onlineUsers: [], loading: false });
            },

            fetchOnlineUser: async () => {
                try {
                    const response = await userAPI.getAllOnline();
                    set({ onlineUsers: response.data });
                } catch (error) {
                    console.error('Error fetching online users:', error);
                }
            },

            getAccessToken: async () => {
                try {
                    set({ loading: true });
                    const refreshToken = localStorage.getItem('refreshToken') || '';
                    console.log('this is the refreshToken : ', refreshToken);

                    const response = await authAPI.getAccessToken(refreshToken);
                    console.log('this is the response : ', response);
                    localStorage.setItem('accessToken', response.data.accessToken);
                    set({ loading: false });
                } catch (error) {
                    console.error("Error refreshing access token:", error)
                    set({ loading: false });
                }
            },

            checkAuthStatus: async () => {
                const token = localStorage.getItem('accessToken');
                const refreshToken = localStorage.getItem('refreshToken');

                // If we have a persisted auth state, set it first
                const persistedAuth = useAuthStore.getState();
                if (persistedAuth.isAuthenticated && persistedAuth.user) {
                    set({ loading: false });
                    return;
                }

                if (token) {
                    try {
                        const response = await authAPI.getProfile();
                        const res = await authAPI.getAccessToken(refreshToken || '');
                        if (!res.data.accessToken) {
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                        localStorage.setItem('accessToken', res.data.accessToken);
                        set({ user: response.data, isAuthenticated: true, loading: false });
                        useChatStore.getState().initializeSocket(response.data._id);
                    } catch (error) {
                        // Try to refresh the token if it's expired
                        if (refreshToken) {
                            try {
                                const refreshResponse = await authAPI.getAccessToken(refreshToken);
                                localStorage.setItem('accessToken', refreshResponse.data.accessToken);
                                const profileResponse = await authAPI.getProfile();
                                set({ user: profileResponse.data, isAuthenticated: true, loading: false });
                                useChatStore.getState().initializeSocket(profileResponse.data._id);
                            } catch (refreshError) {
                                localStorage.removeItem('accessToken');
                                localStorage.removeItem('refreshToken');
                                set({ user: null, isAuthenticated: false, loading: false });
                            }
                        } else {
                            localStorage.removeItem('accessToken');
                            set({ user: null, isAuthenticated: false, loading: false });
                        }
                    }
                } else {
                    set({ loading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.loading = false;
                }
            }
        }
    )
);