import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  useColorScheme,
  Platform
} from 'react-native';
import { collection, query, where, getDocs, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Loading & State
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalDeliveries: 0,
    deliveredRevenue: 0,
    totalProducts: 0,
    outOfStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch counts using optimized getCountFromServer
      const usersCol = collection(db, 'users');
      const ordersCol = collection(db, 'orders');
      const productsCol = collection(db, 'products');

      const [usersSnap, ordersSnap, deliveriesSnap, productsSnap, outOfStockSnap] = await Promise.all([
        getCountFromServer(usersCol),
        getCountFromServer(ordersCol),
        getCountFromServer(query(ordersCol, where('status', '==', 'Delivered'))),
        getCountFromServer(productsCol),
        getCountFromServer(query(productsCol, where('availability', '==', 'Out of Stock')))
      ]);

      const totalUsers = usersSnap.data().count;
      const totalOrders = ordersSnap.data().count;
      const totalDeliveries = deliveriesSnap.data().count;
      const totalProducts = productsSnap.data().count;
      const outOfStockProducts = outOfStockSnap.data().count;

      // 2. Fetch Delivered Revenue (requires fetching documents to sum totalAmount)
      const deliveredQuery = query(ordersCol, where('status', '==', 'Delivered'));
      const deliveredSnapshot = await getDocs(deliveredQuery);
      let deliveredRevenue = 0;
      deliveredSnapshot.forEach(doc => {
        const orderData = doc.data();
        deliveredRevenue += orderData.totalAmount || 0;
      });

      // 3. Fetch Recent Orders (limit to 5)
      const recentOrdersQuery = query(ordersCol, orderBy('createdAt', 'desc'), limit(5));
      const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
      const recent: any[] = [];
      recentOrdersSnapshot.forEach(doc => {
        recent.push(doc.data());
      });

      // 4. Fetch Low Stock or Out of Stock Products (sample for display)
      // Since existing seeded products don't have stock field, we look for Out of Stock or limit check
      const lowStockQuery = query(productsCol, where('availability', '==', 'Out of Stock'), limit(5));
      const lowStockSnapshot = await getDocs(lowStockQuery);
      const lowStock: any[] = [];
      lowStockSnapshot.forEach(doc => {
        const p = doc.data();
        lowStock.push({
          id: p.id,
          name: p.name,
          stock: p.stock !== undefined ? p.stock : 0,
          price: p.price,
          category: p.category
        });
      });

      setStats({
        totalUsers,
        totalOrders,
        totalDeliveries,
        deliveredRevenue,
        totalProducts,
        outOfStockProducts
      });
      setRecentOrders(recent);
      setLowStockProducts(lowStock);

    } catch (e) {
      console.error('Error fetching dashboard statistics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return '₹' + Intl.NumberFormat('en-IN').format(amount);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading dashboard data...</Text>
      </View>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: 'people', color: '#2196F3' },
    { label: 'Total Orders', value: stats.totalOrders, icon: 'receipt', color: '#FF9800' },
    { label: 'Total Deliveries', value: stats.totalDeliveries, icon: 'checkmark-circle', color: '#4CAF50' },
    { label: 'Delivered Revenue', value: formatCurrency(stats.deliveredRevenue), icon: 'wallet', color: '#E91E63' },
    { label: 'Available Products', value: stats.totalProducts, icon: 'cube', color: '#9C27B0' },
    { label: 'Out of Stock', value: stats.outOfStockProducts, icon: 'alert-circle', color: '#F44336' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Dashboard Title & Refresh button */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Overview of quickCart operations</Text>
        </View>
        <Pressable
          onPress={fetchDashboardData}
          style={({ pressed }) => [
            styles.refreshBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 }
          ]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Grid of Stat Cards */}
      <View style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: card.color + '15' }]}>
              <Ionicons name={card.icon as any} size={24} color={card.color} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, { color: colors.text }]}>{card.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{card.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Main Grid: Recent Orders & Stock status */}
      <View style={styles.detailsGrid}>
         {/* Recent Orders List */}
        <View
          style={[
            styles.detailsBlock,
            { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
          ]}
        >
          <View style={[styles.blockHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>Recent Orders</Text>
            <Pressable onPress={() => router.push('/admin/orders' as any)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </Pressable>
          </View>
          
          {recentOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders placed yet.</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <Pressable
                key={order.orderId}
                onPress={() => router.push({ pathname: '/admin/orders' as any, params: { search: order.orderId } })}
                style={({ pressed }) => [
                  styles.orderRow,
                  { borderBottomColor: colors.border },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <View style={styles.orderLeft}>
                  <Text style={[styles.orderId, { color: colors.text }]}>{order.orderId}</Text>
                  <Text style={[styles.orderCustomer, { color: colors.textMuted }]}>
                    {order.userName} • {order.items?.length || 0} items
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={[styles.orderAmount, { color: colors.text }]}>
                    {formatCurrency(order.totalAmount)}
                  </Text>
                  <Text
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          order.status === 'Delivered'
                            ? colors.success + '15'
                            : order.status === 'Cancelled'
                            ? colors.error + '15'
                            : colors.warning + '15',
                        color:
                          order.status === 'Delivered'
                            ? colors.success
                            : order.status === 'Cancelled'
                            ? colors.error
                            : colors.warning,
                      }
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Low Stock / Out of Stock Block */}
        <View
          style={[
            styles.detailsBlock,
            { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
          ]}
        >
          <View style={[styles.blockHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.blockTitle, { color: colors.text }]}>Inventory Alert</Text>
            <Pressable onPress={() => router.push('/admin/products' as any)}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Manage</Text>
            </Pressable>
          </View>
          
          {lowStockProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.success }]}>All products in stock!</Text>
            </View>
          ) : (
            lowStockProducts.map((p) => (
              <View key={p.id} style={[styles.stockRow, { borderBottomColor: colors.border }]}>
                <View style={styles.stockLeft}>
                  <Text numberOfLines={1} style={[styles.stockName, { color: colors.text }]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.stockCategory, { color: colors.textMuted }]}>
                    {p.category}
                  </Text>
                </View>
                <View style={styles.stockRight}>
                  <Text style={[styles.stockPrice, { color: colors.text }]}>
                    {formatCurrency(p.price)}
                  </Text>
                  <Text style={[styles.stockBadge, { backgroundColor: colors.error + '15', color: colors.error }]}>
                    Out of Stock
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: Platform.OS === 'web' ? '31.5%' : '48%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  detailsBlock: {
    width: Platform.OS === 'web' ? '48.5%' : '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderCustomer: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusPill: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    textTransform: 'uppercase',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  stockLeft: {
    flex: 1,
  },
  stockName: {
    fontSize: 14,
    fontWeight: '700',
  },
  stockCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  stockBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    textTransform: 'uppercase',
  },
});
