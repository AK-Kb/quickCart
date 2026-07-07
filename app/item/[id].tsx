import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { CartStore, useCartCount, SessionStore } from '../../constants/cart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatPrice = (price: number): string => {
  return '₹' + Intl.NumberFormat('en-IN').format(price);
};

// Shimmering / pulsing loading skeleton for similar cards
const SimilarProductsSkeleton = ({ colors }: { colors: any }) => {
  return (
    <View style={{ flexDirection: 'row', paddingRight: Spacing.lg }}>
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          style={[
            styles.similarCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: 0.6,
            },
          ]}
        >
          <View style={[styles.skeletonBox, { width: '100%', height: 100, backgroundColor: colors.border }]} />
          
          <View style={styles.similarDetails}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={[styles.skeletonBox, { width: 30, height: 12, borderRadius: 2, backgroundColor: colors.border }]} />
              <View style={[styles.skeletonBox, { width: 45, height: 12, borderRadius: 6, backgroundColor: colors.border }]} />
            </View>

            <View style={[styles.skeletonBox, { width: '90%', height: 12, borderRadius: 2, marginBottom: 4, backgroundColor: colors.border }]} />
            <View style={[styles.skeletonBox, { width: '60%', height: 12, borderRadius: 2, marginBottom: 8, backgroundColor: colors.border }]} />

            <View style={[styles.skeletonBox, { width: 50, height: 14, borderRadius: 2, backgroundColor: colors.border }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Ref to parent ScrollView for smooth scrolling back to top on similar item tap
  const scrollViewRef = useRef<ScrollView>(null);

  // Retrieve reactive cart count
  const cartCount = useCartCount();

  // Retrieve Safe Area insets
  const insets = useSafeAreaInsets();

  // Product state
  const [product, setProduct] = useState<any>(null);

  // Selected quantity state
  const [quantity, setQuantity] = useState(1);
  const [isAddedSuccessfully, setIsAddedSuccessfully] = useState(false);

  // Structured screen status state
  type ScreenState = 'loading' | 'success' | '400' | '401' | '403' | '404' | '500';
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Similar products state
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isFetchingSimilar, setIsFetchingSimilar] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetails(id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProductDetails = async (productId: string) => {
    setScreenState('loading');
    setErrorMessage('');
    
    // 400 Bad Request check: empty or invalid item identifier
    if (!productId || productId.trim() === '' || productId === 'undefined' || productId === 'null') {
      setScreenState('400');
      return;
    }

    // 401 Unauthorized check: session validation
    const currentUser = SessionStore.getUser();
    if (!currentUser || !currentUser.mobile) {
      setScreenState('401');
      return;
    }

    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const prodData = docSnap.data();
        setProduct(prodData);
        setQuantity(1);
        setScreenState('success');
        
        // Fetch similar products in the same category
        await fetchSimilarProducts(prodData);
      } else {
        // 404 Item Not Found check
        setScreenState('404');
      }
    } catch (error: any) {
      console.error('Error fetching product details from Firestore:', error);
      if (error.code === 'permission-denied') {
        // 403 Forbidden check
        setScreenState('403');
      } else {
        // 500 Server / connection error
        setScreenState('500');
        setErrorMessage(error.message || 'Database connection error.');
      }
    }
  };

  const fetchSimilarProducts = async (currentProduct: any) => {
    if (!currentProduct || !currentProduct.category) return;
    setIsFetchingSimilar(true);
    try {
      const productsCol = collection(db, 'products');
      // Limit to 5 documents: handles current item exclusion while requesting exactly 4 items
      const q = query(
        productsCol, 
        where('category', '==', currentProduct.category), 
        limit(5)
      );
      const querySnapshot = await getDocs(q);

      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Filter out currently viewed product
        if (data.id !== currentProduct.id) {
          list.push(data);
        }
      });

      // Limit similar products list to maximum of 4 items
      setSimilarProducts(list.slice(0, 4));
    } catch (error) {
      console.error('Error fetching similar products:', error);
    } finally {
      setIsFetchingSimilar(false);
    }
  };

  const handleSimilarProductPress = (productId: string) => {
    // Navigate and refresh page details
    router.push(`/item/${productId}` as any);
    
    // Smoothly scroll parent container back to the top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Add product to CartStore with selected quantity
    CartStore.addToCart(product, quantity);
    
    // Trigger quick confirmation feedback
    setIsAddedSuccessfully(true);
    setTimeout(() => {
      setIsAddedSuccessfully(false);
    }, 2000);
  };

  if (screenState === 'loading') {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.textMuted }]}>Fetching product details...</Text>
      </SafeAreaView>
    );
  }

  if (screenState === '400') {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Ionicons name="bug-outline" size={64} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Bad Request (400)</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>
          The requested product identifier is invalid. Please return to the catalogue and select another item.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.errorActionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.errorActionText}>Go to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screenState === '401') {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Ionicons name="lock-closed-outline" size={64} color={colors.secondary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Login Required (401)</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>
          You must be logged in to view product details. Please sign in to continue.
        </Text>
        <Pressable
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.errorActionBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.errorActionText}>Sign In Now</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screenState === '403') {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Ionicons name="ban-outline" size={64} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Access Denied (403)</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>
          You do not have permission to view this product. Please check your credentials or contact support.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.errorActionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.errorActionText}>Go to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screenState === '404') {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Ionicons name="search-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Product Not Found (404)</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>
          The item you are looking for does not exist or has been removed from the catalogue.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.errorActionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.errorActionText}>Go to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (screenState === '500') {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Ionicons name="cloud-offline-outline" size={64} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Server Error (500)</Text>
        <Text style={[styles.errorDesc, { color: colors.textMuted }]}>
          {errorMessage || 'We encountered an error connecting to the database server. Please check your network connection.'}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Pressable
            onPress={() => id && fetchProductDetails(id as string)}
            style={({ pressed }) => [
              styles.errorActionBtn, 
              { backgroundColor: colors.primary, marginRight: Spacing.md, opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <Text style={styles.errorActionText}>Try Again</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [
              styles.errorActionBtn, 
              { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <Text style={[styles.errorActionText, { color: colors.text }]}>Go to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOutOfStock = product.availability === 'Out of Stock' || product.status === 'Out of Stock';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Floating Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/cart')}
          style={({ pressed }) => [
            styles.headerBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="cart-outline" size={20} color={colors.text} />
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Large Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{product.category}</Text>
          </View>
        </View>

        {/* Product Details info section */}
        <View style={styles.detailsSection}>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {product.rating}</Text>
            </View>
            
            <View style={[
              styles.stockBadge, 
              { 
                backgroundColor: isOutOfStock ? colors.error + '15' : '#E8F5E9',
                borderColor: isOutOfStock ? colors.error : '#4CAF50'
              }
            ]}>
              <View style={[
                styles.stockDot, 
                { backgroundColor: isOutOfStock ? colors.error : '#4CAF50' }
              ]} />
              <Text style={[
                styles.stockText, 
                { color: isOutOfStock ? colors.error : '#4CAF50' }
              ]}>
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </Text>
            </View>
          </View>

          <Text style={[styles.productName, { color: colors.text }]}>
            {product.title || product.name}
          </Text>

          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {formatPrice(product.price)}
          </Text>

          <View style={[styles.divider, { borderBottomColor: colors.border }]} />

          {/* Description Section */}
          <Text style={[styles.infoTitle, { color: colors.text }]}>Product Description</Text>
          <Text style={[styles.infoBody, { color: colors.textMuted }]}>
            {product.description}
          </Text>

          {/* Regional context info */}
          <View style={[styles.regionalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.regionalText, { color: colors.text }]}>
              Originating and shipped from <Text style={{ fontWeight: '700' }}>{product.state}</Text>
            </Text>
          </View>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <View style={styles.quantitySection}>
              <Text style={[styles.quantityLabel, { color: colors.text }]}>Select Quantity</Text>
              
              <View style={[styles.counterContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Pressable
                  onPress={handleDecrement}
                  style={styles.counterBtn}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={18} color={quantity <= 1 ? colors.textMuted : colors.text} />
                </Pressable>
                
                <Text style={[styles.counterText, { color: colors.text }]}>{quantity}</Text>
                
                <Pressable
                  onPress={handleIncrement}
                  style={styles.counterBtn}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>
          )}

        </View>

        {/* Similar Products Section */}
        <View style={styles.similarSection}>
          <Text style={[styles.similarSectionTitle, { color: colors.text }]}>Similar Products</Text>
          {isFetchingSimilar ? (
            <SimilarProductsSkeleton colors={colors} />
          ) : similarProducts.length === 0 ? (
            <Text style={[styles.noSimilarText, { color: colors.textMuted }]}>
              No similar products available.
            </Text>
          ) : (
            <FlatList
              data={similarProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.similarListContainer}
              decelerationRate="fast"
              snapToInterval={176}
              snapToAlignment="start"
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={2}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={({ item }) => {
                const itemOutOfStock = item.availability === 'Out of Stock' || item.status === 'Out of Stock';
                return (
                  <Pressable
                    onPress={() => handleSimilarProductPress(item.id)}
                    style={({ pressed }) => [
                      styles.similarCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.9 : 1,
                        ...Shadows.light,
                      },
                    ]}
                  >
                    <Image source={{ uri: item.image }} style={styles.similarImage} resizeMode="cover" />
                    
                    <View style={styles.similarDetails}>
                      <View style={styles.similarRatingRow}>
                        <View style={styles.similarRatingBadge}>
                          <Text style={styles.similarRatingText}>⭐ {item.rating}</Text>
                        </View>
                        <View style={[
                          styles.similarStockBadge,
                          { 
                            backgroundColor: itemOutOfStock ? colors.error + '15' : '#E8F5E9',
                            borderColor: itemOutOfStock ? colors.error : '#4CAF50'
                          }
                        ]}>
                          <Text style={[
                            styles.similarStockText,
                            { color: itemOutOfStock ? colors.error : '#4CAF50' }
                          ]}>
                            {itemOutOfStock ? 'Sold Out' : 'In Stock'}
                          </Text>
                        </View>
                      </View>

                      <Text numberOfLines={2} style={[styles.similarName, { color: colors.text }]}>
                        {item.title || item.name}
                      </Text>

                      <Text style={[styles.similarPrice, { color: colors.primary }]}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[
        styles.footer, 
        { 
          backgroundColor: colors.card, 
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.md
        }
      ]}>
        <View style={styles.footerPriceCol}>
          <Text style={[styles.footerPriceLabel, { color: colors.textMuted }]}>TOTAL PRICE</Text>
          <Text style={[styles.footerPrice, { color: colors.text }]}>
            {formatPrice(product.price * quantity)}
          </Text>
        </View>

        <Pressable
          onPress={handleAddToCart}
          disabled={isOutOfStock || isAddedSuccessfully}
          style={({ pressed }) => [
            styles.addToCartBtn,
            {
              backgroundColor: isOutOfStock 
                ? colors.textMuted 
                : isAddedSuccessfully 
                  ? '#4CAF50' 
                  : colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons 
            name={isAddedSuccessfully ? "checkmark-circle-outline" : "cart-outline"} 
            size={18} 
            color="#fff" 
            style={{ marginRight: 6 }} 
          />
          <Text style={styles.addToCartText}>
            {isOutOfStock 
              ? 'Sold Out' 
              : isAddedSuccessfully 
                ? 'Added ✓' 
                : `Add ${quantity} to Cart`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  errorDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  backToHomeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.round,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  scrollContent: {
    paddingTop: 0,
  },
  imageContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.85,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.xs,
  },
  categoryTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ratingBadge: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: Spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  regionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  regionalText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quantitySection: {
    marginTop: Spacing.sm,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: 38,
  },
  counterBtn: {
    width: 38,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 12,
    textAlign: 'center',
    minWidth: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  footerPriceCol: {
    justifyContent: 'center',
  },
  footerPriceLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '900',
  },
  addToCartBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 160,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  similarSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  similarSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  noSimilarText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    paddingVertical: Spacing.sm,
  },
  similarListContainer: {
    paddingRight: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  similarCard: {
    width: 160,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  similarImage: {
    width: '100%',
    height: 100,
  },
  similarDetails: {
    padding: Spacing.sm,
  },
  similarRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  similarRatingBadge: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.xs,
  },
  similarRatingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#333',
  },
  similarStockBadge: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 0.5,
  },
  similarStockText: {
    fontSize: 8,
    fontWeight: '800',
  },
  similarName: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    height: 32,
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  skeletonBox: {
    overflow: 'hidden',
  },
  errorActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.round,
    marginTop: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  errorActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
