import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Save } from 'lucide-react-native';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferenceUI } from '../services/notificationsApi';
import { listMyOrganizations } from '../services/organizationsApi';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferenceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotificationPreferences();
      const myOrgs = await listMyOrganizations();
      const isAdminInAnyOrg = myOrgs.some((org) => org.role === 'ORG_ADMIN');
      
      if (isAdminInAnyOrg) {
        setPreferences(data);
      } else {
        setPreferences(data.slice(0, -3));
      }
    } catch (e) {
      console.warn('Failed to load preferences', e);
      Alert.alert('Error', 'Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const toggleInApp = (index: number) => {
    const newPrefs = [...preferences];
    newPrefs[index].isInAppEnabled = !newPrefs[index].isInAppEnabled;
    setPreferences(newPrefs);
  };

  const toggleEmail = (index: number) => {
    const newPrefs = [...preferences];
    newPrefs[index].isEmailEnabled = !newPrefs[index].isEmailEnabled;
    setPreferences(newPrefs);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(preferences);
      Alert.alert('Success', 'Notification settings saved successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const formatEventName = (eventType: string) => {
    if (!eventType) return 'Unknown Event';
    return eventType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .map((word) => (word === 'Org' ? 'Organization' : word))
      .join(' ');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity style={[styles.saveButton, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Save size={20} color="#ffffff" />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.infoBox}>
            <Bell size={24} color="#3b82f6" />
            <Text style={styles.infoText}>
              Choose how you want to be notified about different activities on your account.
            </Text>
          </View>

          {preferences.map((pref, index) => (
            <View key={pref.eventType || `pref-${index}`} style={styles.prefCard}>
              <Text style={styles.eventTitle}>{formatEventName(pref.eventType)}</Text>
              
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.toggleTitle}>Push Notifications</Text>
                  <Text style={styles.toggleDesc}>Receive alerts on your device</Text>
                </View>
                <Switch
                  value={pref.isInAppEnabled}
                  onValueChange={() => toggleInApp(index)}
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.toggleRow, styles.noBorder]}>
                <View style={styles.toggleLabelContainer}>
                  <Text style={styles.toggleTitle}>Email Notifications</Text>
                  <Text style={styles.toggleDesc}>Receive emails to your inbox</Text>
                </View>
                <Switch
                  value={pref.isEmailEnabled}
                  onValueChange={() => toggleEmail(index)}
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  prefCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  noBorder: { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 },
  toggleLabelContainer: { flex: 1, paddingRight: 16 },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginBottom: 4 },
  toggleDesc: { fontSize: 12, color: '#64748b' },
});
