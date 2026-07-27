import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }
  return 'http://192.168.0.6:8080';
};

export const API_BASE_URL = getBaseUrl();

export const TOKEN_KEY = 'lostnfound_auth_token';
export const USER_KEY = 'lostnfound_user_data';

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (e) {
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!value) return;
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(key, value);
      } catch (e) { }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(key);
      } catch (e) { }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization token to every request automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to fetch secure auth token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 Unauthorized
      await storage.deleteItem(TOKEN_KEY);
      await storage.deleteItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);
