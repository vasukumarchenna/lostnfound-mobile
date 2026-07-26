import { api, TOKEN_KEY, USER_KEY } from './api';
import * as SecureStore from 'expo-secure-store';

export interface UserAuthData {
  userId: string;
  fullName: string;
  email: string;
  token: string;
}

export const loginApi = async (email: string, password_hash: string): Promise<UserAuthData> => {
  const response = await api.post('/auth/login', { email, password_hash });
  const data = response.data;

  const userData: UserAuthData = {
    userId: String(data.userId || data.user_id),
    fullName: data.fullName || data.full_name || 'User',
    email: data.email,
    token: data.token,
  };

  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));

  return userData;
};

export const signupApi = async (formData: {
  full_name: string;
  username: string;
  email: string;
  password_hash: string;
  phone_number: string;
}): Promise<void> => {
  await api.post('/auth/signup', formData);
};

export const logoutApi = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const getStoredUser = async (): Promise<UserAuthData | null> => {
  try {
    const jsonStr = await SecureStore.getItemAsync(USER_KEY);
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.warn('Failed to parse stored user', e);
  }
  return null;
};
