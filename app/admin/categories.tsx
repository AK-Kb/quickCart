import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Modal
} from 'react-native';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryManagement() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // States
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals / Add / Edit state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Status banners
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const catCol = collection(db, 'categories');
      const snap = await getDocs(catCol);
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setCategories(list);
    } catch (e: any) {
      setErrorMsg('Failed to load categories: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryId('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryId(category.id);
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddEditModal(true);
  };

  const handleSaveCategory = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!categoryName.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        // Edit existing category
        const catRef = doc(db, 'categories', editingCategory.id);
        await updateDoc(catRef, { name: categoryName.trim() });
        setSuccessMsg('Category updated successfully!');
      } else {
        // Add new category
        const normalizedId = categoryId.trim() || categoryName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Check duplication
        const duplicate = categories.find(c => c.id === normalizedId);
        if (duplicate) {
          setErrorMsg('A category with this ID/name already exists.');
          setIsSaving(false);
          return;
        }

        const catRef = doc(db, 'categories', normalizedId);
        await setDoc(catRef, { name: categoryName.trim() });
        setSuccessMsg('Category created successfully!');
      }

      // Close modal and refresh list
      setTimeout(() => {
        setShowAddEditModal(false);
        fetchCategories();
      }, 1000);

    } catch (e: any) {
      setErrorMsg('Failed to save category: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = (category: any) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteDoc(doc(db, 'categories', category.id));
              setSuccessMsg('Category deleted successfully.');
              fetchCategories();
            } catch (e: any) {
              setErrorMsg('Failed to delete category: ' + e.message);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Top action bar */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Manage item categories</Text>
        </View>
        <Pressable
          onPress={handleOpenAdd}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Ionicons name="add-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Add Category</Text>
        </Pressable>
      </View>

      {/* Success/Error Banners */}
      {successMsg ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginRight: 8 }} />
          <Text style={[styles.statusText, { color: colors.success }]}>{successMsg}</Text>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.statusText, { color: colors.error }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search categories by name or ID..."
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

      {/* Categories List View */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading categories...</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No categories found.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
          {filteredCategories.map((item) => (
            <View
              key={item.id}
              style={[
                styles.categoryCard,
                { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
              ]}
            >
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.categoryId, { color: colors.textMuted }]}>ID: {item.id}</Text>
              </View>
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleOpenEdit(item)}
                  style={({ pressed }) => [
                    styles.actionIconBtn,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteCategory(item)}
                  style={({ pressed }) => [
                    styles.actionIconBtn,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add / Edit Category Dialog Modal */}
      <Modal visible={showAddEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <Pressable onPress={() => setShowAddEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {errorMsg ? (
              <Text style={[styles.modalError, { color: colors.error }]}>{errorMsg}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Category Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Health & Wellness"
                placeholderTextColor={colors.textMuted}
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>

            {!editingCategory && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Custom Category ID (Optional)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. health_wellness"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={categoryId}
                  onChangeText={setCategoryId}
                />
              </View>
            )}

            <Pressable
              onPress={handleSaveCategory}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 }
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Category</Text>
              )}
            </Pressable>
          </View>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  statusText: {
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
    fontWeight: '500',
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
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryId: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
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
  modalError: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
