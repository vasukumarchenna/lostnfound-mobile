import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, CheckCheck, Clock, FileText, User, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getStoredUser } from '../../services/authApi';
import {
  fetchClaimById,
  updateClaimStatus,
  withdrawClaim,
  revokeClaimApproval
} from '../../services/claimsApi';
import { ClaimUI } from '../../types/claimTypes';

export default function ClaimDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [claim, setClaim] = useState<ClaimUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const user = await getStoredUser();
      setCurrentUserId(user?.userId || null);

      const claimData = await fetchClaimById(id);
      setClaim(claimData);
    } catch (e: any) {
      console.warn('Failed to load claim details', e);
      Alert.alert('Error', 'Could not load claim details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!claim) return;
    setActionLoading(newStatus);
    try {
      await updateClaimStatus(claim.claimId, newStatus);
      Alert.alert('Status Updated', `Claim has been ${newStatus.toLowerCase()}`);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!claim) return;
    setActionLoading('WITHDRAW');
    try {
      await withdrawClaim(claim.claimId);
      Alert.alert('Success', 'Claim withdrawn successfully');
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      const debugStr = msg || (error.message ? error.message : JSON.stringify(error));
      Alert.alert('Error', debugStr);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeApproval = async () => {
    if (!claim) return;
    setActionLoading('REVOKE');
    try {
      await revokeClaimApproval(claim.claimId);
      Alert.alert('Success', 'Claim approval revoked');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.response?.data?.error || 'Failed to revoke approval');
    } finally {
      setActionLoading(null);
    }
  };

  const formatRelativeDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (targetDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '';
    const normalizedDate = dateString.endsWith("Z") ? dateString.slice(0, -1) : dateString;
    const d = new Date(normalizedDate);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  if (!claim) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Claim not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isClaimant = claim.claimantUserId === currentUserId;
  const isPostOwner = claim.postOwnerUserId === currentUserId;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      case 'WITHDRAWN': return '#6b7280';
      case 'RESOLVED': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) }]}>
              <Text style={styles.statusText}>{claim.status}</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.dateText}>
              Submitted {formatRelativeDate(claim.createdAt)} at {formatTime(claim.createdAt)}
            </Text>
          </View>
          {claim.resolvedAt && (
            <View style={[styles.dateRow, { marginTop: 8 }]}>
              <CheckCheck size={16} color="#10b981" />
              <Text style={styles.dateText}>
                Resolved {formatRelativeDate(claim.resolvedAt)} at {formatTime(claim.resolvedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Post Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FileText size={20} color="#3b82f6" style={styles.icon} />
            <Text style={styles.cardTitle}>Post Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Title</Text>
            <Text style={styles.infoValue}>{claim.postTitle}</Text>
          </View>
          {claim.postContent ? (
            <View style={{ marginTop: 4, marginBottom: 12 }}>
              <Text style={[styles.infoLabel, { marginBottom: 4 }]}>Description</Text>
              <Text style={styles.messageText}>{claim.postContent}</Text>
            </View>
          ) : null}
        </View>

        {/* Claimant Info */}
        {!isClaimant && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={20} color="#3b82f6" style={styles.icon} />
              <Text style={styles.cardTitle}>Claimant Details</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{claim.claimantName}</Text>
            </View>
            {claim.claimantEmail ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{claim.claimantEmail}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Message */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Message / Description</Text>
          </View>
          <Text style={styles.messageText}>{claim.claimMessage || 'No message provided.'}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          {isClaimant && claim.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.withdrawBtn, actionLoading === 'WITHDRAW' && styles.disabledBtn]}
              onPress={handleWithdraw}
              disabled={!!actionLoading}
            >
              {actionLoading === 'WITHDRAW' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <X size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Withdraw Claim</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isPostOwner && claim.status === 'PENDING' && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, actionLoading === 'APPROVED' && styles.disabledBtn]}
                onPress={() => handleUpdateStatus('APPROVED')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'APPROVED' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, actionLoading === 'REJECTED' && styles.disabledBtn]}
                onPress={() => handleUpdateStatus('REJECTED')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'REJECTED' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <X size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {isPostOwner && claim.status === 'APPROVED' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn, actionLoading === 'REVOKE' && styles.disabledBtn]}
              onPress={handleRevokeApproval}
              disabled={!!actionLoading}
            >
              {actionLoading === 'REVOKE' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <X size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Revoke Approval</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  withdrawBtn: {
    backgroundColor: '#f59e0b',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
