import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createOrganization } from '../../services/organizationsApi';
import { JoinPolicy } from '../../types/organizationTypes';
import { ArrowLeft, Building2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateOrganizationScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [policy, setPolicy] = useState<JoinPolicy>('OPEN');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !type.trim()) {
      Alert.alert('Error', 'Name and type are required');
      return;
    }
    setLoading(true);
    try {
      await createOrganization({ name, type, joinPolicy: policy });
      Alert.alert('Success', 'Organization created successfully!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Organization</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.iconContainer}>
            <Building2 size={48} color="#3b82f6" />
          </View>

          <Text style={styles.label}>Organization Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., State University"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., University, Corporate"
            placeholderTextColor="#64748b"
            value={type}
            onChangeText={setType}
          />

          <Text style={styles.label}>Join Policy</Text>
          <View style={styles.policyRow}>
            {(['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY'] as JoinPolicy[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.policyButton, policy === p && styles.policyButtonActive]}
                onPress={() => setPolicy(p)}
              >
                <Text style={[styles.policyText, policy === p && styles.policyTextActive]}>
                  {p.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Create Organization</Text>}
          </TouchableOpacity>
        </View>
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
  form: { padding: 24 },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    color: '#f8fafc',
    marginBottom: 20,
  },
  policyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  policyButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  policyButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  policyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  policyTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
