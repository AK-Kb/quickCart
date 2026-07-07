import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useColorScheme,
  Pressable,
  ScrollView,
  Dimensions,
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

export default function HomeTab() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Retrieve global region state & cart count reactively
  const activeRegion = useRegionState();
  const cartCount = useCartCount();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<any[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch products by state when state param changes
  useEffect(() => {
    fetchProductsByState(activeRegion.id);
  }, [activeRegion.id]);

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
      console.error('Firestore query error:', error);
      setHasError(true);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  const handleAddToCart = (product: any) => {
    CartStore.addToCart(product);
  };


  // Filter products by category
  const filteredProducts = products.filter(product => {
    return selectedCategory === 'All' || product.category === selectedCategory;
  });

  const recommendedProducts = products.filter(product => product.rating >= 4.6).slice(0, 6);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Top Navbar */}
      <View style={styles.homeHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.logoTiny}
            resizeMode="contain"
          />
          <Text style={[styles.homeBrandName, { color: colors.primary }]}>
            quick<Text style={{ color: colors.secondary }}>Cart</Text>
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
      </View>

      {/* Read-Only Search Bar that routes to Explore tab when tapped */}
      <View style={styles.searchSection}>
        <Pressable
          onPress={() => router.push('/explore')}
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textMuted, fontSize: 15, flex: 1 }}>
            Search products, brands, categories...
          </Text>
        </Pressable>
      </View>

      {/* Location Status Banner with Change Region Option */}
      <View style={[styles.locationBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.locationIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>
          <View style={{ marginLeft: Spacing.sm }}>
            <Text style={[styles.locationLabel, { color: colors.textMuted }]}>State/Region Selected</Text>
            <Text style={[styles.locationValue, { color: colors.text }]}>
              {activeRegion.name}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.replace('/permissions')}
          style={({ pressed }) => [
            styles.changeRegionBtn,
            {
              backgroundColor: colors.primaryLight,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.changeRegionBtnText, { color: colors.primary }]}>Change</Text>
        </Pressable>
      </View>

      {/* Main Scroll Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        
        {/* Banner Promo */}
        <View style={[styles.promoBanner, { backgroundColor: colors.primaryLight }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.promoTitle, { color: colors.primary }]}>Welcome Promo!</Text>
            <Text style={[styles.promoText, { color: colors.text }]}>Get 20% off on your first order with coupon:</Text>
            <Text style={[styles.promoCoupon, { color: colors.secondary }]}>QUICKSTART20</Text>
          </View>
          <View style={styles.promoBagGraphic}>
            <Text style={{ fontSize: 44 }}>🛍️</Text>
          </View>
        </View>

        {/* Categories Horizontal List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        </View>
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

        {/* Recommended Row (Only visible on landing "All" category view) */}
        {!isFetchingProducts && !hasError && selectedCategory === 'All' && recommendedProducts.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended for You</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>Top Rated</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedContainer}
            >
              {recommendedProducts.map(product => (
                <Pressable
                  key={`rec-${product.id}`}
                  onPress={() => router.push(`/item/${product.id}` as any)}
                  style={({ pressed }) => [
                    styles.recommendedCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.95 : 1,
                      ...Shadows.light,
                    },
                  ]}
                >
                  <Image source={{ uri: product.image }} style={styles.recommendedImage} resizeMode="cover" />
                  <View style={styles.recommendedDetails}>
                    <Text numberOfLines={1} style={[styles.recommendedName, { color: colors.text }]}>
                      {product.name}
                    </Text>
                    <View style={styles.recommendedFooter}>
                      <Text style={[styles.recommendedPrice, { color: colors.primary }]}>
                        {formatPrice(product.price)}
                      </Text>
                      <Pressable
                        onPress={() => handleAddToCart(product)}
                        style={({ pressed }) => [
                          styles.recommendedAddBtn,
                          {
                            backgroundColor: colors.secondary,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text style={styles.recommendedAddBtnText}>+ Add</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>⭐ {product.rating}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory === 'All' ? 'Featured Products' : `${selectedCategory} Products`}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
            {!isFetchingProducts && !hasError ? `${filteredProducts.length} items` : '0 items'}
          </Text>
        </View>

        {/* Products Grid / Fetch Loader / Empty Fallback state */}
        {isFetchingProducts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading products for your region...
            </Text>
          </View>
        ) : hasError ? (
          /* Error State Fallback */
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBadge, { backgroundColor: colors.error + '10' }]}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Failed to Load Products</Text>
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              We encountered an issue loading products from Firestore. Please verify your connection and try again.
            </Text>
            <View style={styles.emptyStateActions}>
              <Pressable
                onPress={() => fetchProductsByState(activeRegion.id)}
                style={({ pressed }) => [
                  styles.emptyStateBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={[styles.emptyStateBtnText, { color: '#fff' }]}>Retry Connection</Text>
              </Pressable>
            </View>
          </View>
        ) : filteredProducts.length === 0 ? (
          /* Empty State + Retry / Manual selection Fallback */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBadge}>
              <Ionicons name="gift-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Products Available</Text>
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              There are no products listed in &quot;{activeRegion.name}&quot; yet. Please pick another region.
            </Text>
            <View style={styles.emptyStateActions}>
              <Pressable
                onPress={() => fetchProductsByState(activeRegion.id)}
                style={({ pressed }) => [
                  styles.emptyStateBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    marginRight: Spacing.sm,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="refresh" size={16} color={colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.emptyStateBtnText, { color: colors.text }]}>Retry</Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace('/permissions')}
                style={({ pressed }) => [
                  styles.emptyStateBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="location" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={[styles.emptyStateBtnText, { color: '#fff' }]}>Change Region</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Render grid of products */
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
                {/* Product Image Box */}
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
        )}
        


        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  logoTiny: {
    width: 32,
    height: 32,
    marginRight: 6,
  },
  homeBrandName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  locationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  locationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  changeRegionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
  },
  changeRegionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  promoText: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  promoCoupon: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promoBagGraphic: {
    marginLeft: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.round,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 14,
  },
  recommendedContainer: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  recommendedCard: {
    width: 180,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  recommendedImage: {
    width: '100%',
    height: 90,
  },
  recommendedDetails: {
    padding: Spacing.sm,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  recommendedPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  recommendedAddBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.xs,
  },
  recommendedAddBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.xs,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
  },
  emptyIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyStateActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  emptyStateBtn: {
    flexDirection: 'row',
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  devPanel: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  devTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  devDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  devBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  devBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  devBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
