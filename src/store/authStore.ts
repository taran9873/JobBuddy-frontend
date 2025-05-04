import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/services/apiClient';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await apiClient.post('users/login', { email, password }, { requiresAuth: false });
          
          if (error) {
            throw new Error(error);
          }

          if (!data?.tokens?.accessToken) {
            throw new Error('No authentication token received');
          }

          // Validate data structure
          if (!data.user || !data.tokens) {
            throw new Error('Invalid response data');
          }

          // Log successful auth
          console.debug('Authentication successful:', { user: data.user.email });

          set({
            user: data.user,
            tokens: data.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Login failed:', error);
          set({
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false,
          });
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await apiClient.post('users/register', { name, email, password }, { requiresAuth: false });
          
          if (error) {
            throw new Error(error);
          }

          if (!data?.tokens?.accessToken) {
            throw new Error('No authentication token received');
          }

          // Validate data structure
          if (!data.user || !data.tokens) {
            throw new Error('Invalid response data');
          }

          console.debug('Registration successful:', { user: data.user.email });

          set({
            user: data.user,
            tokens: data.tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Registration failed:', error);
          set({
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            isLoading: false,
          });
        }
      },

      logout: async () => {
        try {
          const { tokens } = get();
          // Only attempt logout if we have tokens
          if (tokens?.accessToken) {
            await apiClient.post('users/logout', {});
          }
        } catch (error) {
          console.error('Error during logout:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 