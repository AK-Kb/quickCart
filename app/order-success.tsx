import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { CartStore } from '../constants/cart';

const formatPrice = (price: number): string => {
  return '₹' + Intl.NumberFormat('en-IN').format(price);
};

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve route params
  const orderId = (params.orderId as string) || `QC-${Date.now()}`;
  const totalAmount = parseFloat((params.totalAmount as string) || '0');
  const deliveryOption = (params.deliveryOption as string) || 'Standard';

  // Automatically clear the cart when the success screen loads
  useEffect(() => {
    CartStore.clearCart();
  }, []);

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleTrackOrder = () => {
    router.replace('/orders' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View style={styles.content}>
        
        {/* Animated Checkmark Badge */}
        <View style={[styles.badgeCircle, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle" size={88} color="#4CAF50" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Order Placed Successfully!</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Thank you for choosing QuickCart. Your delivery is being packed and prepared.
        </Text>

        {/* Invoice details card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Order Reference ID</Text>
            <Text style={[styles.value, { color: colors.text }]}>{orderId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Total Payable Amount</Text>
            <Text style={[styles.value, { color: colors.primary, fontWeight: '800' }]}>
              {formatPrice(totalAmount)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Estimated Delivery</Text>
            <Text style={[styles.value, { color: colors.secondary }]}>
              {deliveryOption === 'Express' ? 'Within 24 Hours (Express)' : '2-3 Working Days (Standard)'}
            </Text>
          </View>

          <View style={styles.deliveryStatusRow}>
            <Ionicons name="gift-outline" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.deliveryStatusText, { color: colors.text }]}>Preparing package at regional center</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnColumn}>
          <Pressable
            onPress={handleTrackOrder}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="receipt-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Track Order History</Text>
          </Pressable>

          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="home-outline" size={18} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Continue Shopping</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  badgeCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  detailsCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xxl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  deliveryStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnColumn: {
    width: '100%',
  },
  primaryBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
