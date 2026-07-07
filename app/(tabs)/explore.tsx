import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
  Dimensions,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CartStore, useCartCount, useRegionState } from '../../constants/cart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MOCK_CATEGORIES = [
  'All', 
  'Electronics', 
  'Fashion', 
  'Home', 
  'Sports', 
  'Beauty', 
  'Grocery', 
  'Books', 
  'Toys', 
  'Automotive', 
  'Health'
];

const formatPrice = (price: number): string => {
  return '₹' + Intl.NumberFormat('en-IN').format(price);
};

export default function ExploreTab() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve global region state & cart count reactively
  const activeRegion = useRegionState();
  const cartCount = useCartCount();

  const searchInputRef = useRef<TextInput>(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Firestore product data
  const [products, setProducts] = useState<any[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch products by state on mount and when active region updates
  useEffect(() => {
    fetchProductsByState(activeRegion.id);
  }, [activeRegion.id]);

  // Automatically focus the search input on mount
  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  }, []);

  const fetchProductsByState = async (stateId: string) => {
    setIsFetchingProducts(true);
    setHasError(false);
    try {
      const productsCol = collection(db, 'products');
      const q = query(productsCol, where('stateId', '==', stateId));
      const querySnapshot = await getDocs(q);
      
      let fetchedList: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedList.push(doc.data());
      });

      setProducts(fetchedList);
    } catch (error) {
      console.error('Explore Firestore query error:', error);
      setHasError(true);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const handleAddToCart = (product: any) => {
    CartStore.addToCart(product);
  };

  // Filter products matching category and search query within current state
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header Title & Cart Badge */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explore Inventory</Text>
        
        <Pressable
          onPress={() => router.push('/cart')}
          style={styles.cartIconContainer}
        >
          <Ionicons name="cart-outline" size={20} color={colors.text} />
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Location Banner (Showing where we are searching products) */}
      <View style={styles.locationBannerRow}>
        <Ionicons name="location-outline" size={14} color={colors.primary} />
        <Text style={[styles.locationText, { color: colors.textMuted }]}>
          Searching in <Text style={{ color: colors.text, fontWeight: '700' }}>{activeRegion.name}</Text>
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products, category, description..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories Horizontal filters */}
      <View style={styles.categoryLabelRow}>
        <Text style={[styles.categoryLabelTitle, { color: colors.text }]}>Filter Categories</Text>
      </View>
      
      <View style={{ height: 42, marginBottom: Spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {MOCK_CATEGORIES.map(category => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected ? '#fff' : colors.text,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Grid results */}
      {isFetchingProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Searching local catalog...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={40} color={colors.error} />
          <Text style={[styles.emptyStateTitle, { color: colors.text, marginTop: 10 }]}>Search Error</Text>
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
            An issue occurred searching the catalog. Please check connection.
          </Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={44} color={colors.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: colors.text, marginTop: 10 }]}>No Results Found</Text>
          <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
            No products found matching &quot;{searchQuery}&quot; in {activeRegion.name}.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.productsGrid}>
            {filteredProducts.map(product => (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/item/${product.id}` as any)}
                style={({ pressed }) => [
                  styles.productCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.95 : 1,
                    ...Shadows.light,
                  },
                ]}
              >
                {/* Product Image */}
                <View style={[styles.productImageContainer, { backgroundColor: colors.surface }]}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productCategoryTag}>
                    <Text style={styles.productCategoryTagText}>{product.category}</Text>
                  </View>
                </View>
                
                {/* Product Details */}
                <View style={styles.productDetails}>
                  <Text style={styles.ratingText}>⭐ {product.rating}</Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.productName, { color: colors.text }]}
                  >
                    {product.name}
                  </Text>
                  
                  <View style={styles.productFooter}>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>
                      {formatPrice(product.price)}
                    </Text>
                    
                    <Pressable
                      onPress={() => handleAddToCart(product)}
                      style={({ pressed }) => [
                        styles.addToCartButton,
                        {
                          backgroundColor: colors.secondary,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.addToCartText}>Add +</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  cartIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  locationBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  categoryLabelRow: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  categoryLabelTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoriesContainer: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.round,
    marginRight: 8,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 13,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 80,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  productCard: {
    width: (SCREEN_WIDTH - 40) / 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  productImageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productCategoryTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.xs,
  },
  productCategoryTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  productDetails: {
    padding: Spacing.sm,
  },
  ratingText: {
    fontSize: 11,
    color: '#FFA000',
    fontWeight: '600',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    height: 40,
    lineHeight: 20,
    marginBottom: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  addToCartButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
