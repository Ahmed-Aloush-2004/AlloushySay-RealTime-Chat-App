import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../common/interfaces/user';
import { useSocketStore } from './socketStore';
import { useApiStore } from './apiStore';
import toast from 'react-hot-toast';

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
        (set) => ({
            user: null,
            onlineUsers: [],
            loading: true,
            isAuthenticated: false,


            signupOrLoginByGoogle: async (user: User, refreshToken: string, accessToken: string) => {
                try {
                    set({ user: user, isAuthenticated: true })
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    useApiStore.getState().setAuthTokens(accessToken)
                    useSocketStore.getState().initializeSocket(user._id);
                    toast.success('Login successful!');
                } catch (error) {
                    toast.error('An error occurred during login.');
                    throw error;
                }
            },


            login: async (credentials: LoginCredentials) => {
                try {
                    const response = await useApiStore.getState().authAPI.login(credentials);
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    set({ user: response.data.user, isAuthenticated: true, loading: false });
                    useApiStore.getState().setAuthTokens(response.data.accessToken)
                    useSocketStore.getState().initializeSocket(response.data.user._id);
                    toast.success('Login successful!');
                } catch (error) {
                    toast.error('Invalid credentials. Please try again.');
                    throw error;
                }
            },

            signup: async (userData) => {
                try {
                    const response = await useApiStore.getState().authAPI.signup(userData);
                    localStorage.setItem('accessToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    set({ user: response.data.user, isAuthenticated: true, loading: false });
                    useApiStore.getState().setAuthTokens(response.data.accessToken)
                    useSocketStore.getState().initializeSocket(response.data.user._id);
                    toast.success('Signup successful!');
                } catch (error) {
                    toast.error('An error occurred during signup.');
                    throw error;
                }
            },

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                useSocketStore.getState().disconnectSocket();
                useApiStore.getState().setAuthTokens('')
                set({ user: null, isAuthenticated: false, onlineUsers: [], loading: false });
                toast.success('Logged out successfully.');
            },

            fetchOnlineUser: async () => {
                try {
                    const response = await useApiStore.getState().userAPI.getAllOnline();
                    set({ onlineUsers: response.data });
                } catch (error) {
                    console.error('Error fetching online users:', error);
                    toast.error('Failed to fetch online users.');
                }
            },

            getAccessToken: async () => {
                try {
                    set({ loading: true });
                    const refreshToken = localStorage.getItem('refreshToken') || '';
                    const response = await useApiStore.getState().authAPI.getAccessToken(refreshToken);
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

                const persistedAuth = useAuthStore.getState();
                if (persistedAuth.isAuthenticated && persistedAuth.user) {
                    set({ loading: false });
                    return;
                }

                if (token) {
                    try {
                        const response = await useApiStore.getState().authAPI.getProfile();
                        const res = await useApiStore.getState().authAPI.getAccessToken(refreshToken || '');
                        if (!res.data.accessToken) {
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                        localStorage.setItem('accessToken', res.data.accessToken);
                        set({ user: response.data, isAuthenticated: true, loading: false });
                        useSocketStore.getState().initializeSocket(response.data._id);
                    } catch (error) {
                        if (refreshToken) {
                            try {
                                const refreshResponse = await useApiStore.getState().authAPI.getAccessToken(refreshToken);
                                localStorage.setItem('accessToken', refreshResponse.data.accessToken);
                                const profileResponse = await useApiStore.getState().authAPI.getProfile();
                                set({ user: profileResponse.data, isAuthenticated: true, loading: false });
                                useSocketStore.getState().initializeSocket(profileResponse.data._id);
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