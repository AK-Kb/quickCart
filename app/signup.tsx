import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useColorScheme,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { AuthStore } from '../constants/auth';
const validatePassword = (pass: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
  return regex.test(pass);
};

export default function Signup() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Errors & Modals
  const [errorMsg, setErrorMsg] = useState('');
  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignupSubmit = async () => {
    setErrorMsg('');

    // Validations
    if (!name.trim() || !mobile.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (mobile.trim().length !== 10 || isNaN(Number(mobile))) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!validatePassword(password)) {
      setErrorMsg('Password must contain at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const exists = await AuthStore.userExists(mobile.trim());
      if (exists) {
        setErrorMsg('This mobile number is already registered. Please Login.');
        return;
      }
    } catch {
      setErrorMsg('An error occurred. Please try again.');
      return;
    }

    // Open OTP modal if verification triggers
    setOtpInput('');
    setOtpError('');
    setIsOtpModalVisible(true);
  };

  const handleVerifyOtp = async () => {
    setOtpError('');

    if (otpInput.trim() === '123456') {
      // Correct OTP
      try {
        const registerSuccess = await AuthStore.register(name.trim(), mobile.trim(), password);
        
        if (registerSuccess) {
          setIsSuccess(true);
          setTimeout(() => {
            setIsOtpModalVisible(false);
            setIsSuccess(false);
            router.replace('/login');
          }, 2000);
        } else {
          setOtpError('Registration failed. Please try again.');
        }
      } catch {
        setOtpError('Registration failed. Please try again.');
      }
    } else {
      setOtpError('Incorrect OTP code. Hint: Use 123456');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo & Header */}
          <View style={styles.headerSection}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: colors.text }]}>
              quick<Text style={{ color: colors.secondary }}>Cart</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Create an account and enjoy instant checkouts!
            </Text>
          </View>

          {/* Registration Form */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            <Text style={[styles.formHeader, { color: colors.text }]}>Register Account</Text>

            {errorMsg ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textMuted}
                  autoComplete="name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Mobile Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mobile Number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
              {password.length > 0 && !validatePassword(password) && (
                <Text style={[styles.passwordValidationError, { color: colors.error }]}>
                  Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, 1 special character, and be at least 6 characters.
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSignupSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                  marginTop: Spacing.md,
                },
              ]}
            >
              <Text style={styles.submitBtnText}>Sign Up</Text>
            </Pressable>
          </View>

          {/* Login Option */}
          <View style={styles.loginSuggestion}>
            <Text style={[styles.suggestionText, { color: colors.textMuted }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>Login</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================== OTP VERIFICATION MODAL ==================== */}
      <Modal
        visible={isOtpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Verify Mobile</Text>
              {!isSuccess && (
                <Pressable onPress={() => setIsOtpModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              )}
            </View>

            {isSuccess ? (
              /* Verification Success State */
              <View style={styles.successState}>
                <View style={[styles.successBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={54} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>Verified Successfully!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
                  Your account has been registered. Redirecting to Login...
                </Text>
              </View>
            ) : (
              /* OTP Form State */
              <View>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  An OTP has been sent to your mobile <Text style={{ fontWeight: 'bold', color: colors.text }}>+91 {mobile}</Text>. Please enter the code to complete verification.
                </Text>

                {otpError ? (
                  <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{otpError}</Text>
                  </View>
                ) : null}

                <View style={styles.otpInputGroup}>
                  <TextInput
                    style={[styles.otpInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={colors.textMuted}
                    maxLength={6}
                    keyboardType="number-pad"
                    value={otpInput}
                    onChangeText={setOtpInput}
                  />
                  <Text style={[styles.otpHint, { color: colors.secondary }]}>
                    Default OTP to verify: <Text style={{ fontWeight: 'bold' }}>123456</Text>
                  </Text>
                </View>

                <Pressable
                  onPress={handleVerifyOtp}
                  style={({ pressed }) => [
                    styles.verifyBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.verifyBtnText}>Verify OTP</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  formCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  formHeader: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  errorContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  submitBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginSuggestion: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  suggestionText: {
    fontSize: 15,
  },
  loginLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // MODAL OVERLAY STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  otpInputGroup: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  otpInput: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  otpHint: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  verifyBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // SUCCESS STATE STYLES
  successState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  passwordValidationError: {
    fontSize: 12,
    marginTop: Spacing.xs,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
});
