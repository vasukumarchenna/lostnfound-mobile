import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchReceivedClaims,
  fetchMyClaims,
  updateClaimStatus,
  fetchChatMessages,
  sendChatMessage,
  verifyHandoverOtp,
} from '../services/claimsApi';
import { getStoredUser } from '../services/authApi';
import { ClaimUI, ChatMessageUI } from '../types/claimTypes';
import { ArrowLeft, MessageSquare, ShieldCheck, KeyRound, Check, X, Send } from 'lucide-react-native';

export default function ClaimsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'MY_CLAIMS'>('RECEIVED');
  const [claims, setClaims] = useState<ClaimUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Active Chat Modal State
  const [activeChatClaim, setActiveChatClaim] = useState<ClaimUI | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageUI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // OTP Verification Modal State
  const [otpModalClaim, setOtpModalClaim] = useState<ClaimUI | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'RECEIVED') {
        const data = await fetchReceivedClaims();
        setClaims(data);
      } else {
        const data = await fetchMyClaims();
        setClaims(data);
      }
    } catch (e) {
      console.warn('Failed to load claims', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleUpdateStatus = async (claim: ClaimUI, newStatus: string) => {
    setActionLoading(claim.claimId);
    try {
      await updateClaimStatus(claim.publicId, newStatus);
      Alert.alert('Status Updated', `Claim has been ${newStatus.toLowerCase()}`);
      loadClaims();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const openChatModal = async (claim: ClaimUI) => {
    setActiveChatClaim(claim);
    try {
      const messages = await fetchChatMessages(claim.publicId);
      setChatMessages(messages);
    } catch (e) {
      Alert.alert('Chat Error', 'Failed to load chat messages');
    }
  };

  const handleSendChat = async () => {
    if (!newMessage.trim() || !activeChatClaim) return;
    setSendingChat(true);
    try {
      const sent = await sendChatMessage(activeChatClaim.publicId, newMessage.trim());
      setChatMessages((prev) => [...prev, sent]);
      setNewMessage('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  const handleVerifyOtpSubmit = async () => {
    if (!otpCode.trim() || !otpModalClaim) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      await verifyHandoverOtp(otpModalClaim.publicId, otpCode.trim());
      Alert.alert('Item Resolved! 🎉', 'Handover OTP verified successfully. The claim is now marked RESOLVED.');
      setOtpModalClaim(null);
      setOtpCode('');
      loadClaims();
    } catch (error: any) {
      Alert.alert('OTP Verification Failed', error.response?.data?.error || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const renderClaimCard = ({ item }: { item: ClaimUI }) => {
    const isApproved = item.status.toUpperCase() === 'APPROVED';
    const isPending = item.status.toUpperCase() === 'PENDING';
    const isResolved = item.status.toUpperCase() === 'RESOLVED';
    const isLoadingThis = actionLoading === item.claimId;

    return (
      <View style={styles.card}>
        {/* Header Title & Status Badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.postTitle} numberOfLines={1}>
            {item.postTitle}
          </Text>
          <View
            style={[
              styles.statusBadge,
              isApproved && styles.badgeApproved,
              isPending && styles.badgePending,
              isResolved && styles.badgeResolved,
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Claimant Info */}
        <Text style={styles.claimantText}>
          Claimant: <Text style={styles.boldText}>{item.claimantName}</Text>
        </Text>

        {/* Claim Message */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>"{item.claimMessage}"</Text>
        </View>

        {/* Action Buttons for Received Claims */}
        {activeTab === 'RECEIVED' && isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnApprove, isLoadingThis && styles.btnDisabled]}
              disabled={isLoadingThis}
              onPress={() => handleUpdateStatus(item, 'APPROVED')}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnReject, isLoadingThis && styles.btnDisabled]}
              disabled={isLoadingThis}
              onPress={() => handleUpdateStatus(item, 'REJECTED')}
            >
              <X size={16} color="#ffffff" />
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat & OTP Actions for Approved Claims */}
        {isApproved && (
          <View style={styles.approvedActionRow}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => openChatModal(item)}
            >
              <MessageSquare size={16} color="#38bdf8" />
              <Text style={styles.chatButtonText}>Private Chat</Text>
            </TouchableOpacity>

            {item.handoverOtp ? (
              <View style={styles.otpPill}>
                <KeyRound size={14} color="#f59e0b" />
                <Text style={styles.otpPillText}>OTP: {item.handoverOtp}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.otpVerifyButton}
                onPress={() => setOtpModalClaim(item)}
              >
                <KeyRound size={16} color="#ffffff" />
                <Text style={styles.otpVerifyText}>Verify OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Review Center</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Row */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'RECEIVED' && styles.tabActive]}
            onPress={() => setActiveTab('RECEIVED')}
          >
            <Text style={[styles.tabText, activeTab === 'RECEIVED' && styles.tabTextActive]}>
              Received Claims
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'MY_CLAIMS' && styles.tabActive]}
            onPress={() => setActiveTab('MY_CLAIMS')}
          >
            <Text style={[styles.tabText, activeTab === 'MY_CLAIMS' && styles.tabTextActive]}>
              My Claims
            </Text>
          </TouchableOpacity>
        </View>

        {/* Claims List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={claims}
            keyExtractor={(item) => item.claimId}
            renderItem={renderClaimCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ShieldCheck size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No claims found</Text>
              </View>
            }
          />
        )}

        {/* Chat Modal */}
        <Modal
          visible={!!activeChatClaim}
          animationType="slide"
          onRequestClose={() => setActiveChatClaim(null)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Chat - {activeChatClaim?.postTitle}
                </Text>
                <TouchableOpacity onPress={() => setActiveChatClaim(null)}>
                  <X size={24} color="#f8fafc" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
                {chatMessages.map((m) => (
                  <View key={m.messageId} style={styles.chatBubble}>
                    <Text style={styles.chatSender}>{m.senderName}</Text>
                    <Text style={styles.chatMessage}>{m.message}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.chatInputRow}>
                <TextInput
                  placeholder="Type a message..."
                  placeholderTextColor="#64748b"
                  style={styles.chatInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
                <TouchableOpacity
                  style={[styles.chatSendBtn, sendingChat && styles.btnDisabled]}
                  disabled={sendingChat}
                  onPress={handleSendChat}
                >
                  <Send size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* OTP Verification Modal */}
        <Modal
          visible={!!otpModalClaim}
          transparent
          animationType="fade"
          onRequestClose={() => setOtpModalClaim(null)}
        >
          <View style={styles.overlayContainer}>
            <View style={styles.otpModalCard}>
              <KeyRound size={32} color="#f59e0b" style={{ alignSelf: 'center', marginBottom: 10 }} />
              <Text style={styles.otpTitle}>Enter Handover OTP</Text>
              <Text style={styles.otpSubtitle}>Ask the post owner for their 6-digit OTP code</Text>

              <TextInput
                placeholder="6-Digit OTP Code"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
              />

              <View style={styles.otpBtnRow}>
                <TouchableOpacity
                  style={styles.otpCancelBtn}
                  onPress={() => setOtpModalClaim(null)}
                >
                  <Text style={styles.otpCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.otpSubmitBtn, verifyingOtp && styles.btnDisabled]}
                  disabled={verifyingOtp}
                  onPress={handleVerifyOtpSubmit}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.otpSubmitText}>Verify & Resolve</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#475569',
  },
  badgeApproved: {
    backgroundColor: '#16a34a',
  },
  badgePending: {
    backgroundColor: '#d97706',
  },
  badgeResolved: {
    backgroundColor: '#2563eb',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  claimantText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  boldText: {
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  messageBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnApprove: {
    backgroundColor: '#16a34a',
  },
  btnReject: {
    backgroundColor: '#dc2626',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  approvedActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  chatButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatButtonText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 13,
  },
  otpVerifyButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  otpVerifyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  otpPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  otpPillText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginTop: 12,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  chatBubble: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chatSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 2,
  },
  chatMessage: {
    fontSize: 14,
    color: '#f8fafc',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    paddingHorizontal: 14,
    height: 44,
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  otpModalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    height: 54,
    marginBottom: 20,
  },
  otpBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  otpCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  otpSubmitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSubmitText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
