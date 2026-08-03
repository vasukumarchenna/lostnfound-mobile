export interface ClaimUI {
  claimId: string;
  postId: string;
  postTitle?: string;
  itemType?: string;
  claimantUserId: string;
  claimantName?: string;
  claimantEmail?: string;
  claimMessage: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IGNORED' | 'RESOLVED' | 'WITHDRAWN';
  handoverOtp?: string;
  resolvedAt?: string;
  createdAt: string;
  postOwnerUserId?: string;
}

export interface ChatMessageUI {
  messageId: string;
  claimId: string;
  senderId: string;
  senderName?: string;
  message: string;
  createdAt: string;
  deliveredAt?: string;
  seenAt?: string;
  isMe?: boolean;
}
