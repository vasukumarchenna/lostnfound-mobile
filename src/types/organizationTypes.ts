export type OrgRole = 'ORG_ADMIN' | 'ORG_MODERATOR' | 'ORG_MEMBER';
export type JoinPolicy = 'OPEN' | 'APPROVAL_REQUIRED' | 'INVITE_ONLY';

export interface OrganizationUI {
  organizationId: string;
  name: string;
  type: string;
  joinPolicy: JoinPolicy;
  isVerified: boolean;
  status: string;
  role?: OrgRole;
  createdAt: string;
}

export interface OrganizationMemberUI {
  userId: string;
  fullName: string;
  email: string;
  role: OrgRole;
  status: string;
}

export interface InvitationUI {
  invitationId: string;
  organizationId: string | null;
  organizationName: string;
  invitedUserId: string | null;
  invitedByUserId: string | null;
  roleToAssign: OrgRole | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface JoinRequestUI {
  id: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  message: string | null;
  status: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  type: string;
  joinPolicy: JoinPolicy;
  isVerified?: boolean;
}

export interface UpdateOrganizationRequest {
  name?: string;
  type?: string;
  joinPolicy?: JoinPolicy;
  isVerified?: boolean;
}

export interface CreateInvitationRequest {
  invitedUserId: string;
  roleToAssign: OrgRole;
}
