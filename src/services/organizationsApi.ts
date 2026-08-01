import { api } from './api';
import {
  OrganizationUI,
  OrganizationMemberUI,
  InvitationUI,
  JoinRequestUI,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateInvitationRequest,
} from '../types/organizationTypes';

const mapOrg = (o: any): OrganizationUI => ({
  organizationId: o.organization_id || o.organizationId,
  name: o.name,
  type: o.type,
  joinPolicy: o.join_policy || o.joinPolicy,
  isVerified: o.is_verified || o.isVerified,
  status: o.status,
  role: o.role,
  createdAt: o.created_at || o.createdAt,
});

const mapMember = (m: any): OrganizationMemberUI => ({
  userId: m.user_id || m.userId,
  fullName: m.full_name || m.fullName || '',
  email: m.email || '',
  role: m.role,
  status: m.status,
});

const mapInv = (i: any): InvitationUI => ({
  invitationId: i.id || i.invitation_id || i.invitationId,
  organizationId: i.organization_id || i.organizationId || null,
  organizationName: i.organization_name || i.organizationName || '-',
  invitedUserId: i.invited_user_id || i.invitedUserId || null,
  invitedByUserId: i.invited_by_user_id || i.invitedByUserId || null,
  roleToAssign: i.role_to_assign || i.roleToAssign || null,
  status: i.status,
  expiresAt: i.expires_at || i.expiresAt || null,
  createdAt: i.created_at || i.createdAt || '',
});

const mapReq = (r: any): JoinRequestUI => ({
  id: r.id,
  organizationId: r.organization_id || r.organizationId,
  organizationName: r.organization_name || r.organizationName,
  userId: r.user_id || r.userId,
  username: r.username,
  fullName: r.full_name || r.fullName,
  email: r.email,
  message: r.message || null,
  status: r.status,
  reviewedByUserId: r.reviewed_by_user_id || r.reviewedByUserId || null,
  reviewedAt: r.reviewed_at || r.reviewedAt || null,
  createdAt: r.created_at || r.createdAt,
});

// Orgs
export const listOrganizations = async (): Promise<OrganizationUI[]> => {
  const res = await api.get('/organizations');
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapOrg);
};

export const listMyOrganizations = async (): Promise<OrganizationUI[]> => {
  const res = await api.get('/organizations/me');
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapOrg);
};

export const getOrganization = async (id: string): Promise<OrganizationUI> => {
  // First check if it's one of my orgs to get the proper role
  const myOrgs = await listMyOrganizations();
  const mine = myOrgs.find((o) => o.organizationId === id);
  if (mine) return mine;

  // Otherwise, fetch from public list
  const list = await listOrganizations();
  return list.find((o) => o.organizationId === id) as OrganizationUI;
};

export const createOrganization = async (payload: CreateOrganizationRequest): Promise<OrganizationUI> => {
  const res = await api.post('/organizations', {
    name: payload.name,
    type: payload.type,
    join_policy: payload.joinPolicy,
    is_verified: payload.isVerified ?? false,
  });
  return mapOrg(res.data?.data || res.data);
};

export const updateOrganization = async (id: string, payload: UpdateOrganizationRequest): Promise<OrganizationUI> => {
  const res = await api.patch(`/organizations/${id}`, {
    name: payload.name,
    type: payload.type,
    join_policy: payload.joinPolicy,
    is_verified: payload.isVerified,
  });
  return mapOrg(res.data?.data || res.data);
};

export const deleteOrganization = async (id: string): Promise<void> => {
  await api.delete(`/organizations/${id}`);
};

// Members
export const listMembers = async (orgId: string): Promise<OrganizationMemberUI[]> => {
  const res = await api.get(`/organizations/${orgId}/members?status=ACTIVE`);
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapMember);
};

export const removeMember = async (orgId: string, userId: string): Promise<void> => {
  await api.delete(`/organizations/${orgId}/members/${userId}`);
};

export const leaveOrganization = async (orgId: string): Promise<void> => {
  await api.post(`/organizations/${orgId}/leave`);
};

// Invitations
export const createInvitation = async (orgId: string, payload: CreateInvitationRequest): Promise<void> => {
  await api.post(`/organizations/${orgId}/invitations`, {
    invited_user_id: payload.invitedUserId,
    role_to_assign: payload.roleToAssign,
  });
};

export const listSentInvitations = async (orgId: string): Promise<InvitationUI[]> => {
  const res = await api.get(`/organizations/${orgId}/invitations/sent`);
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapInv);
};

export const listMyInvitations = async (): Promise<InvitationUI[]> => {
  const res = await api.get(`/users/me/invitations`);
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapInv);
};

export const acceptInvitation = async (invId: string): Promise<void> => {
  await api.post(`/invitations/${invId}/accept`);
};

export const rejectInvitation = async (invId: string): Promise<void> => {
  await api.post(`/invitations/${invId}/reject`);
};

export const revokeInvitation = async (invId: string): Promise<void> => {
  await api.post(`/invitations/${invId}/revoke`);
};

// Join Requests
export const listJoinRequests = async (orgId: string): Promise<JoinRequestUI[]> => {
  const res = await api.get(`/organizations/${orgId}/join-requests?status=PENDING`);
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapReq);
};

export const createJoinRequest = async (orgId: string, message?: string): Promise<void> => {
  await api.post(`/organizations/${orgId}/join-requests`, { message });
};

export const approveJoinRequest = async (reqId: string): Promise<void> => {
  await api.post(`/join-requests/${reqId}/approve`);
};

export const rejectJoinRequest = async (reqId: string): Promise<void> => {
  await api.post(`/join-requests/${reqId}/reject`);
};

export const cancelJoinRequest = async (reqId: string): Promise<void> => {
  await api.post(`/join-requests/${reqId}/cancel`);
};

export const listMyJoinRequests = async (): Promise<JoinRequestUI[]> => {
  const res = await api.get(`/users/me/join-requests`);
  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(mapReq);
};
