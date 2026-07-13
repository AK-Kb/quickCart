import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Platform
} from 'react-native';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SessionStore } from '../constants/cart';
import { StatusBar } from 'expo-status-bar';

export default function AddressListScreen() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const currentUser = SessionStore.getUser();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAddresses = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const q = query(
        collection(db, 'addresses'),
        where('userEmail', '==', currentUser?.email.toLowerCase())
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      // Sort: default address first, then by createdAt desc
      list.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setAddresses(list);
    } catch (e: any) {
      console.error('Error fetching addresses:', e);
      setErrorMsg('Failed to load delivery addresses: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Re-fetch addresses every time screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser && currentUser.email) {
        fetchAddresses();
      }
    }, [currentUser, fetchAddresses])
  );

  const handleSetDefault = async (selectedAddress: any) => {
    if (selectedAddress.isDefault) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Remove default flag from all other addresses of this user
      addresses.forEach(addr => {
        const ref = doc(db, 'addresses', addr.id);
        if (addr.id === selectedAddress.id) {
          batch.update(ref, { isDefault: true, updatedAt: new Date().toISOString() });
        } else if (addr.isDefault) {
          batch.update(ref, { isDefault: false, updatedAt: new Date().toISOString() });
        }
      });

      await batch.commit();
      
      // Update local state and sort
      setAddresses(prev => {
        const updated = prev.map(addr => ({
          ...addr,
          isDefault: addr.id === selectedAddress.id
        }));
        return updated.sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));
      });

      Alert.alert('Success', 'Default delivery address updated.');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update default address: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = (selectedAddress: any) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this delivery address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteDoc(doc(db, 'addresses', selectedAddress.id));
              
              // If deleted was default and we have other addresses, make the first one default
              const remaining = addresses.filter(a => a.id !== selectedAddress.id);
              if (selectedAddress.isDefault && remaining.length > 0) {
                await updateDoc(doc(db, 'addresses', remaining[0].id), {
                  isDefault: true,
                  updatedAt: new Date().toISOString()
                });
              }

              fetchAddresses();
            } catch (e: any) {
              Alert.alert('Error', 'Failed to delete address: ' + e.message);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Error banner */}
      {errorMsg ? (
        <View style={[styles.banner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.bannerText, { color: colors.error }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Addresses List */}
      {isLoading && addresses.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading delivery addresses...</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="location-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No saved addresses found.</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Add a delivery address to make checkout faster!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          {addresses.map((item) => (
            <View
              key={item.id}
              style={[
                styles.addressCard,
                { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name={
                      item.label === 'Home'
                        ? 'home-outline'
                        : item.label === 'Work'
                        ? 'briefcase-outline'
                        : 'location-outline'
                    }
                    size={18}
                    color={colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.labelText, { color: colors.text }]}>{item.label || 'Other'}</Text>
                </View>
                {item.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Default</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.recipientName, { color: colors.text }]}>{item.recipientName}</Text>
                <Text style={[styles.phoneText, { color: colors.textMuted }]}>Phone: +91 {item.phoneNumber}</Text>
                <Text style={[styles.addressText, { color: colors.text }]}>{item.addressText}</Text>
                {item.notes ? (
                  <View style={styles.notesBlock}>
                    <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Delivery Instruction:</Text>
                    <Text style={[styles.notesText, { color: colors.text }]}>{item.notes}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                {!item.isDefault && (
                  <Pressable
                    onPress={() => handleSetDefault(item)}
                    style={({ pressed }) => [styles.actionTextBtn, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set as Default</Text>
                  </Pressable>
                )}
                
                <View style={{ flex: 1 }} />
                
                <Pressable
                  onPress={() => router.push({ pathname: '/edit-address' as any, params: { id: item.id } })}
                  style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                </Pressable>
                
                <Pressable
                  onPress={() => handleDeleteAddress(item)}
                  style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.7 }, { marginLeft: Spacing.md }]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom Add button */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => router.push('/add-address' as any)}
          style={({ pressed }) => [
            styles.addAddressBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 }
          ]}
        >
          <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addAddressBtnText}>Add New Address</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'ios' ? 0 : 30,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    margin: Spacing.lg,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  listScroll: {
    flex: 1,
    padding: Spacing.lg,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: Spacing.md,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  notesBlock: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionTextBtn: {
    paddingVertical: 4,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.round,
  },
  addAddressBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
