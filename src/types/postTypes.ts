export interface PostApi {
  postId: number;
  title: string;
  content: string;
  userId: number;
  itemType: 'LOST' | 'FOUND';
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
  location?: string;
  tags?: string;
  latitude?: number;
  longitude?: number;
  buildingName?: string;
  isVisible: boolean;
  createdAt: string;
  deletedAt?: string | null;
  images?: string[];
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
}

export interface PostUI {
  id: string;
  postId: string;
  title: string;
  content: string;
  userId: string;
  itemType: 'LOST' | 'FOUND';
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
  location?: string;
  tags?: string;
  latitude?: number;
  longitude?: number;
  buildingName?: string;
  createdAt: string;
  images: string[];
  userFullName?: string;
  userEmail?: string;
  userPhone?: string;
  classificationName?: string;
  classificationSlug?: string;
  attributes?: Record<string, any>;
  estimatedAge?: number;
  estimatedBirthYear?: number;
}

export interface CommentUI {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  userFullName: string;
  userEmail?: string;
  profilePictureUrl?: string;
}
