import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OrganizationMemberUI } from '../../../types/organizationTypes';
import { listMembers, removeMember, getOrganization } from '../../../services/organizationsApi';
import { Users, ArrowLeft, UserMinus, ShieldAlert } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [members, setMembers] = useState<OrganizationMemberUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const org = await getOrganization(id);
      setIsAdmin(org.role === 'ORG_ADMIN' || org.role === 'ORG_MODERATOR');
      
      const data = await listMembers(id);
      setMembers(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMember(id, userId);
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: OrganizationMemberUI }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.roleBadge}>
          <ShieldAlert size={12} color="#8b5cf6" style={styles.iconMargin} />
          <Text style={styles.roleText}>{item.role?.replace('ORG_', '') || 'MEMBER'}</Text>
        </View>
      </View>
      {isAdmin && item.role !== 'ORG_ADMIN' && (
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.userId)}>
          <UserMinus size={18} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Members</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={48} color="#334155" />
                <Text style={styles.emptyText}>No members found</Text>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 2 },
  email: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  roleText: { color: '#8b5cf6', fontSize: 10, fontWeight: 'bold' },
  removeBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#64748b', marginTop: 12 },
});
