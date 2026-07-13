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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { AuthStore } from '../constants/auth';
import { EmailService } from '../constants/emailService';

export default function ForgotPassword() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Form Fields — Step 1: email; Step 2: OTP + new password
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Send OTP to email
  const handleSendOTP = async () => {
    setErrorMsg('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setIsSending(true);
    try {
      const exists = await AuthStore.userExists(email.trim().toLowerCase());
      if (!exists) {
        setErrorMsg('This email address is not registered with quickCart.');
        setIsSending(false);
        return;
      }
      // Fetch user name
      const userSnap = await getDoc(doc(db, 'users', email.trim().toLowerCase()));
      const userName = userSnap.exists() ? (userSnap.data().fullName || 'Customer') : 'Customer';

      // Generate OTP and store in Firestore
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await setDoc(doc(db, 'otps', `reset_${email.trim().toLowerCase()}`), {
        code: newOtp,
        expiresAt: expiry.toISOString(),
        used: false,
        email: email.trim().toLowerCase(),
      });

      // Send email with OTP
      await EmailService.sendForgotPassword(email.trim().toLowerCase(), userName, newOtp);
      setStep('otp');
      setSuccessMsg(`A 6-digit reset code has been sent to ${email.trim()}.`);
    } catch {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    // Verify OTP against Firestore
    try {
      const otpRef = doc(db, 'otps', `reset_${email.trim().toLowerCase()}`);
      const otpSnap = await getDoc(otpRef);
      if (!otpSnap.exists()) { setErrorMsg('No reset code found. Please request again.'); return; }
      const otpData = otpSnap.data();
      if (otpData.used) { setErrorMsg('This code has already been used.'); return; }
      if (new Date() > new Date(otpData.expiresAt)) { setErrorMsg('This code has expired. Please request a new one.'); return; }
      if (otpData.code !== otp.trim()) { setErrorMsg('Invalid code. Please check and try again.'); return; }
    } catch {
      setErrorMsg('Verification failed. Please try again.');
      return;
    }

    if (newPassword.length < 6) { setErrorMsg('Password must be at least 6 characters long.'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }

    // Attempt Reset
    try {
      const resetSuccess = await AuthStore.resetPassword(email.trim().toLowerCase(), newPassword);
      // Mark OTP as used
      await setDoc(doc(db, 'otps', `reset_${email.trim().toLowerCase()}`), { used: true }, { merge: true });
      if (resetSuccess) {
        setSuccessMsg('Password changed successfully! Redirecting to login...');
        setTimeout(() => { router.replace('/login'); }, 2000);
      } else {
        setErrorMsg('Password reset failed. Please try again.');
      }
    } catch {
      setErrorMsg('Password reset failed. Please try again.');
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
              {step === 'email'
                ? 'Enter your registered email to receive a reset code.'
                : 'Enter the 6-digit code sent to your email.'}
            </Text>
          </View>

          {/* Reset Card */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            <Text style={[styles.formHeader, { color: colors.text }]}>
              {step === 'email' ? 'Forgot Password' : 'Reset Password'}
            </Text>

            {errorMsg ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[styles.successContainer, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                <Text style={[styles.successText, { color: colors.success }]}>{successMsg}</Text>
              </View>
            ) : null}

            {step === 'email' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Registered Email</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter your email address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Send OTP Button */}
                <Pressable
                  onPress={handleSendOTP}
                  disabled={isSending}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed || isSending ? 0.8 : 1,
                      marginTop: Spacing.md,
                    },
                  ]}
                >
                  <Text style={styles.submitBtnText}>
                    {isSending ? 'Sending Code...' : 'Send Reset Code'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* OTP Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Reset Code (OTP)</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="keypad-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>
                </View>

                {/* New Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Re-enter new password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleResetPassword}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.9 : 1,
                      marginTop: Spacing.md,
                    },
                  ]}
                >
                  <Text style={styles.submitBtnText}>Reset Password</Text>
                </Pressable>

                {/* Back to email step */}
                <Pressable onPress={() => { setStep('email'); setErrorMsg(''); setSuccessMsg(''); }} style={{ alignItems: 'center', marginTop: Spacing.md }}>
                  <Text style={[styles.inputLabel, { color: colors.primary }]}>← Change email</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Login Option */}
          <View style={styles.loginSuggestion}>
            <Text style={[styles.suggestionText, { color: colors.textMuted }]}>
              Remembered password?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>Login</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  successContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  successText: {
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
});
