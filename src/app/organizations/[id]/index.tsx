import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { OrganizationUI } from '../../../types/organizationTypes';
import { getOrganization, createJoinRequest, leaveOrganization } from '../../../services/organizationsApi';
import { Building2, ArrowLeft, Users, Mail, UserCheck, ShieldAlert, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrganizationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizationUI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrg();
  }, [id]);

  const loadOrg = async () => {
    setLoading(true);
    try {
      const data = await getOrganization(id);
      setOrg(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load organization details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await createJoinRequest(id);
      Alert.alert('Success', 'Join request submitted!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to request joining');
    }
  };

  const handleLeave = async () => {
    Alert.alert('Leave Organization', 'Are you sure you want to leave this organization?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveOrganization(id);
            Alert.alert('Success', 'You have left the organization.');
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to leave');
          }
        },
      },
    ]);
  };

  if (loading || !org) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const isAdmin = org.role === 'ORG_ADMIN' || org.role === 'ORG_MODERATOR';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organization Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroCard}>
            <Building2 size={48} color="#3b82f6" />
            <Text style={styles.orgName}>{org.name}</Text>
            <Text style={styles.orgType}>{org.type}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.policyBadge}>
                <Text style={styles.policyText}>{org.joinPolicy?.replace('_', ' ') || 'OPEN'}</Text>
              </View>
              {org.isVerified && (
                <View style={[styles.policyBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Text style={[styles.policyText, { color: '#10b981' }]}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          {/* If the user is NOT a member */}
          {!org.role && (
            <View style={styles.joinSection}>
              <Text style={styles.joinText}>You are not a member of this organization.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleJoin}>
                <Text style={styles.primaryButtonText}>
                  {org.joinPolicy === 'OPEN' ? 'Join Now' : 'Request to Join'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* If the user IS a member */}
          {org.role && (
            <>
              <Text style={styles.sectionTitle}>MY ROLE</Text>
              <View style={styles.menuGroup}>
                <View style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconContainer}>
                      <ShieldAlert size={20} color="#8b5cf6" />
                    </View>
                    <Text style={styles.menuItemText}>{org.role?.replace('ORG_', '')}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.menuItem} onPress={handleLeave}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                      <LogOut size={20} color="#ef4444" />
                    </View>
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Leave Organization</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>MANAGEMENT</Text>
              <View style={styles.menuGroup}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push(`/organizations/${org.organizationId}/members`)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconContainer}>
                      <Users size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.menuItemText}>{isAdmin ? 'Manage Members' : 'View Members'}</Text>
                  </View>
                </TouchableOpacity>

                {isAdmin && (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => router.push(`/organizations/${org.organizationId}/invitations`)}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.iconContainer}>
                          <Mail size={20} color="#f59e0b" />
                        </View>
                        <Text style={styles.menuItemText}>Sent Invitations</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => router.push(`/organizations/${org.organizationId}/requests`)}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.iconContainer}>
                          <UserCheck size={20} color="#06b6d4" />
                        </View>
                        <Text style={styles.menuItemText}>Pending Join Requests</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  centerContainer: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  heroCard: { alignItems: 'center', backgroundColor: '#1e293b', padding: 32, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  orgName: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginTop: 16, marginBottom: 4 },
  orgType: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 10 },
  policyBadge: { backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  policyText: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
  joinSection: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  joinText: { color: '#cbd5e1', marginBottom: 16 },
  primaryButton: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
  menuGroup: { backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuItemText: { fontSize: 16, fontWeight: '500', color: '#e2e8f0' },
});
