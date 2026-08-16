import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InvitationUI, OrgRole } from '../../../types/organizationTypes';
import { listSentInvitations, revokeInvitation, createInvitation } from '../../../services/organizationsApi';
import { Mail, ArrowLeft, Trash2, Plus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardWrapper } from '../../../components/KeyboardWrapper';

export default function InvitationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationUI[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [invitedUserId, setInvitedUserId] = useState('');
  const [role, setRole] = useState<OrgRole>('ORG_MEMBER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [id]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await listSentInvitations(id);
      setInvitations(data.filter(i => i.status === 'PENDING'));
    } catch (e) {
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (invId: string) => {
    try {
      await revokeInvitation(invId);
      loadInvitations();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to revoke invitation');
    }
  };

  const handleInvite = async () => {
    if (!invitedUserId.trim()) {
      Alert.alert('Error', 'User ID is required');
      return;
    }
    setInviting(true);
    try {
      await createInvitation(id, { invitedUserId: invitedUserId.trim(), roleToAssign: role });
      setModalVisible(false);
      setInvitedUserId('');
      loadInvitations();
      Alert.alert('Success', 'Invitation sent!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const renderItem = ({ item }: { item: InvitationUI }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Mail size={24} color="#f59e0b" />
        <View style={styles.cardInfo}>
          <Text style={styles.inviteeId}>User ID: {item.invitedUserId}</Text>
          <Text style={styles.roleText}>Role: {item.roleToAssign?.replace('ORG_', '')}</Text>
        </View>
        <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(item.invitationId)}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sent Invitations</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(item) => item.invitationId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Mail size={48} color="#334155" />
                <Text style={styles.emptyText}>No pending invitations sent</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardWrapper type="modal" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Invitation</Text>
            
            <Text style={styles.label}>User ID to Invite</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter User ID (UUID)"
              placeholderTextColor="#64748b"
              value={invitedUserId}
              onChangeText={setInvitedUserId}
            />

            <Text style={styles.label}>Role to Assign</Text>
            <View style={styles.roleRow}>
              {(['ORG_ADMIN', 'ORG_MODERATOR', 'ORG_MEMBER'] as OrgRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleButton, role === r && styles.roleButtonActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleTextBtn, role === r && styles.roleTextBtnActive]}>{r.replace('ORG_', '')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleInvite} disabled={inviting}>
                {inviting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Send Invite</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardWrapper>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconMargin: {
    marginRight: 4,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  inviteeId: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 2 },
  roleText: { fontSize: 12, color: '#94a3b8' },
  revokeBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#64748b', marginTop: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 16, height: 50, color: '#f8fafc', marginBottom: 20 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  roleButton: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  roleButtonActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  roleTextBtn: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  roleTextBtnActive: { color: '#ffffff' },
  actionRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#94a3b8', fontWeight: 'bold' },
  submitBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#ffffff', fontWeight: 'bold' },
});
