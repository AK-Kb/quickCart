import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

export default function NotFound() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const handleGoHome = () => {
    // Navigate back to the home route
    router.replace('/home');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        {/* 404 Header Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
          <Ionicons name="alert-circle" size={80} color={colors.secondary} />
        </View>

        {/* Text Details */}
        <Text style={[styles.title, { color: colors.text }]}>404 - Page Not Found</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Oops! The page you are looking for doesn&apos;t exist, is temporarily unavailable, or has been moved.
        </Text>

        {/* Button to Home */}
        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [
            styles.homeBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="home-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.homeBtnText}>Go Back Home</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
