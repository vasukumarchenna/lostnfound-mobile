import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OrganizationUI } from '../../types/organizationTypes';
import { listOrganizations, listMyOrganizations } from '../../services/organizationsApi';
import { Building2, Plus, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrganizationsIndex() {
  const router = useRouter();
  const [tab, setTab] = useState<'ALL' | 'MY'>('MY');
  const [orgs, setOrgs] = useState<OrganizationUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrgs();
  }, [tab]);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      if (tab === 'ALL') {
        const data = await listOrganizations();
        setOrgs(data);
      } else {
        const data = await listMyOrganizations();
        setOrgs(data);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: OrganizationUI }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/organizations/${item.organizationId}`)}
    >
      <View style={styles.cardHeader}>
        <Building2 size={24} color="#3b82f6" />
        <View style={styles.cardInfo}>
          <Text style={styles.orgName}>{item.name}</Text>
          <Text style={styles.orgType}>{item.type}</Text>
        </View>
        <View style={styles.policyBadge}>
          <Text style={styles.policyText}>{item.joinPolicy?.replace('_', ' ') || 'OPEN'}</Text>
        </View>
      </View>
      {item.role && (
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Role: {item.role?.replace('ORG_', '')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organizations</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === 'MY' && styles.activeTab]}
            onPress={() => setTab('MY')}
          >
            <Text style={[styles.tabText, tab === 'MY' && styles.activeTabText]}>My Orgs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'ALL' && styles.activeTab]}
            onPress={() => setTab('ALL')}
          >
            <Text style={[styles.tabText, tab === 'ALL' && styles.activeTabText]}>Browse All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={orgs}
            keyExtractor={(item) => item.organizationId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Building2 size={48} color="#334155" />
                <Text style={styles.emptyText}>No organizations found</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/organizations/create')}
        >
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 2,
  },
  orgType: {
    fontSize: 12,
    color: '#94a3b8',
  },
  policyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  policyText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
