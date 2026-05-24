import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { authApi, type UserProfile } from './api';
import { queryClient } from './queryClient';

type AuthState = {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  signIn: async (email, password) => {
    const { data } = await authApi.signIn({ email, password });
    await SecureStore.setItemAsync('auth_token', data.token);
    set({ user: data.user, token: data.token });
  },

  signUp: async (email, password, username) => {
    const { data } = await authApi.signUp({
      email,
      password,
      password_confirmation: password,
      username,
    });
    await SecureStore.setItemAsync('auth_token', data.token);
    set({ user: data.user, token: data.token });
  },

  signOut: async () => {
    try {
      await authApi.signOut();
    } catch {
      // best-effort
    }
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null });
    queryClient.clear();
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        set({ token });
        const { data: user } = await authApi.me();
        set({ user });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
