import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { InvitationUI } from '../../types/organizationTypes';
import { listMyInvitations, acceptInvitation, rejectInvitation } from '../../services/organizationsApi';
import { Mail, ArrowLeft, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyInvitationsScreen() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await listMyInvitations();
      setInvitations(data.filter(i => i.status === 'PENDING'));
    } catch (e) {
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await acceptInvitation(id);
        Alert.alert('Success', 'You joined the organization!');
      } else {
        await rejectInvitation(id);
        Alert.alert('Rejected', 'Invitation declined.');
      }
      loadInvitations();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Action failed');
    }
  };

  const renderItem = ({ item }: { item: InvitationUI }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Mail size={24} color="#f59e0b" />
        <View style={styles.cardInfo}>
          <Text style={styles.orgName}>{item.organizationName}</Text>
          <Text style={styles.roleText}>Invited as: {item.roleToAssign?.replace('ORG_', '')}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction(item.invitationId, 'reject')}>
          <X size={16} color="#ffffff" />
          <Text style={styles.actionText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAction(item.invitationId, 'accept')}>
          <Check size={16} color="#ffffff" />
          <Text style={styles.actionText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Invitations</Text>
          <View style={{ width: 40 }} />
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
                <Text style={styles.emptyText}>No pending invitations</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
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
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardInfo: { flex: 1 },
  orgName: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 2 },
  roleText: { fontSize: 12, color: '#94a3b8' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10 },
  rejectBtn: { backgroundColor: '#ef4444' },
  acceptBtn: { backgroundColor: '#10b981' },
  actionText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#64748b', marginTop: 12 },
});
