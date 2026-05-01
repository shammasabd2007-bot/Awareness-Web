import { create } from 'zustand';
import { getUserById, insertUser, getUserByEmail } from '../database/db.web';
import * as SecureStore from '../utils/secureStore';

// Simple UUID generator
const generateId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'volunteer' | 'admin';
  points: number;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      // In a real app, this would call a backend API
      // For now, we'll use local database
      const user = await getUserByEmail(email);

      if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Store session token
      await SecureStore.setItemAsync('userToken', user.id);

      set({ user: user as User });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const userId = generateId();
      const newUser = {
        id: userId,
        name,
        email,
        password, // In production, hash this!
        role: 'user',
        points: 0,
      };

      await insertUser(newUser);

      // Store session token
      await SecureStore.setItemAsync('userToken', userId);

      set({ user: newUser as User });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      set({ user: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');

      if (token) {
        const user = await getUserById(token);
        if (user) {
          set({ user: user as User, isLoading: false });
          return;
        }
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Session restore error:', error);
      set({ isLoading: false });
    }
  },
}));
