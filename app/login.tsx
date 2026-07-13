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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { AuthStore } from '../constants/auth';
import { SessionStore, CartStore } from '../constants/cart';

export default function Login() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      setIsLoggingIn(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const user = await AuthStore.login(email.trim().toLowerCase(), password);
      if (user) {
        SessionStore.setUser(user);
        // Load cart items from Firestore on successful login
        await CartStore.loadFromFirestore();
        // Redirect based on user role
        if (user.role === 'admin') {
          router.replace('/admin' as any);
        } else {
          router.replace('/permissions');
        }
      } else {
        setErrorMsg('Invalid email or password. If you are new, please Sign Up first.');
      }
    } catch {
      setErrorMsg('An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
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
              Login to enjoy the fastest shopping experience!
            </Text>
          </View>
 
          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            <Text style={[styles.formHeader, { color: colors.text }]}>Welcome Back</Text>
            
            {errorMsg ? (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
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
                  placeholder="Enter your password"
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
            </View>

            {/* Forgot Password Link */}
            <Pressable
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotPasswordLink}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.secondary }]}>
                Forgot Password?
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={isLoggingIn}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || isLoggingIn ? 0.8 : 1,
                },
              ]}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Login</Text>
              )}
            </Pressable>
          </View>

          {/* Signup Suggestion */}
          <View style={styles.signupSuggestion}>
            <Text style={[styles.suggestionText, { color: colors.textMuted }]}>
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={[styles.signupLinkText, { color: colors.primary }]}>Sign Up</Text>
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
    marginBottom: Spacing.xxl,
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
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
  signupSuggestion: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  suggestionText: {
    fontSize: 15,
  },
  signupLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },

});
