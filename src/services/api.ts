import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For local development on Android emulator: 10.0.2.2 points to host machine localhost
// For iOS simulator / physical devices: use local IP or server URL
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

export const TOKEN_KEY = 'lostnfound_auth_token';
export const USER_KEY = 'lostnfound_user_data';

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
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
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
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    return Promise.reject(error);
  }
);
