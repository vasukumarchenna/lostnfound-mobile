import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getStoredUser, logoutApi, UserAuthData } from '../../services/authApi';
import { useRouter } from 'expo-router';
import {
  Building2,
  Mail,
  UserCheck,
  User,
  FileText,
  ShieldCheck,
  Bell,
  KeyRound,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserAuthData | null>(null);

  useEffect(() => {
    // Adding a focus listener if we used useFocusEffect, but for now we'll just rely on standard effect
    const loadUser = async () => {
      const stored = await getStoredUser();
      if (stored) {
        setUser(stored);
      } else {
        router.replace('/auth/login');
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logoutApi();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    onPress: () => void,
    isDestructive = false
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, isDestructive && styles.destructiveIconContainer]}>
          {icon}
        </View>
        <Text style={[styles.menuItemText, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
      </View>
      {!isDestructive && <ChevronRight size={20} color="#64748b" />}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Menu</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName ? user.fullName : 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>

          {/* Activity Section */}
          <Text style={styles.sectionTitle}>MY ACTIVITY</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(<FileText size={20} color="#3b82f6" />, 'My Posts', () => {
              router.push('/my-posts');
            })}
            {renderMenuItem(<ShieldCheck size={20} color="#10b981" />, 'Claims', () => {
              router.push('/claims');
            })}
          </View>

          {/* Organizations Section */}
          <Text style={styles.sectionTitle}>ORGANIZATIONS</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(<Building2 size={20} color="#8b5cf6" />, 'Browse Organizations', () => {
              router.push('/organizations');
            })}
            {renderMenuItem(<Mail size={20} color="#f59e0b" />, 'My Invitations', () => {
              router.push('/organizations/my-invitations');
            })}
            {renderMenuItem(<UserCheck size={20} color="#06b6d4" />, 'My Join Requests', () => {
              router.push('/organizations/my-requests');
            })}
          </View>

          {/* Settings Section */}
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.menuGroup}>
            {renderMenuItem(<User size={20} color="#10b981" />, 'Edit Profile', () => {
              router.push('/edit-profile');
            })}
            {renderMenuItem(<Bell size={20} color="#f59e0b" />, 'Notification Settings', () => {
              router.push('/notification-settings');
            })}
            {renderMenuItem(<KeyRound size={20} color="#8b5cf6" />, 'Change Password', () => {
              router.push('/change-password');
            })}
          </View>

          {/* Logout Section */}
          <View style={[styles.menuGroup, styles.logoutGroup]}>
            {renderMenuItem(
              <LogOut size={20} color="#ef4444" />,
              'Logout',
              handleLogout,
              true
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94a3b8',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  menuGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutGroup: {
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveIconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  destructiveText: {
    color: '#ef4444',
  },
});
