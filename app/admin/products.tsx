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
  Modal,
  Image
} from 'react-native';
import { collection, query, limit, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// A sample map of Indian States to select from
const STATES_LIST = [
  { id: 'delhi', name: 'Delhi' },
  { id: 'maharashtra', name: 'Maharashtra' },
  { id: 'karnataka', name: 'Karnataka' },
  { id: 'gujarat', name: 'Gujarat' },
  { id: 'tamil_nadu', name: 'Tamil Nadu' },
];

const CITIES_BY_STATE: Record<string, string[]> = {
  delhi: ['New Delhi', 'Saket', 'Dwarka', 'Rohini', 'Connaught Place'],
  maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Navi Mumbai'],
  karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi'],
  gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  tamil_nadu: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
};

export default function ProductManagement() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add / Edit Modal state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [availability, setAvailability] = useState('In Stock');
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');

  // Status banners
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCategories(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Limit to 60 products initially to ensure smooth rendering
      let q = query(collection(db, 'products'), limit(60));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(docSnap => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setProducts(list);
    } catch (e: any) {
      setErrorMsg('Failed to load products: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60');
    setPrice('');
    setStock('10');
    setAvailability('In Stock');
    setStateId('delhi');
    setCity('New Delhi');
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setName(p.name || p.title);
    setCategoryId(p.categoryId || '');
    setDescription(p.description || '');
    setImage(p.image || '');
    setPrice(String(p.price || ''));
    setStock(String(p.stock !== undefined ? p.stock : (p.availability === 'Out of Stock' ? '0' : '15')));
    setAvailability(p.availability || 'In Stock');
    setStateId(p.stateId || 'delhi');
    setCity(p.city || '');
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddEditModal(true);
  };

  const handleSaveProduct = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!name.trim()) return setErrorMsg('Product Name is required.');
    if (!categoryId) return setErrorMsg('Category is required.');
    if (!description.trim()) return setErrorMsg('Description is required.');
    if (!image.trim()) return setErrorMsg('Image URL is required.');
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) return setErrorMsg('Price must be a valid positive number.');
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0) return setErrorMsg('Stock must be a non-negative integer.');
    if (!stateId) return setErrorMsg('State / Region is required.');
    if (!city.trim()) return setErrorMsg('Service City is required.');

    setIsSaving(true);
    try {
      const selectedCategoryName = categories.find(c => c.id === categoryId)?.name || 'Unknown';
      const selectedStateName = STATES_LIST.find(s => s.id === stateId)?.name || 'Unknown';
      
      const numPrice = Number(price);
      const numStock = Number(stock);
      const finalAvailability = numStock === 0 ? 'Out of Stock' : availability;

      const productPayload = {
        name: name.trim(),
        title: name.trim(),
        categoryId,
        category: selectedCategoryName,
        categoryName: selectedCategoryName,
        description: description.trim(),
        image: image.trim(),
        price: numPrice,
        stock: numStock,
        availability: finalAvailability,
        status: finalAvailability,
        stateId,
        state: selectedStateName,
        stateName: selectedStateName,
        city: city.trim(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        // Edit
        const prodRef = doc(db, 'products', editingProduct.id);
        await updateDoc(prodRef, productPayload);
        setSuccessMsg('Product updated successfully!');
      } else {
        // Add
        const newId = `product_${Date.now()}`;
        const prodRef = doc(db, 'products', newId);
        await setDoc(prodRef, {
          ...productPayload,
          id: newId,
          rating: 4.5, // default initial rating
          createdAt: new Date().toISOString()
        });
        setSuccessMsg('Product created successfully!');
      }

      setTimeout(() => {
        setShowAddEditModal(false);
        fetchProducts();
      }, 1000);

    } catch (e: any) {
      setErrorMsg('Failed to save product: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = (p: any) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${p.name || p.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteDoc(doc(db, 'products', p.id));
              setSuccessMsg('Product deleted successfully.');
              fetchProducts();
            } catch (e: any) {
              setErrorMsg('Failed to delete product: ' + e.message);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Products & Items</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Inventory Catalog Management</Text>
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
          <Text style={styles.addBtnText}>Add Product</Text>
        </Pressable>
      </View>

      {/* Success/Error banner */}
      {successMsg ? (
        <View style={[styles.banner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginRight: 8 }} />
          <Text style={[styles.bannerText, { color: colors.success }]}>{successMsg}</Text>
        </View>
      ) : null}

      {errorMsg ? (
        <View style={[styles.banner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.bannerText, { color: colors.error }]}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Search & Filters */}
      <View style={styles.filterSection}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {/* Category Filter */}
          <Text style={[styles.filterLabel, { color: colors.text }]}>Category:</Text>
          <Pressable
            onPress={() => setFilterCategory('All')}
            style={[styles.filterPill, filterCategory === 'All' ? { backgroundColor: colors.primary } : { borderColor: colors.border }]}
          >
            <Text style={[styles.filterPillText, filterCategory === 'All' ? { color: '#fff' } : { color: colors.text }]}>All</Text>
          </Pressable>
          {categories.map(c => (
            <Pressable
              key={c.id}
              onPress={() => setFilterCategory(c.id)}
              style={[styles.filterPill, filterCategory === c.id ? { backgroundColor: colors.primary } : { borderColor: colors.border }]}
            >
              <Text style={[styles.filterPillText, filterCategory === c.id ? { color: '#fff' } : { color: colors.text }]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Products list view */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading inventory...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No items found matching the filter.</Text>
        </View>
      ) : (
        <ScrollView style={styles.productsScroll} showsVerticalScrollIndicator={false}>
          {filteredProducts.map((p) => {
            const displayStock = p.stock !== undefined ? p.stock : (p.availability === 'Out of Stock' ? 0 : 15);
            return (
              <View
                key={p.id}
                style={[
                  styles.productCard,
                  { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
                ]}
              >
                <Image source={{ uri: p.image }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text numberOfLines={2} style={[styles.productName, { color: colors.text }]}>{p.name}</Text>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>₹{p.price.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                    Category: {p.category} | City: {p.city} ({p.state})
                  </Text>
                  <View style={styles.stockRow}>
                    <Text style={[styles.stockLabel, { color: displayStock < 5 ? colors.error : colors.success }]}>
                      Stock: {displayStock} pcs ({displayStock === 0 ? 'Out of Stock' : 'In Stock'})
                    </Text>
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => handleOpenEdit(p)} style={[styles.actionBtn, { borderColor: colors.border }]}>
                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteProduct(p)} style={[styles.actionBtn, { borderColor: colors.border }]}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add / Edit Product Modal */}
      <Modal visible={showAddEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <Pressable onPress={() => setShowAddEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {errorMsg ? (
              <Text style={[styles.modalError, { color: colors.error }]}>{errorMsg}</Text>
            ) : null}

            {/* Fields */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Product Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter product title"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
              <View style={[styles.selectBox, { borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map(c => (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[styles.selectOption, categoryId === c.id ? { backgroundColor: colors.primaryLight } : null]}
                    >
                      <Text style={[styles.selectOptionText, { color: categoryId === c.id ? colors.primary : colors.text }]}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                multiline
                numberOfLines={3}
                style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
                placeholder="Product descriptive content..."
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Image URL</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={image}
                onChangeText={setImage}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Price (₹)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[styles.inputGroup, { width: '48%' }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Stock Qty</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>State / Region</Text>
              <View style={[styles.selectBox, { borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {STATES_LIST.map(s => (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        setStateId(s.id);
                        setCity(CITIES_BY_STATE[s.id][0]);
                      }}
                      style={[styles.selectOption, stateId === s.id ? { backgroundColor: colors.primaryLight } : null]}
                    >
                      <Text style={[styles.selectOptionText, { color: stateId === s.id ? colors.primary : colors.text }]}>{s.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Service City</Text>
              <View style={[styles.selectBox, { borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(CITIES_BY_STATE[stateId] || []).map(c => (
                    <Pressable
                      key={c}
                      onPress={() => setCity(c)}
                      style={[styles.selectOption, city === c ? { backgroundColor: colors.primaryLight } : null]}
                    >
                      <Text style={[styles.selectOptionText, { color: city === c ? colors.primary : colors.text }]}>{c}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable
              onPress={handleSaveProduct}
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
                <Text style={styles.saveBtnText}>Save Inventory Item</Text>
              )}
            </Pressable>
            <View style={{ height: 40 }} />
          </ScrollView>
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
  filterSection: {
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
  center: {
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
  productsScroll: {
    flex: 1,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: Spacing.sm,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  productMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  stockLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
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
    maxWidth: 500,
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
  textArea: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    height: 70,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 6,
    flexDirection: 'row',
  },
  selectOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  selectOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
