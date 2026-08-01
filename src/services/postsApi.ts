import { api, API_BASE_URL } from './api';
import { PostApi, PostUI, CommentUI } from '../types/postTypes';

export const transformPostApiToUI = (apiPost: any): PostUI => {
  const images = (apiPost.images || []).map((img: string) =>
    img.startsWith('http') ? img : `${API_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`
  );

  return {
    id: String(apiPost.postId || apiPost.post_id),
    postId: String(apiPost.postId || apiPost.post_id),
    title: apiPost.title,
    content: apiPost.content,
    userId: String(apiPost.userId || apiPost.user_id),
    itemType: apiPost.itemType || apiPost.item_type,
    status: apiPost.status,
    location: apiPost.location || '',
    tags: apiPost.tags || '',
    latitude: apiPost.latitude,
    longitude: apiPost.longitude,
    buildingName: apiPost.buildingName || apiPost.building_name || '',
    createdAt: apiPost.createdAt || apiPost.created_at,
    images,
    userFullName: apiPost.userFullName || apiPost.user_full_name || 'Anonymous User',
    userEmail: apiPost.userEmail || apiPost.user_email || '',
    userPhone: apiPost.userPhone || apiPost.user_phone || '',
  };
};

export const fetchPosts = async (params?: {
  item_type?: string;
  status?: string;
  query?: string;
  scope_id?: string;
}): Promise<PostUI[]> => {
  const response = await api.get<any>('/posts', { params });
  const raw = response.data?.data ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(transformPostApiToUI);
};

export const fetchPostById = async (postId: string): Promise<PostUI> => {
  const response = await api.get<any>(`/posts/${postId}`);
  const raw = response.data?.data ?? response.data;
  return transformPostApiToUI(raw);
};

export const createPostApi = async (formData: FormData): Promise<{ postId: string }> => {
  const response = await api.post<any>('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data ?? response.data;
};

export const fetchPostComments = async (postId: string): Promise<CommentUI[]> => {
  const response = await api.get<any>(`/posts/${postId}/comments`);
  const raw = response.data?.data ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((c: any) => ({
    commentId: String(c.id || c.commentId || c.comment_id),
    postId: String(c.postId || c.post_id || postId),
    userId: String(c.userId || c.user_id),
    content: c.text || c.content,
    createdAt: c.time_ago || c.timeAgo || c.createdAt || c.created_at || new Date().toISOString(),
    userFullName: c.username || c.userFullName || c.user_full_name || 'Anonymous',
    userEmail: c.userEmail || c.user_email || '',
    profilePictureUrl: c.avatar || c.profilePictureUrl || c.profile_picture_url || '',
  }));
};

export const createPostComment = async (postId: string, content: string): Promise<CommentUI> => {
  const response = await api.post(`/posts/${postId}/comments`, { content });
  const c = response.data?.data ?? response.data;
  return {
    commentId: String(c.id || c.commentId || c.comment_id || Math.random().toString()),
    postId: String(c.postId || c.post_id || postId),
    userId: String(c.userId || c.user_id || ''),
    content: c.text || c.content || content,
    createdAt: c.time_ago || c.timeAgo || c.createdAt || c.created_at || new Date().toISOString(),
    userFullName: c.username || c.userFullName || c.user_full_name || 'You',
  };
};
