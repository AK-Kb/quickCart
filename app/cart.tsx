import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useColorScheme,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { CartStore, useCartItems } from '../constants/cart';

const formatPrice = (price: number): string => {
  return '₹' + Intl.NumberFormat('en-IN').format(price);
};

export default function CartScreen() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve reactive cart items
  const cartItems = useCartItems();

  // Coupon promo state
  const [couponCode, setCouponCode] = useState(CartStore.getDiscountPercent() > 0 ? 'QUICKSTART20' : '');
  const [discountPercent, setDiscountPercent] = useState(CartStore.getDiscountPercent());
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(CartStore.getDiscountPercent() > 0 ? 'Coupon applied! 20% discount added.' : '');

  // Bill calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Delivery charges: Free delivery above ₹999, else ₹49
  const deliveryCharge = subtotal >= 999 || subtotal === 0 ? 0 : 49;
  
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const finalAmount = subtotal + deliveryCharge - discountAmount;

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    if (couponCode.trim().toUpperCase() === 'QUICKSTART20') {
      setDiscountPercent(20);
      CartStore.setDiscountPercent(20);
      setCouponSuccess('Coupon applied! 20% discount added.');
    } else {
      setDiscountPercent(0);
      CartStore.setDiscountPercent(0);
      setCouponError('Invalid coupon code. Try QUICKSTART20.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
    CartStore.setDiscountPercent(0);
    setCouponSuccess('');
    setCouponError('');
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    CartStore.setDiscountPercent(discountPercent);
    router.push('/checkout');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Cart is Empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Explore our state-wise products and add items to your cart.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.startShoppingBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.startShoppingBtnText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        /* Cart List and Details Scroll */
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Cart Items List */}
            <View style={styles.listSection}>
              {cartItems.map(item => (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      ...Shadows.light,
                    },
                  ]}
                >
                  <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                  
                  <View style={styles.itemInfo}>
                    <Text numberOfLines={1} style={[styles.itemName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemCategory, { color: colors.textMuted }]}>
                      {item.category}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>

                  {/* Quantity Actions */}
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() => CartStore.removeItem(item.id)}
                      style={styles.trashBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </Pressable>

                    <View style={[styles.quantityControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Pressable
                        onPress={() => CartStore.decrementQuantity(item.id)}
                        style={styles.adjustBtn}
                      >
                        <Ionicons name="remove" size={14} color={colors.text} />
                      </Pressable>
                      <Text style={[styles.quantityText, { color: colors.text }]}>
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => CartStore.incrementQuantity(item.id)}
                        style={styles.adjustBtn}
                      >
                        <Ionicons name="add" size={14} color={colors.text} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Promos Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Apply Promo Coupon</Text>
              
              <View style={styles.couponRow}>
                <TextInput
                  style={[
                    styles.couponInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter Coupon (e.g. QUICKSTART20)"
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                  editable={discountPercent === 0}
                />
                {discountPercent > 0 ? (
                  <Pressable
                    onPress={handleRemoveCoupon}
                    style={({ pressed }) => [
                      styles.couponBtn,
                      {
                        backgroundColor: colors.error + '15',
                        borderColor: colors.error,
                        borderWidth: 1,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.couponBtnText, { color: colors.error }]}>Remove</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleApplyCoupon}
                    style={({ pressed }) => [
                      styles.couponBtn,
                      {
                        backgroundColor: colors.primary,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.couponBtnText, { color: '#fff' }]}>Apply</Text>
                  </Pressable>
                )}
              </View>
              {couponError ? (
                <Text style={[styles.couponErrorText, { color: colors.error }]}>{couponError}</Text>
              ) : null}
              {couponSuccess ? (
                <Text style={styles.couponSuccessText}>{couponSuccess}</Text>
              ) : null}
            </View>

            {/* Bill Details Summary Card */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Invoice</Text>
              
              <View style={[styles.billCard, { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }]}>
                {/* Subtotal */}
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textMuted }]}>Items Subtotal</Text>
                  <Text style={[styles.billValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
                </View>

                {/* Delivery */}
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textMuted }]}>Delivery Charge</Text>
                  <Text style={[styles.billValue, { color: deliveryCharge === 0 ? '#4CAF50' : colors.text }]}>
                    {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                  </Text>
                </View>
                {subtotal < 999 && (
                  <Text style={[styles.deliveryTip, { color: colors.secondary }]}>
                    💡 Add {formatPrice(999 - subtotal)} more for FREE Delivery!
                  </Text>
                )}

                {/* Discount */}
                {discountAmount > 0 ? (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: '#4CAF50' }]}>Promo Discount (20%)</Text>
                    <Text style={[styles.billValue, { color: '#4CAF50' }]}>-{formatPrice(discountAmount)}</Text>
                  </View>
                ) : null}

                {/* Divider Line */}
                <View style={[styles.divider, { borderBottomColor: colors.border }]} />

                {/* Total amount */}
                <View style={[styles.billRow, { marginTop: 4 }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount Payable</Text>
                  <Text style={[styles.totalPrice, { color: colors.primary }]}>{formatPrice(finalAmount)}</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Place Order Checkout sticky footer bar */}
          <View style={[styles.checkoutBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View>
              <Text style={[styles.checkoutTotalLabel, { color: colors.textMuted }]}>GRAND TOTAL</Text>
              <Text style={[styles.checkoutTotalPrice, { color: colors.text }]}>{formatPrice(finalAmount)}</Text>
            </View>
            <Pressable
              onPress={handlePlaceOrder}
              style={({ pressed }) => [
                styles.placeOrderBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.placeOrderBtnText}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        </View>
      )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 80,
  },
  emptyIconBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  startShoppingBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.round,
  },
  startShoppingBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  listSection: {
    marginBottom: Spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 64,
  },
  trashBtn: {
    padding: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 28,
  },
  adjustBtn: {
    width: 26,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
    textAlign: 'center',
    minWidth: 20,
  },
  sectionContainer: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  couponBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  couponBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  couponErrorText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  couponSuccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
    marginLeft: 2,
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
  deliveryTip: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
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
