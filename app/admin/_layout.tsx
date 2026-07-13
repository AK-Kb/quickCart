import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Dimensions,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { SessionStore, useSessionState } from '../../constants/cart';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = Platform.OS === 'web' || SCREEN_WIDTH > 768;

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const user = useSessionState();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Securely enforce admin-only check in layout level
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      console.log('[AdminLayout] Unauthorized access. Redirecting to login.');
      router.replace('/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleLogout = () => {
    SessionStore.setUser(null);
    router.replace('/login');
  };

  const navItems = [
    { label: 'Dashboard', route: '/admin', icon: 'grid-outline', activeIcon: 'grid' },
    { label: 'Categories', route: '/admin/categories', icon: 'folder-open-outline', activeIcon: 'folder-open' },
    { label: 'Products / Items', route: '/admin/products', icon: 'cart-outline', activeIcon: 'cart' },
    { label: 'Cities / Service Areas', route: '/admin/cities', icon: 'location-outline', activeIcon: 'location' },
    { label: 'Orders / Delivery', route: '/admin/orders', icon: 'receipt-outline', activeIcon: 'receipt' },
    { label: 'Users', route: '/admin/users', icon: 'people-outline', activeIcon: 'people' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderNavButtons = () => {
    return navItems.map((item) => {
      const isActive = pathname === item.route;
      return (
        <Pressable
          key={item.route}
          onPress={() => {
            setIsSidebarOpen(false);
            router.push(item.route as any);
          }}
          style={({ pressed }) => [
            styles.navItem,
            isActive && { backgroundColor: colors.primaryLight },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons
            name={(isActive ? item.activeIcon : item.icon) as any}
            size={20}
            color={isActive ? colors.primary : colors.icon}
            style={styles.navIcon}
          />
          <Text style={[styles.navText, { color: isActive ? colors.primary : colors.text }]}>
            {item.label}
          </Text>
        </Pressable>
      );
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Mobile Top Header */}
      {!IS_DESKTOP && (
        <View style={[styles.mobileHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={toggleSidebar} style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.mobileTitle, { color: colors.text }]}>
            quick<Text style={{ color: colors.secondary }}>Cart</Text> Admin
          </Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <View style={styles.mainContent}>
        {/* Persistent Left Sidebar for Desktop/Web, or Drawer Overlay for Mobile */}
        {(IS_DESKTOP || isSidebarOpen) && (
          <View
            style={[
              IS_DESKTOP ? styles.sidebarDesktop : styles.sidebarDrawer,
              { backgroundColor: colors.card, borderRightColor: colors.border, ...Shadows.light }
            ]}
          >
            {/* Sidebar Header */}
            <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sidebarLogoText, { color: colors.text }]}>
                quick<Text style={{ color: colors.secondary }}>Cart</Text>
              </Text>
              <Text style={[styles.roleBadge, { backgroundColor: colors.secondaryLight, color: colors.secondary }]}>
                Admin
              </Text>
              {!IS_DESKTOP && (
                <Pressable onPress={toggleSidebar} style={styles.closeBtn}>
                  <Ionicons name="close-outline" size={24} color={colors.text} />
                </Pressable>
              )}
            </View>

            {/* Sidebar Navigation Items */}
            <View style={styles.navContainer}>{renderNavButtons()}</View>

            {/* Admin Profile & Logout Block */}
            <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
              <View style={styles.adminProfile}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
                <View style={styles.adminInfo}>
                  <Text numberOfLines={1} style={[styles.adminName, { color: colors.text }]}>
                    {user.name}
                  </Text>
                  <Text numberOfLines={1} style={[styles.adminEmail, { color: colors.textMuted }]}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  { backgroundColor: colors.error + '15' },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.navIcon} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Child Screens View */}
        <View style={[styles.childContainer, { backgroundColor: colors.surface }]}>
          <Slot />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  menuBtn: {
    padding: Spacing.xs,
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarDesktop: {
    width: 250,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Spacing.md,
  },
  sidebarDrawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    height: '100%',
    borderRightWidth: 1,
    zIndex: 100,
    paddingTop: Spacing.md,
  },
  sidebarHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarLogoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  navContainer: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  navIcon: {
    marginRight: Spacing.md,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  adminProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 14,
    fontWeight: '700',
  },
  adminEmail: {
    fontSize: 11,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  childContainer: {
    flex: 1,
    height: '100%',
  },
});
