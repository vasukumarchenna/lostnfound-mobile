import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardWrapper } from '../../components/KeyboardWrapper';
import { loginApi, signupApi } from '../../services/authApi';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password1');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginApi(email, password);
        router.replace('/');
      } else {
        if (!fullName.trim() || !username.trim() || !phone.trim()) {
          Alert.alert('Error', 'Please fill in all registration fields');
          setLoading(false);
          return;
        }

        await signupApi({
          full_name: fullName,
          username,
          email,
          password_hash: password,
          phone_number: phone,
        });

        Alert.alert('Success', 'Account created! Please log in.');
        setIsLogin(true);
      }
    } catch (error: any) {
      console.log(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An error occurred';
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardWrapper type="scrollable" style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Branding */}
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <ShieldCheck size={36} color="#3b82f6" />
        </View>
        <Text style={styles.title}>Lost & Found</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to manage lost & found items' : 'Create your account to get started'}
        </Text>
      </View>

      {/* Card Form */}
      <View style={styles.formCard}>
        {!isLogin && (
          <>
            <View style={styles.inputContainer}>
              <User size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputContainer}>
              <User size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Username"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </>
        )}

        <View style={styles.inputContainer}>
          <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeIconContainer}
          >
            {showPassword ? (
              <EyeOff size={20} color="#94a3b8" />
            ) : (
              <Eye size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleAuth}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.toggleHighlight}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
  },
  eyeIconContainer: {
    padding: 6,
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  toggleHighlight: {
    color: '#38bdf8',
    fontWeight: '600',
  },
});
