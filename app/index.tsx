import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useColorScheme,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock Data for Onboarding Slides
const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Seamless Shopping',
    description: 'Discover thousands of products at your fingertips. Browse through curated categories and find exactly what you need.',
    tagline: 'Shop Smart, Shop Fast',
  },
  {
    id: '2',
    title: 'Quick & Secure Checkout',
    description: 'Add items to your cart, checkout securely with a single tap, and experience hassle-free payment options.',
    tagline: 'Safe, Fast & Encrypted',
  },
  {
    id: '3',
    title: 'Super Fast Delivery',
    description: 'Your package is handled with utmost care and delivered straight to your doorstep in record time. Track every step.',
    tagline: 'Delivered in 24 Hours',
  },
];

export default function Index() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Screen states: 'splash' | 'onboarding'
  const [appState, setAppState] = useState<'splash' | 'onboarding'>('splash');
  const [activeSlide, setActiveSlide] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideScrollRef = useRef<ScrollView>(null);

  // Splash animation run
  useEffect(() => {
    if (appState === 'splash') {
      // Fade in splash
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Hold splash then transition to onboarding
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          setAppState('onboarding');
          // Reset fade for onboarding content
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        });
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [appState, fadeAnim, scaleAnim]);

  // Handle slide change detection
  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const active = Math.round(offset / slideSize);
    setActiveSlide(active);
  };

  const handleNext = () => {
    if (activeSlide < ONBOARDING_SLIDES.length - 1) {
      slideScrollRef.current?.scrollTo({
        x: (activeSlide + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveSlide(activeSlide + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleSkip = () => {
    handleCompleteOnboarding();
  };

  const handleCompleteOnboarding = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // Route to login page instead of home
      router.replace('/login');
    });
  };

  // RENDER SPLASH SCREEN
  if (appState === 'splash') {
    return (
      <View style={[styles.container, { backgroundColor: '#000000', justifyContent: 'center' }]}>
        <StatusBar style="light" />
        <Animated.View style={[styles.splashContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  // RENDER ONBOARDING SCREEN
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header (Skip Button) */}
      <View style={styles.onboardingHeader}>
        {activeSlide < ONBOARDING_SLIDES.length - 1 ? (
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipButtonPlaceholder} />
        )}
      </View>

      {/* Swipeable Slides */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          ref={slideScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slidesContainer}
        >
          {ONBOARDING_SLIDES.map((slide, index) => {
            return (
              <View key={slide.id} style={styles.slideWrapper}>
                {/* Decorative Brand Illustration Card */}
                <View style={[styles.illustrationContainer, { backgroundColor: colors.surface }]}>
                  <View style={[styles.illustrationCircle, { backgroundColor: colors.primaryLight }]} />
                  
                  {index === 0 && (
                    <View style={styles.illustrationMain}>
                      {/* Shopping bag representation */}
                      <View style={[styles.cardGraphic, { backgroundColor: colors.primary, width: 90, height: 110, borderRadius: 12 }]}>
                        <View style={[styles.bagHandle, { borderColor: '#fff' }]} />
                        <Text style={styles.bagLogoText}>qC</Text>
                      </View>
                      {/* Mini floating elements */}
                      <View style={[styles.floatingCard, { top: -10, right: -20, backgroundColor: colors.secondary }]}>
                        <Text style={styles.floatingText}>Sale</Text>
                      </View>
                      <View style={[styles.floatingCard, { bottom: 10, left: -30, backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.floatingText}>$</Text>
                      </View>
                    </View>
                  )}

                  {index === 1 && (
                    <View style={styles.illustrationMain}>
                      {/* Credit card representation */}
                      <View style={[styles.cardGraphic, { backgroundColor: colors.secondary, width: 140, height: 90, borderRadius: 12, padding: 12 }]}>
                        <View style={{ width: 30, height: 20, backgroundColor: '#FFD54F', borderRadius: 4, marginBottom: 15 }} />
                        <View style={{ width: 80, height: 8, backgroundColor: '#fff', opacity: 0.8, borderRadius: 2 }} />
                        <View style={{ width: 50, height: 8, backgroundColor: '#fff', opacity: 0.8, borderRadius: 2, marginTop: 6 }} />
                      </View>
                      <View style={[styles.floatingCard, { top: -20, left: -10, backgroundColor: colors.primary, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
                      </View>
                    </View>
                  )}

                  {index === 2 && (
                    <View style={styles.illustrationMain}>
                      {/* Delivery truck representation */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <View style={{ width: 90, height: 60, backgroundColor: colors.primary, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>FAST</Text>
                        </View>
                        <View style={{ width: 40, height: 40, backgroundColor: colors.secondary, borderTopRightRadius: 8, borderBottomRightRadius: 8 }} />
                      </View>
                      <View style={{ flexDirection: 'row', marginTop: 8, width: 130, justifyContent: 'space-around' }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.text }} />
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.text }} />
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.slideInfoContainer}>
                  <Text style={[styles.slideTagline, { color: colors.secondary }]}>
                    {slide.tagline}
                  </Text>
                  <Text style={[styles.slideTitle, { color: colors.text }]}>
                    {slide.title}
                  </Text>
                  <Text style={[styles.slideDesc, { color: colors.textMuted }]}>
                    {slide.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Footer (Dots + Next Button) */}
      <View style={styles.onboardingFooter}>
        {/* Progress Indicators */}
        <View style={styles.dotRow}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.pagingDot,
                {
                  backgroundColor: i === activeSlide ? colors.primary : colors.border,
                  width: i === activeSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action button */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.nextButtonText, { color: '#fff' }]}>
            {activeSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
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
  // SPLASH STYLES
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    maxWidth: 360,
    maxHeight: 360,
  },
  splashTitle: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  splashTagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // ONBOARDING STYLES
  onboardingHeader: {
    height: 50,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonPlaceholder: {
    height: 30,
  },
  slidesContainer: {
    flex: 1,
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    width: SCREEN_WIDTH - 64,
    height: SCREEN_HEIGHT * 0.35,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.xxl,
  },
  illustrationCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.6,
  },
  illustrationMain: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardGraphic: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bagHandle: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    position: 'absolute',
    top: -20,
  },
  bagLogoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  floatingCard: {
    position: 'absolute',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  slideInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  slideTagline: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDesc: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  onboardingFooter: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagingDot: {
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  nextButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
