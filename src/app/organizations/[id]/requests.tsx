import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { JoinRequestUI } from '../../../types/organizationTypes';
import { listJoinRequests, approveJoinRequest, rejectJoinRequest } from '../../../services/organizationsApi';
import { UserCheck, ArrowLeft, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequestUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [id]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await listJoinRequests(id);
      setRequests(data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reqId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await approveJoinRequest(reqId);
        Alert.alert('Approved', 'User has been added to the organization.');
      } else {
        await rejectJoinRequest(reqId);
        Alert.alert('Rejected', 'Join request denied.');
      }
      loadRequests();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Action failed');
    }
  };

  const renderItem = ({ item }: { item: JoinRequestUI }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <UserCheck size={24} color="#06b6d4" />
        <View style={styles.cardInfo}>
          <Text style={styles.userName}>{item.fullName || item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.message && <Text style={styles.message}>"{item.message}"</Text>}
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction(item.id, 'reject')}>
          <X size={16} color="#ffffff" />
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAction(item.id, 'approve')}>
          <Check size={16} color="#ffffff" />
          <Text style={styles.actionText}>Approve</Text>
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
          <Text style={styles.headerTitle}>Pending Join Requests</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <UserCheck size={48} color="#334155" />
                <Text style={styles.emptyText}>No pending join requests</Text>
              </View>
            }
          />
        )}
      </View>
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  cardInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 2 },
  userEmail: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  message: { fontSize: 13, color: '#cbd5e1', fontStyle: 'italic', backgroundColor: '#0f172a', padding: 8, borderRadius: 8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10 },
  rejectBtn: { backgroundColor: '#ef4444' },
  acceptBtn: { backgroundColor: '#10b981' },
  actionText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#64748b', marginTop: 12 },
});
