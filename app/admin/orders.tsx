import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Modal,
  Image
} from 'react-native';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

const STATUS_OPTIONS = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

export default function OrderManagement() {
  const params = useLocalSearchParams();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // States
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState((params.search as string) || '');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Status banners
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setOrders(list);
    } catch (e: any) {
      setErrorMsg('Failed to load orders: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setErrorMsg('');
    setSuccessMsg('');
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Update orders collection status
      const orderRef = doc(db, 'orders', selectedOrder.orderId);
      await updateDoc(orderRef, { status: newStatus });

      // 2. Update corresponding tracking doc in tracking collection
      const trackingRef = doc(db, 'tracking', selectedOrder.orderId);
      await updateDoc(trackingRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setSuccessMsg(`Order status updated to "${newStatus}"!`);
      
      // Update local state for UX responsiveness
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      setOrders(prev => prev.map(o => o.orderId === selectedOrder.orderId ? { ...o, status: newStatus } : o));

      setTimeout(() => {
        setSuccessMsg('');
      }, 2000);

    } catch (e: any) {
      setErrorMsg('Failed to update status: ' + e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return '₹' + Intl.NumberFormat('en-IN').format(amount);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.userName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Orders & Deliveries</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Monitor and update customer orders</Text>
        </View>
        <Pressable
          onPress={fetchOrders}
          style={({ pressed }) => [
            styles.refreshBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 }
          ]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by Order ID or customer name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Status:</Text>
          <Pressable
            onPress={() => setFilterStatus('All')}
            style={[styles.filterPill, filterStatus === 'All' ? { backgroundColor: colors.primary } : { borderColor: colors.border }]}
          >
            <Text style={[styles.filterPillText, filterStatus === 'All' ? { color: '#fff' } : { color: colors.text }]}>All</Text>
          </Pressable>
          {STATUS_OPTIONS.map(status => (
            <Pressable
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[styles.filterPill, filterStatus === status ? { backgroundColor: colors.primary } : { borderColor: colors.border }]}
            >
              <Text style={[styles.filterPillText, filterStatus === status ? { color: '#fff' } : { color: colors.text }]}>{status}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Orders List View */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders found.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredOrders.map((order) => (
            <Pressable
              key={order.orderId}
              onPress={() => handleOpenDetail(order)}
              style={({ pressed }) => [
                styles.orderCard,
                { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light },
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.orderId, { color: colors.text }]}>{order.orderId}</Text>
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

              <View style={styles.cardBody}>
                <Text style={[styles.customerName, { color: colors.text }]}>{order.userName}</Text>
                <Text style={[styles.orderDate, { color: colors.textMuted }]}>
                  {new Date(order.createdAt).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.itemSummary, { color: colors.textMuted }]}>
                  {order.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                </Text>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.paymentMethod, { color: colors.textMuted }]}>
                  Payment: {order.paymentMethod}
                </Text>
                <Text style={[styles.totalAmount, { color: colors.primary }]}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Order Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {selectedOrder && (
            <ScrollView contentContainerStyle={styles.modalScroll} style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Order Details</Text>
                <Pressable onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {successMsg ? (
                <View style={[styles.modalBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                  <Text style={[styles.modalBannerText, { color: colors.success }]}>{successMsg}</Text>
                </View>
              ) : null}

              {errorMsg ? (
                <View style={[styles.modalBanner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                  <Text style={[styles.modalBannerText, { color: colors.error }]}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Order Info */}
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Order ID: {selectedOrder.orderId}</Text>
                <Text style={[styles.metaText, { color: colors.text }]}>
                  Placed on: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </Text>
                <View style={styles.statusPickerContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Update Status:</Text>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.statusButtons}>
                      {STATUS_OPTIONS.map(opt => (
                        <Pressable
                          key={opt}
                          onPress={() => handleUpdateStatus(opt)}
                          style={[
                            styles.statusBtn,
                            selectedOrder.status === opt ? { backgroundColor: colors.primary } : { borderColor: colors.border }
                          ]}
                        >
                          <Text style={[styles.statusBtnText, selectedOrder.status === opt ? { color: '#fff' } : { color: colors.text }]}>
                            {opt}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Customer Details */}
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Customer Details</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>Name: {selectedOrder.userName}</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>Email: {selectedOrder.userEmail}</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>Mobile: +91 {selectedOrder.userMobile}</Text>
              </View>

              {/* Delivery Address */}
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Delivery Address</Text>
                <Text style={[styles.infoText, { color: colors.text, lineHeight: 20 }]}>{selectedOrder.address}</Text>
              </View>

              {/* Items List */}
              <View style={[styles.section, { borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Ordered Items</Text>
                {selectedOrder.items?.map((item: any, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <Image source={{ uri: item.image }} style={styles.itemThumb} />
                    <View style={styles.itemMeta}>
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.itemQtyPrice, { color: colors.textMuted }]}>
                        {formatCurrency(item.price)} x {item.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.itemSubtotal, { color: colors.text }]}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Invoice breakdown */}
              <View style={styles.invoiceBlock}>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Payment Summary</Text>
                <View style={styles.invoiceRow}>
                  <Text style={{ color: colors.textMuted }}>Subtotal</Text>
                  <Text style={{ color: colors.text }}>{formatCurrency(selectedOrder.subtotal || 0)}</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={{ color: colors.textMuted }}>Delivery Charge</Text>
                  <Text style={{ color: colors.text }}>{formatCurrency(selectedOrder.deliveryCharge || 0)}</Text>
                </View>
                {selectedOrder.discount > 0 && (
                  <View style={styles.invoiceRow}>
                    <Text style={{ color: colors.success }}>Discount Applied</Text>
                    <Text style={{ color: colors.success }}>-{formatCurrency(selectedOrder.discount)}</Text>
                  </View>
                )}
                <View style={[styles.invoiceRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 4 }]}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>Grand Total</Text>
                  <Text style={{ fontWeight: '800', color: colors.primary }}>{formatCurrency(selectedOrder.totalAmount || 0)}</Text>
                </View>
                <Text style={[styles.paymentMethodLabel, { color: colors.textMuted }]}>
                  Payment Method: {selectedOrder.paymentMethod}
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
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
  searchSection: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'center',
    marginRight: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusPill: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: Spacing.sm,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  itemSummary: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  paymentMethod: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '90%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    elevation: 10,
  },
  modalScroll: {
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  modalBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPickerContainer: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemQtyPrice: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceBlock: {
    backgroundColor: '#f9fafb',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: Spacing.md,
  },
});
