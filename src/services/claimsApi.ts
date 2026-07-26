import { api } from './api';
import { ClaimUI, ChatMessageUI } from '../types/claimTypes';

export const createClaim = async (postId: string, claimMessage: string): Promise<ClaimUI> => {
  const response = await api.post('/claims', {
    post_id: Number(postId),
    claim_message: claimMessage,
  });
  return response.data;
};

export const fetchReceivedClaims = async (): Promise<ClaimUI[]> => {
  const response = await api.get('/claims/received');
  return (response.data || []).map((c: any) => ({
    claimId: String(c.claimId || c.claim_id),
    publicId: c.publicId || c.public_id,
    postId: String(c.postId || c.post_id),
    postTitle: c.postTitle || c.post_title || 'Item Claim',
    itemType: c.itemType || c.item_type || 'FOUND',
    claimantUserId: String(c.claimantUserId || c.claimant_user_id),
    claimantName: c.claimantName || c.claimant_name || 'Claimant',
    claimantEmail: c.claimantEmail || c.claimant_email || '',
    claimMessage: c.claimMessage || c.claim_message,
    status: c.status,
    handoverOtp: c.handoverOtp || c.handover_otp,
    resolvedAt: c.resolvedAt || c.resolved_at,
    createdAt: c.createdAt || c.created_at,
  }));
};

export const fetchMyClaims = async (): Promise<ClaimUI[]> => {
  const response = await api.get('/claims/my-claims');
  return (response.data || []).map((c: any) => ({
    claimId: String(c.claimId || c.claim_id),
    publicId: c.publicId || c.public_id,
    postId: String(c.postId || c.post_id),
    postTitle: c.postTitle || c.post_title || 'Item Claim',
    itemType: c.itemType || c.item_type || 'FOUND',
    claimantUserId: String(c.claimantUserId || c.claimant_user_id),
    claimantName: c.claimantName || c.claimant_name || 'You',
    claimMessage: c.claimMessage || c.claim_message,
    status: c.status,
    handoverOtp: c.handoverOtp || c.handover_otp,
    resolvedAt: c.resolvedAt || c.resolved_at,
    createdAt: c.createdAt || c.created_at,
  }));
};

export const updateClaimStatus = async (claimPublicId: string, status: string): Promise<void> => {
  await api.patch(`/claims/${claimPublicId}/status`, { status });
};

export const fetchChatMessages = async (claimPublicId: string): Promise<ChatMessageUI[]> => {
  const response = await api.get(`/claims/${claimPublicId}/chat`);
  return (response.data || []).map((m: any) => ({
    messageId: String(m.messageId || m.message_id),
    publicId: m.publicId || m.public_id,
    claimId: String(m.claimId || m.claim_id),
    senderId: String(m.senderId || m.sender_id),
    senderName: m.senderName || m.sender_name || 'User',
    message: m.message,
    createdAt: m.createdAt || m.created_at,
  }));
};

export const sendChatMessage = async (claimPublicId: string, message: string): Promise<ChatMessageUI> => {
  const response = await api.post(`/claims/${claimPublicId}/chat`, { message });
  const m = response.data;
  return {
    messageId: String(m.messageId || m.message_id),
    publicId: m.publicId || m.public_id,
    claimId: String(m.claimId || m.claim_id),
    senderId: String(m.senderId || m.sender_id),
    senderName: m.senderName || m.sender_name || 'You',
    message: m.message,
    createdAt: m.createdAt || m.created_at,
  };
};

export const verifyHandoverOtp = async (claimPublicId: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/claims/${claimPublicId}/verify-otp`, { otp });
  return response.data;
};
