import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { SessionStore } from '../../constants/cart';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderDisplay {
  id: string;
  date: string;
  status: string;
  items: string[];
  total: number;
  paymentMethod: string;
  isMock?: boolean;
}

const MOCK_ORDERS: OrderDisplay[] = [
  {
    id: 'QC-749219',
    date: 'July 03, 2026, 02:40 PM',
    status: 'In Transit',
    items: ['SuperBass Wireless Headphones x1', 'Organic Raw Forest Honey x1'],
    total: 5798,
    paymentMethod: 'UPI (GPay / PhonePe / Paytm)',
    isMock: true,
  },
  {
    id: 'QC-682910',
    date: 'July 01, 2026, 11:20 AM',
    status: 'Delivered',
    items: ['Classic Cotton Polo T-Shirt x2'],
    total: 2998,
    paymentMethod: 'Credit/Debit Card',
    isMock: true,
  },
  {
    id: 'QC-592817',
    date: 'June 28, 2026, 06:15 PM',
    status: 'Delivered',
    items: ['Traditional Basmati Rice (1kg) x4', 'Assorted Indian Spices Gift Box x1'],
    total: 2495,
    paymentMethod: 'Cash on Delivery',
    isMock: true,
  }
];

const formatPrice = (price: number): string => {
  return '₹' + Intl.NumberFormat('en-IN').format(price);
};

export default function OrdersTab() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve user session & active region state
  const currentUser = SessionStore.getUser() || { name: 'QuickCart Customer', email: 'customer@quickcart.com', mobile: '9876543210' };
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders from Firestore whenever tab gains focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const fetchFirestoreOrders = async () => {
        setIsLoading(true);
        try {
          const ordersCol = collection(db, 'orders');
          const q = currentUser.email 
            ? query(ordersCol, where('userEmail', '==', currentUser.email.toLowerCase()))
            : query(ordersCol, where('userMobile', '==', currentUser.mobile));
          const querySnapshot = await getDocs(q);
          const list: OrderDisplay[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: data.orderId,
              date: new Date(data.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
              status: data.status,
              items: data.items.map((it: OrderItem) => `${it.name} x${it.quantity}`),
              total: data.totalAmount,
              paymentMethod: data.paymentMethod === 'UPI' ? 'UPI (GPay / PhonePe / Paytm)' :
                             data.paymentMethod === 'Card' ? 'Credit/Debit Card' :
                             data.paymentMethod === 'NetBanking' ? 'Net Banking' : 'Cash on Delivery',
              isMock: false,
            });
          });

          // Sort by date/id descending (newest first)
          list.sort((a, b) => b.id.localeCompare(a.id));

          if (isMounted) {
            setOrders(list);
          }
        } catch (error) {
          console.error('Error loading Firestore orders:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      fetchFirestoreOrders();

      return () => {
        isMounted = false;
      };
    }, [currentUser.mobile, currentUser.email])
  );

  const displayedOrders = orders.length > 0 ? orders : MOCK_ORDERS;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Orders</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          {orders.length > 0 ? 'Your active purchases and history' : 'Sample purchases and history'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your orders...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayedOrders.map(order => {
            const isTransit = order.status === 'In Transit' || order.status === 'Order Placed';
            const isDelivered = order.status === 'Delivered';
            
            let statusColor = '#9E9E9E';
            let statusBg = '#F5F5F5';
            
            if (isTransit) {
              statusColor = colors.secondary;
              statusBg = colors.secondaryLight;
            } else if (isDelivered) {
              statusColor = '#4CAF50';
              statusBg = '#E8F5E9';
            } else if (order.status === 'Cancelled') {
              statusColor = colors.error;
              statusBg = colors.error + '15';
            }

            return (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...Shadows.light,
                  },
                ]}
              >
                {/* Order Card Header */}
                <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                  <View>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      ID: {order.id} {order.isMock && <Text style={{ fontSize: 10, color: colors.textMuted }}>(Sample)</Text>}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textMuted }]}>{order.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{order.status}</Text>
                  </View>
                </View>

                {/* Order Card Body */}
                <View style={styles.cardBody}>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ITEMS PURCHASED</Text>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.itemName, { color: colors.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Order Card Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                  <View>
                    <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total Paid</Text>
                    <Text style={[styles.totalPrice, { color: colors.primary }]}>{formatPrice(order.total)}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Ionicons name="card-outline" size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.paymentMethodText, { color: colors.textMuted }]}>{order.paymentMethod}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.xs,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: Spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
