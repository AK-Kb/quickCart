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
  Modal
} from 'react-native';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function UserManagement() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // States
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Detail Modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Status banners
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Query users collection ordered by createdAt if it exists, or just retrieve them
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setUsers(list);
    } catch (e: any) {
      setErrorMsg('Failed to load users: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = (userItem: any) => {
    setSelectedUser(userItem);
    setShowDetailModal(true);
  };

  const filteredUsers = users.filter(userItem => {
    const fullName = userItem.fullName || userItem.name || '';
    const email = userItem.email || '';
    return (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Users & Customers</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Read-only registry of quickCart users</Text>
        </View>
        <Pressable
          onPress={fetchUsers}
          style={({ pressed }) => [
            styles.refreshBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 }
          ]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Error banner */}
      {errorMsg ? (
        <View style={[styles.banner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.bannerText, { color: colors.error }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Search Container */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users by name or email..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Users list view */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading user directory...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No users found.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleOpenDetail(item)}
              style={({ pressed }) => [
                styles.userCard,
                { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light },
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.avatarBlock}>
                <View style={[styles.avatarCircle, { backgroundColor: item.role === 'admin' ? colors.secondary : colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {(item.fullName || item.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {item.fullName || item.name}
                  </Text>
                  <Text
                    style={[
                      styles.roleTag,
                      {
                        backgroundColor: item.role === 'admin' ? colors.secondaryLight : colors.primaryLight,
                        color: item.role === 'admin' ? colors.secondary : colors.primary
                      }
                    ]}
                  >
                    {item.role || 'customer'}
                  </Text>
                </View>
                <Text style={[styles.userEmail, { color: colors.textMuted }]}>{item.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* User Details Modal (Read Only) */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {selectedUser && (
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>User Profile</Text>
                <Pressable onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.profileSummary}>
                <View style={[styles.largeAvatarCircle, { backgroundColor: selectedUser.role === 'admin' ? colors.secondary : colors.primary }]}>
                  <Text style={styles.largeAvatarText}>
                    {(selectedUser.fullName || selectedUser.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {selectedUser.fullName || selectedUser.name}
                </Text>
                <Text style={[styles.profileRole, { color: colors.textMuted }]}>
                  System Role: {selectedUser.role || 'customer'}
                </Text>
              </View>

              <View style={styles.detailsBlock}>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email Address</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>{selectedUser.email}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Mobile Phone</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>
                    {selectedUser.mobile ? `+91 ${selectedUser.mobile}` : 'Not Provided'}
                  </Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Account ID (Email)</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>{selectedUser.id}</Text>
                </View>

                {selectedUser.createdAt && (
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Registered On</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => setShowDetailModal(false)}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Text style={styles.closeBtnText}>Done</Text>
              </Pressable>
            </View>
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
    marginBottom: Spacing.lg,
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  avatarBlock: {
    marginRight: Spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  roleTag: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
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
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileSummary: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  largeAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  largeAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  detailsBlock: {
    marginVertical: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
