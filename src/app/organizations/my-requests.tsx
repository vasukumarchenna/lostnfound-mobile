import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { JoinRequestUI } from '../../types/organizationTypes';
import { listMyJoinRequests, cancelJoinRequest } from '../../services/organizationsApi';
import { UserCheck, ArrowLeft, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequestUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await listMyJoinRequests();
      setRequests(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelJoinRequest(id);
      Alert.alert('Success', 'Join request canceled.');
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
          <Text style={styles.orgName}>{item.organizationName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      {item.status === 'PENDING' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
          <X size={16} color="#ffffff" />
          <Text style={styles.cancelText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Join Requests</Text>
          <View style={{ width: 40 }} />
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
                <Text style={styles.emptyText}>No join requests sent</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orgName: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  statusBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold' },
  cancelBtn: { marginTop: 16, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10 },
  cancelText: { color: '#ffffff', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#64748b', marginTop: 12 },
});
