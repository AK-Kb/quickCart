import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { AuthStore } from '../constants/auth';
import { SessionStore } from '../constants/cart';
import { EmailService } from '../constants/emailService';

export default function OtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const email = (params.email as string) || '';
  const name = (params.name as string) || '';
  const password = (params.password as string) || '';
  const mobile = (params.mobile as string) || '';

  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  // Cooldown timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setErrorMsg('');
    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setErrorMsg('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsVerifying(true);
    try {
      const otpRef = doc(db, 'otps', email.toLowerCase());
      const otpSnap = await getDoc(otpRef);

      if (otpSnap.exists()) {
        const otpData = otpSnap.data();

        // 1. Check if used
        if (otpData.used) {
          setErrorMsg('This OTP has already been verified and cannot be reused.');
          setIsVerifying(false);
          return;
        }

        // 2. Check if expired
        const now = new Date();
        const expiresAt = new Date(otpData.expiresAt);
        if (now > expiresAt) {
          setErrorMsg('This OTP has expired. Please request a new one.');
          setIsVerifying(false);
          return;
        }

        // 3. Match code
        if (otpData.code === otpCode.trim()) {
          // Success: Mark OTP as used
          await updateDoc(otpRef, { used: true });

          // Register user in users collection
          const registerSuccess = await AuthStore.register(name, email, password, mobile);
          if (registerSuccess) {
            // Set session
            SessionStore.setUser({ name, email, mobile });
            // Send welcome email (fire-and-forget, non-blocking)
            EmailService.sendWelcome(email, name).catch(() => null);
            // Redirect directly to Dashboard
            router.replace('/(tabs)');
          } else {
            setErrorMsg('Registration failed. Please try again.');
          }
        } else {
          setErrorMsg('Invalid OTP. Please check the code and try again.');
        }
      } else {
        setErrorMsg('No OTP found. Please click Resend OTP.');
      }
    } catch (e) {
      console.error('Error verifying OTP:', e);
      setErrorMsg('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setOtpCode('');
    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      await setDoc(doc(db, 'otps', email.toLowerCase()), {
        code: newOtp,
        expiresAt: expiresAt.toISOString(),
        used: false,
        email: email.toLowerCase(),
      });

      // Send via local OTP backend or fallback to Cloud Function
      try {
        const hostUri = Constants.expoConfig?.hostUri || '';
        let hostIp = hostUri ? hostUri.split(':')[0] : 'localhost';
        if (hostIp === 'localhost' && Platform.OS === 'android') {
          hostIp = '10.0.2.2';
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(`http://${hostIp}:3000/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: newOtp }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Local server failed');
        }
      } catch {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);

          await fetch('https://us-central1-quickcart-3cd3e.cloudfunctions.net/sendOTP', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp: newOtp }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch {
          console.log(`[DEV OTP DELIVERY] Code for ${email} is: ${newOtp}`);
        }
      }

      setCooldown(60);
      Alert.alert('OTP Sent', `A new verification code has been sent to ${email}.`);
    } catch (e) {
      console.error('Error resending OTP:', e);
      setErrorMsg('Failed to resend OTP. Please try again.');
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
          
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.headerSection}>
            <Text style={[styles.title, { color: colors.text }]}>Email Verification</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Enter the 6-digit verification code sent to{'\n'}
              <Text style={{ fontWeight: '700', color: colors.text }}>{email}</Text>
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            {errorMsg ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Verification Code</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={isVerifying}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: pressed || isVerifying ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.submitBtnText}>
                {isVerifying ? 'Verifying...' : 'Verify & Register'}
              </Text>
            </Pressable>

            <View style={styles.resendSection}>
              {cooldown > 0 ? (
                <Text style={[styles.cooldownText, { color: colors.textMuted }]}>
                  Resend code in <Text style={{ fontWeight: '700' }}>{cooldown}s</Text>
                </Text>
              ) : (
                <Pressable onPress={handleResend}>
                  <Text style={[styles.resendText, { color: colors.primary }]}>Resend OTP</Text>
                </Pressable>
              )}
            </View>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    padding: Spacing.xs,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 48,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
  },
  submitBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  resendSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  cooldownText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
