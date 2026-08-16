import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { KeyboardWrapper } from '../../components/KeyboardWrapper';
import { loginApi, signupApi } from '../../services/authApi';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

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

        {!isLogin && (
          <Text style={styles.legalText}>
            By creating an account, you agree to our{' '}
            <Text 
              style={styles.legalLink} 
              onPress={() => {
                setLegalModalType('terms');
                setLegalModalVisible(true);
              }}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text 
              style={styles.legalLink} 
              onPress={() => {
                setLegalModalType('privacy');
                setLegalModalVisible(true);
              }}
            >
              Privacy Policy
            </Text>.
          </Text>
        )}

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

      <Modal
        visible={legalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {legalModalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </Text>
            <TouchableOpacity onPress={() => setLegalModalVisible(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {legalModalType === 'privacy' ? (
              <View>
                <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                <Text style={styles.modalText}>When you use our application, we may collect:</Text>
                <Text style={styles.bulletPoint}>• Personal Identification Information: Name, email address, and profile picture (if provided).</Text>
                <Text style={styles.bulletPoint}>• User-Generated Content: Details about items you have lost or found, including descriptions, locations, and images.</Text>
                <Text style={styles.bulletPoint}>• Communication Data: Messages sent through our in-app chat system to facilitate item recovery.</Text>
                <Text style={styles.bulletPoint}>• Technical Data: IP addresses, browser types, and device identifiers collected automatically for security and analytics.</Text>
                
                <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                <Text style={styles.modalText}>We use the collected information to:</Text>
                <Text style={styles.bulletPoint}>• Provide, operate, and maintain our application.</Text>
                <Text style={styles.bulletPoint}>• Verify user identities and prevent fraud or abuse (e.g., false claims).</Text>
                <Text style={styles.bulletPoint}>• Facilitate communication between users for the purpose of returning lost items.</Text>
                <Text style={styles.bulletPoint}>• Send administrative notifications, such as OTPs and chat alerts.</Text>

                <Text style={styles.sectionTitle}>3. Sharing Your Information</Text>
                <Text style={styles.modalText}>We do not sell, trade, or rent your personal identification information to others. Certain information (such as your name and item details) will be visible to other registered users of your organization to facilitate the lost and found process. In-app chat messages are strictly private between the post owner and the claimant, though they may be reviewed by administrators in cases of reported abuse.</Text>

                <Text style={styles.sectionTitle}>4. Data Security</Text>
                <Text style={styles.modalText}>We implement reasonable security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee its absolute security.</Text>

                <Text style={styles.sectionTitle}>5. Your Rights</Text>
                <Text style={styles.modalText}>Depending on your location, you may have the right to access, correct, or delete your personal data. You can manage your account information within the app or contact us directly to request data deletion.</Text>

                <Text style={styles.sectionTitle}>6. Contact Us</Text>
                <Text style={styles.modalText}>If you have any questions about this Privacy Policy, please contact your organization administrator.</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.modalText}>By accessing or using our application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</Text>

                <Text style={styles.sectionTitle}>2. Description of Service</Text>
                <Text style={styles.modalText}>Our application provides a platform connecting individuals who have lost items with those who have found them within specific organizations or campuses. We are a facilitator of information and do not take possession of, own, or verify the authenticity of any items listed on the platform.</Text>

                <Text style={styles.sectionTitle}>3. User Responsibilities & Conduct</Text>
                <Text style={styles.bulletPoint}>• You agree to provide accurate and truthful information when posting items or filing claims.</Text>
                <Text style={styles.bulletPoint}>• You agree not to use the platform for any illegal, harmful, or fraudulent activities (e.g., falsely claiming an item that is not yours).</Text>
                <Text style={styles.bulletPoint}>• You are solely responsible for your interactions with other users. We strongly advise meeting in public, safe locations when handing over items.</Text>

                <Text style={styles.sectionTitle}>4. Limitation of Liability and "Safe Harbor"</Text>
                <Text style={styles.modalText}>PLEASE READ CAREFULLY: To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:</Text>
                <Text style={styles.bulletPoint}>• Your access to or use of or inability to access or use the service.</Text>
                <Text style={styles.bulletPoint}>• Any conduct or content of any third party on the service, including without limitation, any defamatory, offensive, or illegal conduct of other users.</Text>
                <Text style={styles.bulletPoint}>• Any physical harm, theft, or property damage occurring during the physical handover of items arranged through this platform.</Text>

                <Text style={styles.sectionTitle}>5. User-Generated Content</Text>
                <Text style={styles.modalText}>You retain ownership of any content you submit, post, or display on or through the service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content in any and all media or distribution methods. We reserve the right to remove any content that violates these terms.</Text>

                <Text style={styles.sectionTitle}>6. Account Termination</Text>
                <Text style={styles.modalText}>We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms.</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  legalText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  legalLink: {
    color: '#38bdf8',
    textDecorationLine: 'underline',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0f172a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#38bdf8',
    fontWeight: '600',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#94a3b8',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    color: '#94a3b8',
    marginLeft: 8,
    marginBottom: 6,
  },
});
