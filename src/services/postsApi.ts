import { api, API_BASE_URL } from './api';
import { PostApi, PostUI, CommentUI } from '../types/postTypes';

export const transformPostApiToUI = (apiPost: PostApi): PostUI => {
  const images = (apiPost.images || []).map((img) =>
    img.startsWith('http') ? img : `${API_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`
  );

  return {
    id: apiPost.publicId || String(apiPost.postId),
    postId: String(apiPost.postId),
    title: apiPost.title,
    content: apiPost.content,
    userId: String(apiPost.userId),
    itemType: apiPost.itemType,
    status: apiPost.status,
    location: apiPost.location || '',
    tags: apiPost.tags || '',
    latitude: apiPost.latitude,
    longitude: apiPost.longitude,
    buildingName: apiPost.buildingName || '',
    createdAt: apiPost.createdAt,
    images,
    userFullName: apiPost.userFullName || 'Anonymous User',
    userEmail: apiPost.userEmail || '',
    userPhone: apiPost.userPhone || '',
  };
};

export const fetchPosts = async (params?: {
  item_type?: string;
  status?: string;
  query?: string;
  scope_id?: string;
}): Promise<PostUI[]> => {
  const response = await api.get<PostApi[]>('/posts', { params });
  return (response.data || []).map(transformPostApiToUI);
};

export const fetchPostById = async (postId: string): Promise<PostUI> => {
  const response = await api.get<PostApi>(`/posts/${postId}`);
  return transformPostApiToUI(response.data);
};

export const createPostApi = async (formData: FormData): Promise<{ postId: string }> => {
  const response = await api.post<{ postId: string; message: string }>('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchPostComments = async (postId: string): Promise<CommentUI[]> => {
  const response = await api.get<any[]>(`/posts/${postId}/comments`);
  return (response.data || []).map((c) => ({
    commentId: String(c.commentId || c.comment_id),
    postId: String(c.postId || c.post_id),
    userId: String(c.userId || c.user_id),
    content: c.content,
    createdAt: c.createdAt || c.created_at,
    userFullName: c.userFullName || c.user_full_name || 'Anonymous',
    userEmail: c.userEmail || c.user_email || '',
    profilePictureUrl: c.profilePictureUrl || c.profile_picture_url || '',
  }));
};

export const createPostComment = async (postId: string, content: string): Promise<CommentUI> => {
  const response = await api.post(`/posts/${postId}/comments`, { content });
  const c = response.data;
  return {
    commentId: String(c.commentId || c.comment_id),
    postId: String(c.postId || c.post_id),
    userId: String(c.userId || c.user_id),
    content: c.content,
    createdAt: c.createdAt || c.created_at,
    userFullName: c.userFullName || c.user_full_name || 'You',
  };
};
