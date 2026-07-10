import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CartStore, SessionStore, useRegionState } from '../../constants/cart';

export default function ProfileTab() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve user session & active region state
  const user = SessionStore.getUser() || { name: 'QuickCart Customer', email: 'customer@quickcart.com', mobile: '9876543210' };
  const activeRegion = useRegionState();

  const handleLogout = () => {
    // Clear session details
    SessionStore.setUser(null);
    CartStore.clearCart();
    // Redirect to login screen
    router.replace('/login');
  };

  const handleChangeRegion = () => {
    router.replace('/permissions');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Banner Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userMobile}>{user.email}</Text>
          {user.mobile ? <Text style={styles.userMobile}>+91 {user.mobile}</Text> : null}
        </View>

        {/* Selected Region info card */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Shopping Region Settings</Text>
          <View style={[styles.regionCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                <Text style={[styles.regionLabel, { color: colors.textMuted }]}>Current Delivery State</Text>
                <Text style={[styles.regionValue, { color: colors.text }]}>{activeRegion.name}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleChangeRegion}
              style={({ pressed }) => [
                styles.changeBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Change</Text>
            </Pressable>
          </View>
        </View>

        {/* App Settings Items */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Preferences</Text>
          
          <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Notification setting */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="notifications-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
              </View>
              <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: '700' }}>Enabled</Text>
            </View>

            {/* Security */}
            <Pressable style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            {/* Support */}
            <Pressable style={styles.settingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="headset-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Help & Customer Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Log Out button */}
        <View style={styles.logoutWrapper}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                backgroundColor: colors.secondary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Log Out Account</Text>
          </Pressable>
          
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>quickCart App v1.0.0 (Production Setup)</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0B6A9C',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  userMobile: {
    fontSize: 13,
    color: '#E0F2FE',
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  regionValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  changeBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingsList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutWrapper: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.round,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  appVersion: {
    fontSize: 11,
    marginTop: Spacing.md,
  },
});
