import { api } from './api';
import { ClaimUI, ChatMessageUI } from '../types/claimTypes';

export const createClaim = async (postId: string, claimMessage: string): Promise<ClaimUI> => {
  const response = await api.post('/claims', {
    post_id: postId,
    claim_message: claimMessage,
  });
  return response.data;
};

export const fetchReceivedClaims = async (): Promise<ClaimUI[]> => {
  const response = await api.get('/user/claims-on-my-posts');
  const raw = response.data?.data ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((c: any) => ({
    claimId: String(c.claimId || c.claim_id),
    postId: String(c.postId || c.post_id),
    postTitle: c.postTitle || c.post_title || 'Item Claim',
    itemType: c.itemType || c.item_type || 'FOUND',
    claimantUserId: String(c.claimantUserId || c.claimant_user_id),
    claimantName: c.claimantFullName || c.claimant_full_name || c.claimantName || c.claimant_name || 'Claimant',
    claimantEmail: c.claimantEmail || c.claimant_email || '',
    claimMessage: c.claimMessage || c.claim_message,
    status: c.status,
    handoverOtp: c.handoverOtp || c.handover_otp,
    resolvedAt: c.resolvedAt || c.resolved_at,
    createdAt: c.createdAt || c.created_at,
  }));
};

export const fetchMyClaims = async (): Promise<ClaimUI[]> => {
  const response = await api.get('/claims');
  const raw = response.data?.data ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((c: any) => ({
    claimId: String(c.claimId || c.claim_id),
    postId: String(c.postId || c.post_id),
    postTitle: c.postTitle || c.post_title || 'Item Claim',
    itemType: c.itemType || c.item_type || 'FOUND',
    claimantUserId: String(c.claimantUserId || c.claimant_user_id),
    claimantName: c.claimantFullName || c.claimant_full_name || c.claimantName || c.claimant_name || 'You',
    claimMessage: c.claimMessage || c.claim_message,
    status: c.status,
    handoverOtp: c.handoverOtp || c.handover_otp,
    resolvedAt: c.resolvedAt || c.resolved_at,
    createdAt: c.createdAt || c.created_at,
  }));
};

export const updateClaimStatus = async (claimId: string, status: string): Promise<void> => {
  if (status.toUpperCase() === 'APPROVED') {
    await api.post(`/claims/${claimId}/approve`);
  } else if (status.toUpperCase() === 'REJECTED') {
    await api.post(`/claims/${claimId}/reject`);
  } else {
    // Fallback if needed, though typically only approve/reject are triggered this way
    await api.patch(`/claims/${claimId}`, { status });
  }
};

export const fetchChatMessages = async (claimId: string): Promise<ChatMessageUI[]> => {
  const response = await api.get(`/claims/${claimId}/messages`);
  const raw = response.data?.data ?? response.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((m: any) => ({
    messageId: String(m.messageId || m.message_id),
    claimId: String(m.claimId || m.claim_id),
    senderId: String(m.senderId || m.sender_id),
    senderName: m.senderName || m.sender_name || 'User',
    message: m.message,
    createdAt: m.createdAt || m.created_at,
    deliveredAt: m.deliveredAt || m.delivered_at,
    seenAt: m.seenAt || m.seen_at,
    isMe: m.isMe ?? m.is_me ?? false,
  }));
};

export const sendChatMessage = async (claimId: string, message: string): Promise<ChatMessageUI> => {
  const response = await api.post(`/claims/${claimId}/messages`, { message });
  const m = response.data?.data ?? response.data;
  return {
    messageId: String(m.messageId || m.message_id),
    claimId: String(m.claimId || m.claim_id),
    senderId: String(m.senderId || m.sender_id),
    senderName: m.senderName || m.sender_name || 'You',
    message: m.message,
    createdAt: m.createdAt || m.created_at,
    deliveredAt: m.deliveredAt || m.delivered_at,
    seenAt: m.seenAt || m.seen_at,
    isMe: true,
  };
};

export const markMessagesAsSeen = async (claimId: string): Promise<void> => {
  await api.post(`/claims/${claimId}/chat/seen`);
};

export const markMessagesAsDelivered = async (claimId: string): Promise<void> => {
  await api.post(`/claims/${claimId}/chat/delivered`);
};

export const verifyHandoverOtp = async (claimId: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/claims/${claimId}/verify-handover`, { otp });
  return response.data;
};
