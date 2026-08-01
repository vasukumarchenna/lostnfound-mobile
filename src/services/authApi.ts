import { api, TOKEN_KEY, USER_KEY, storage } from './api';

export interface UserAuthData {
  userId: string;
  fullName: string;
  email: string;
  token: string;
  mobile?: string;
  bio?: string;
  location?: string;
}

export const loginApi = async (email: string, password_hash: string): Promise<UserAuthData> => {
  const response = await api.post('/auth/login', {
    username: email,
    email: email,
    password: password_hash,
    password_hash: password_hash,
  });

  const resData = response.data?.data ?? response.data;
  const token =
    resData?.access_token ||
    resData?.accessToken ||
    resData?.token ||
    resData?.jwt ||
    '';
  const userObj = resData?.user || resData;

  if (!token) {
    throw new Error('Authentication succeeded, but server returned no auth token.');
  }

  const userData: UserAuthData = {
    userId: String(userObj?.id || userObj?.userId || userObj?.user_id || ''),
    fullName: userObj?.name || userObj?.fullName || userObj?.full_name || 'User',
    email: userObj?.email || email,
    token,
    mobile: userObj?.mobile || userObj?.phone_number || '',
    bio: userObj?.bio || '',
    location: userObj?.location || '',
  };

  await storage.setItem(TOKEN_KEY, token);
  await storage.setItem(USER_KEY, JSON.stringify(userData));

  return userData;
};

export const signupApi = async (formData: {
  full_name: string;
  username: string;
  email: string;
  password_hash: string;
  phone_number: string;
}): Promise<void> => {
  await api.post('/auth/signup', {
    name: formData.full_name,
    full_name: formData.full_name,
    username: formData.username,
    email: formData.email,
    password: formData.password_hash,
    password_hash: formData.password_hash,
    mobile: formData.phone_number,
    phone_number: formData.phone_number,
  });
};

export const updateProfileApi = async (data: { full_name?: string; mobile?: string; bio?: string; location?: string }): Promise<void> => {
  await api.patch('/user/me', data);
  // Optional: We can update the stored user object here if needed,
  // but let's do a simple merge for the full name.
  const stored = await getStoredUser();
  if (stored) {
    if (data.full_name) {
      stored.fullName = data.full_name;
    }
    const updated = { ...stored, ...data };
    await storage.setItem(USER_KEY, JSON.stringify(updated));
  }
};

export const getProfileApi = async (): Promise<any> => {
  const response = await api.get('/user/me');
  return response.data?.data || response.data;
};

export const logoutApi = async (): Promise<void> => {
  await storage.deleteItem(TOKEN_KEY);
  await storage.deleteItem(USER_KEY);
};

export const changePasswordApi = async (current_password: string, new_password: string): Promise<void> => {
  await api.post('/user/change-password', {
    current_password,
    new_password,
  });
};


export const getStoredUser = async (): Promise<UserAuthData | null> => {
  try {
    const jsonStr = await storage.getItem(USER_KEY);
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.warn('Failed to parse stored user', e);
  }
  return null;
};
