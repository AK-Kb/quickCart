import { Stack, router, ErrorBoundaryProps, useSegments } from "expo-router";
import { View, Text, StyleSheet, Pressable, useColorScheme, Platform, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "../constants/theme";
import { useSessionState, SessionStore } from "../constants/cart";

// Root Layout Stack router
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const segments = useSegments();
  const user = useSessionState();

  // Track whether the session has been restored from storage yet
  // Until this is true, we don't navigate anywhere (prevents flicker/race)
  const [sessionRestored, setSessionRestored] = useState(false);

  // On mount: restore persisted session from AsyncStorage before any navigation
  useEffect(() => {
    SessionStore.restoreSession().finally(() => {
      setSessionRestored(true);
    });
  }, []);

    // Guard: redirect based on auth state only after session is confirmed
  useEffect(() => {
    if (!sessionRestored) return;

    const routeSegments = segments as string[];

    // Routes that don't require authentication
    const inAuthGroup =
      routeSegments[0] === 'login' ||
      routeSegments[0] === 'signup' ||
      routeSegments[0] === 'forgot-password' ||
      routeSegments[0] === 'otp' ||
      routeSegments[0] === 'index' ||
      routeSegments.length === 0;

    // The splash/onboarding screen at root index is always accessible
    const isRootIndex = routeSegments.length === 0 || routeSegments[0] === 'index';

    // Check if accessing admin route
    const inAdminGroup = routeSegments[0] === 'admin';

    if (!user && !inAuthGroup) {
      // Unauthenticated: protect all non-auth routes
      console.log('[Auth] Unauthenticated access to protected route — redirecting to /login');
      router.replace('/login');
    } else if (user && inAuthGroup && !isRootIndex) {
      // Authenticated user on a login/signup screen — send to correct dashboard
      if (user.role === 'admin') {
        console.log('[Auth] Authenticated admin on auth screen — redirecting to /admin');
        router.replace('/admin' as any);
      } else {
        console.log('[Auth] Authenticated customer on auth screen — redirecting to /(tabs)');
        router.replace('/(tabs)');
      }
    } else if (user && user.role !== 'admin' && inAdminGroup) {
      // Customer trying to access admin screens — block and redirect
      console.log('[Auth] Customer tried to access admin screens — redirecting to /(tabs)');
      router.replace('/(tabs)');
    } else if (user && user.role === 'admin' && !inAdminGroup && !inAuthGroup) {
      // Admin trying to access customer screens — block and redirect to admin panel
      console.log('[Auth] Admin tried to access customer screens — redirecting to /admin');
      router.replace('/admin' as any);
    }
  }, [user, segments, sessionRestored]);

  // Show a centered spinner while restoring session to prevent flash of login screen
  if (!sessionRestored) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="otp" options={{ headerShown: false }} />
      <Stack.Screen name="permissions" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="addresses" options={{ headerShown: false }} />
      <Stack.Screen name="add-address" options={{ headerShown: false }} />
      <Stack.Screen name="edit-address" options={{ headerShown: false }} />
      <Stack.Screen name="order-success" options={{ headerShown: false }} />
      <Stack.Screen name="item/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="error-test" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

// Custom ErrorBoundary exported for Expo Router Layout Error Handling
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const handleGoSplash = () => {
    router.replace('/');
  };

  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      {/* Bug/Error Header Icon */}
      <View style={[styles.errorIconCircle, { backgroundColor: colors.error + '15' }]}>
        <Ionicons name="bug" size={64} color={colors.error} />
      </View>
      
      <Text style={[styles.errorTitle, { color: colors.text }]}>Oops! Something Went Wrong</Text>
      <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
        The application encountered an unexpected error. Please try reloading or returning to the landing screen.
      </Text>

      {/* Error Details Card */}
      <View style={[styles.errorMessageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="alert-circle-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
        <Text style={[styles.errorMessageText, { color: colors.text }]} numberOfLines={3}>
          {error?.message || 'Unknown application crash occurred.'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.errorBtnRow}>
        <Pressable
          onPress={retry}
          style={({ pressed }) => [
            styles.errorBtn,
            {
              backgroundColor: colors.primary,
              marginRight: Spacing.sm,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.errorBtnText}>Try Again</Text>
        </Pressable>

        <Pressable
          onPress={handleGoSplash}
          style={({ pressed }) => [
            styles.errorBtn,
            {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="home-outline" size={18} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.errorBtnText, { color: colors.text, fontWeight: '700' }]}>Go to Splash</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  errorIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  errorMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  errorMessageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  errorBtn: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.round,
  },
  errorBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
