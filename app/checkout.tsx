import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { CartStore, useCartItems, SessionStore } from '../constants/cart';

const formatPrice = (price: number): string => {
  return '₹' + Intl.NumberFormat('en-IN').format(price);
};

type DeliveryOption = 'Standard' | 'Express';
type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'COD';

export default function CheckoutScreen() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve current user and cart items
  const currentUser = SessionStore.getUser() || { name: 'QuickCart Customer', mobile: '9876543210' };
  const cartItems = useCartItems();
  const discountPercent = CartStore.getDiscountPercent();

  // Address and options states
  const [address, setAddress] = useState('Flat 402, Shivam Heights, Sector 15, Vashi, Navi Mumbai, Maharashtra - 400703');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('Standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  // Loading/submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const baseDelivery = subtotal >= 999 || subtotal === 0 ? 0 : 49;
  const surcharge = deliveryOption === 'Express' ? 99 : 0;
  const deliveryCharge = baseDelivery + surcharge;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const finalAmount = subtotal + deliveryCharge - discountAmount;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter a valid delivery address.');
      return;
    }

    setIsSubmitting(true);
    const orderId = `QC-${Date.now()}`;

    try {
      // Create Firestore order structure
      const orderRef = doc(collection(db, 'orders'), orderId);
      const orderDoc = {
        orderId,
        userMobile: currentUser.mobile,
        userName: currentUser.name,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          image: item.image,
        })),
        subtotal,
        deliveryCharge,
        deliveryOption,
        deliverySurcharge: surcharge,
        discount: discountAmount,
        totalAmount: finalAmount,
        address: address.trim(),
        paymentMethod,
        status: 'Order Placed',
        createdAt: new Date().toISOString(),
      };

      // Write to Firestore database
      await setDoc(orderRef, orderDoc);

      router.replace({
        pathname: '/order-success' as any,
        params: { orderId, totalAmount: finalAmount.toString(), deliveryOption },
      });
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Checkout Failed', 'We encountered an error saving your order to Firestore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Delivery Address Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
            <Pressable onPress={() => setIsEditingAddress(!isEditingAddress)}>
              <Text style={[styles.editLink, { color: colors.primary }]}>
                {isEditingAddress ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="location-outline" size={20} color={colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                {isEditingAddress ? (
                  <TextInput
                    style={[styles.addressInput, { color: colors.text, borderColor: colors.border }]}
                    multiline
                    numberOfLines={3}
                    value={address}
                    onChangeText={setAddress}
                  />
                ) : (
                  <Text style={[styles.addressText, { color: colors.text }]}>{address}</Text>
                )}
                <Text style={[styles.recipientText, { color: colors.textMuted }]}>
                  Recipient: {currentUser.name} | +91 {currentUser.mobile}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Option Selector */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Option</Text>
          
          <View style={styles.optionsRow}>
            {/* Standard option */}
            <Pressable
              onPress={() => setDeliveryOption('Standard')}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: deliveryOption === 'Standard' ? colors.primary : colors.border,
                  ...Shadows.light,
                },
              ]}
            >
              <View style={styles.optionHeader}>
                <Ionicons
                  name={deliveryOption === 'Standard' ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={deliveryOption === 'Standard' ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.optionTitle, { color: colors.text }]}>Standard</Text>
              </View>
              <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                Delivers in 2-3 Days. {baseDelivery === 0 ? 'FREE' : formatPrice(49)}
              </Text>
            </Pressable>

            {/* Express option */}
            <Pressable
              onPress={() => setDeliveryOption('Express')}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: deliveryOption === 'Express' ? colors.primary : colors.border,
                  ...Shadows.light,
                },
              ]}
            >
              <View style={styles.optionHeader}>
                <Ionicons
                  name={deliveryOption === 'Express' ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={deliveryOption === 'Express' ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.optionTitle, { color: colors.text }]}>Express</Text>
              </View>
              <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                Next Day delivery. +{formatPrice(99)} Surcharge
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Payment Method</Text>
          
          <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* UPI Option */}
            <Pressable onPress={() => setPaymentMethod('UPI')} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flash-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>UPI (GPay / PhonePe / Paytm)</Text>
              </View>
              <Ionicons
                name={paymentMethod === 'UPI' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={paymentMethod === 'UPI' ? colors.primary : colors.textMuted}
              />
            </Pressable>

            {/* Card Option */}
            <Pressable onPress={() => setPaymentMethod('Card')} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Credit / Debit / ATM Card</Text>
              </View>
              <Ionicons
                name={paymentMethod === 'Card' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={paymentMethod === 'Card' ? colors.primary : colors.textMuted}
              />
            </Pressable>

            {/* NetBanking */}
            <Pressable onPress={() => setPaymentMethod('NetBanking')} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="business-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Net Banking (Indian Banks)</Text>
              </View>
              <Ionicons
                name={paymentMethod === 'NetBanking' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={paymentMethod === 'NetBanking' ? colors.primary : colors.textMuted}
              />
            </Pressable>

            {/* Cash On Delivery */}
            <Pressable onPress={() => setPaymentMethod('COD')} style={styles.settingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cash-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Cash on Delivery (COD)</Text>
              </View>
              <Ionicons
                name={paymentMethod === 'COD' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={paymentMethod === 'COD' ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Order Items Review List */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Review Order Items</Text>
          
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
            {cartItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  {
                    borderBottomWidth: index === cartItems.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text numberOfLines={1} style={[styles.itemNameText, { color: colors.text }]}>
                  {item.name} <Text style={{ color: colors.textMuted, fontWeight: '600' }}>x{item.quantity}</Text>
                </Text>
                <Text style={[styles.itemPriceText, { color: colors.text }]}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Invoice Summary Card */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invoice Breakdown</Text>
          
          <View style={[styles.billCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.textMuted }]}>Items Subtotal</Text>
              <Text style={[styles.billValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.textMuted }]}>Delivery Charge</Text>
              <Text style={[styles.billValue, { color: colors.text }]}>{formatPrice(baseDelivery)}</Text>
            </View>

            {surcharge > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: colors.textMuted }]}>Express Delivery Surcharge</Text>
                <Text style={[styles.billValue, { color: colors.text }]}>+{formatPrice(surcharge)}</Text>
              </View>
            )}

            {discountAmount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: '#4CAF50' }]}>Coupon Discount Applied</Text>
                <Text style={[styles.billValue, { color: '#4CAF50' }]}>-{formatPrice(discountAmount)}</Text>
              </View>
            )}

            <View style={[styles.divider, { borderBottomColor: colors.border }]} />

            <View style={[styles.billRow, { marginTop: 4 }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Grand Payable Total</Text>
              <Text style={[styles.totalPrice, { color: colors.primary }]}>{formatPrice(finalAmount)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.checkoutBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.checkoutTotalLabel, { color: colors.textMuted }]}>PAYABLE AMOUNT</Text>
          <Text style={[styles.checkoutTotalPrice, { color: colors.text }]}>{formatPrice(finalAmount)}</Text>
        </View>
        <Pressable
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.placeOrderBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isSubmitting ? 0.9 : 1,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
          ) : (
            <Ionicons name="card-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.placeOrderBtnText}>
            {isSubmitting ? 'Processing...' : 'Place Order'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  addressInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    height: 60,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  recipientText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 0.48,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  optionDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  itemNameText: {
    flex: 0.75,
    fontSize: 13,
    fontWeight: '600',
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  billCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  checkoutTotalLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkoutTotalPrice: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
