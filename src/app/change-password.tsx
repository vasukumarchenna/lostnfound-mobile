import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Lock, Eye, EyeOff } from 'lucide-react-native';
import { changePasswordApi } from '../services/authApi';
import { KeyboardWrapper } from '../components/KeyboardWrapper';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert('Error', 'New password must be at least 6 characters, and include one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      await changePasswordApi(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordContainer}>
        <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#64748b"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <TouchableOpacity style={[styles.saveButton, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Save size={20} color="#ffffff" />}
        </TouchableOpacity>
      </View>

      <KeyboardWrapper type="scrollable" style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.infoBox}>
            <Lock size={24} color="#3b82f6" />
            <Text style={styles.infoText}>
              Your password must be at least 6 characters long and include an uppercase letter, lowercase letter, number, and special character.
            </Text>
          </View>

          <View style={styles.card}>
            {renderPasswordInput('Current Password', currentPassword, setCurrentPassword, showCurrentPassword, setShowCurrentPassword)}
            {renderPasswordInput('New Password', newPassword, setNewPassword, showNewPassword, setShowNewPassword)}
            {renderPasswordInput('Confirm New Password', confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword)}
          </View>
      </KeyboardWrapper>
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
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#f8fafc',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
});
