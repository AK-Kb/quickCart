import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useColorScheme,
  Pressable,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock Products for the Homepage
const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 189.99,
    category: 'Electronics',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    color: '#0B6A9C',
  },
  {
    id: 'p2',
    name: 'Minimalist Leather Chronograph Watch',
    price: 145.00,
    category: 'Fashion',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    color: '#FF6B00',
  },
  {
    id: 'p3',
    name: 'Ergonomic Mesh Office Chair',
    price: 249.50,
    category: 'Home',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60',
    color: '#0B6A9C',
  },
  {
    id: 'p4',
    name: 'Smart Fitness Sports Tracker Band',
    price: 79.99,
    category: 'Sports',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=60',
    color: '#FF6B00',
  },
];

const MOCK_CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Beauty'];

export default function Home() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Component States
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  // Filter products by category and search query
  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogout = () => {
    router.replace('/login');
  };

  const trigger404 = () => {
    // Navigate to a non-existent route to trigger the +not-found screen
    router.push('/non-existent-page' as any);
  };

  const triggerError = () => {
    // Navigate to a page that will crash and render the Error Boundary
    router.push('/error-test');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Top Navbar */}
      <View style={styles.homeHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logoTiny}
            resizeMode="contain"
          />
          <Text style={[styles.homeBrandName, { color: colors.primary }]}>
            quick<Text style={{ color: colors.secondary }}>Cart</Text>
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Cart Icon & Badge */}
          <Pressable style={[styles.cartIconContainer, { backgroundColor: colors.surface, marginRight: Spacing.sm }]}>
            <Ionicons name="cart-outline" size={20} color={colors.text} />
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: colors.secondary }]}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>

          {/* Logout Button */}
          <Pressable 
            onPress={handleLogout}
            style={[styles.cartIconContainer, { backgroundColor: colors.secondaryLight }]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products, brands, categories..."
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

      {/* Main Content Area */}
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

        {/* Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory === 'All' ? 'Featured Products' : `${selectedCategory} Products`}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
            {filteredProducts.length} items
          </Text>
        </View>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              No products found matching &quot;{searchQuery}&quot;
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map(product => (
              <View
                key={product.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...Shadows.light,
                  },
                ]}
              >
                {/* Mock Image Box */}
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
                      ${product.price.toFixed(2)}
                    </Text>
                    
                    <Pressable
                      onPress={handleAddToCart}
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
              </View>
            ))}
          </View>
        )}
        
        {/* ==================== DIAGNOSTIC / DEV PANEL ==================== */}
        <View style={[styles.devPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.devTitle, { color: colors.text }]}>🛠️ Diagnostic & Routing Tests</Text>
          <Text style={[styles.devDesc, { color: colors.textMuted }]}>
            Verify custom 404 (Page Not Found) and layout Error Boundary screens by triggering them below:
          </Text>

          <View style={styles.devBtnRow}>
            {/* 404 trigger */}
            <Pressable
              onPress={trigger404}
              style={({ pressed }) => [
                styles.devBtn,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.devBtnText, { color: colors.primary }]}>Trigger 404 Page</Text>
            </Pressable>

            {/* Error trigger */}
            <Pressable
              onPress={triggerError}
              style={({ pressed }) => [
                styles.devBtn,
                {
                  backgroundColor: colors.secondaryLight,
                  borderColor: colors.secondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="bug-outline" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text style={[styles.devBtnText, { color: colors.secondary }]}>Trigger Error Page</Text>
            </Pressable>
          </View>
        </View>

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
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
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
    paddingVertical: 40,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  // DEV PANEL STYLES
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
