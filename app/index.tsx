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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Onboarding Slide Data aligned with the reference design
const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Welcome to quickCart',
    description: 'Discover a seamless shopping experience right at your fingertips.',
  },
  {
    id: '2',
    title: 'Quick & Secure Checkout',
    description: 'Add items to your cart, checkout securely with a single tap, and experience hassle-free payment options.',
  },
  {
    id: '3',
    title: 'Super Fast Delivery',
    description: 'Your package is handled with utmost care and delivered straight to your doorstep in record time.',
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

  // Splash/Starting Logo page animation
  useEffect(() => {
    if (appState === 'splash') {
      // Fade in logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();

      // Transition to onboarding pages after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setAppState('onboarding');
          // Reset fade for onboarding content
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [appState, fadeAnim, scaleAnim]);

  // Track page slides
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
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/login');
    });
  };

  // 1. RENDER STARTING SPLASH SCREEN (WHITE BG, ROUND LOGO, E-COMMERCE CONTENT)
  if (appState === 'splash') {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF', justifyContent: 'center' }]}>
        <StatusBar style="dark" />
        <Animated.View style={[styles.splashContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Circular/Round Logo Container */}
          <View style={styles.splashLogoCircle}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.splashLogoImage}
              resizeMode="contain"
            />
          </View>
          {/* E-Commerce Content underneath the logo */}
          <Text style={[styles.splashTitle, { color: colors.primary }]}>
            quick<Text style={{ color: colors.secondary }}>Cart</Text>
          </Text>
          <Text style={styles.splashTagline}>
            Shop Fast. Deliver Faster.
          </Text>
          {/* Animated loading dots */}
          <View style={styles.loadingContainer}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={[styles.dot, { backgroundColor: colors.secondary, marginHorizontal: 8 }]} />
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          </View>
        </Animated.View>
      </View>
    );
  }

  // 2. RENDER SPLASH/ONBOARDING PAGES (WHITE BG, SKIP BUTTON, CIRCULAR ICON)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <StatusBar style="dark" />
      
      {/* Top Header - Skip button is placed here (not on starting logo page) */}
      <View style={styles.onboardingHeader}>
        {activeSlide < ONBOARDING_SLIDES.length - 1 ? (
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
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
                {/* Illustration Section: Soft blue circle with shadowed circular logo card */}
                <View style={styles.circleOuterContainer}>
                  <View style={styles.circleInnerContainer}>
                    <View style={styles.logoCardShadow}>
                      {index === 0 && (
                        <Image
                          source={require('../assets/images/icon.png')}
                          style={styles.onboardingLogo}
                          resizeMode="contain"
                        />
                      )}
                      {index === 1 && (
                        <Ionicons name="card" size={52} color={colors.secondary} />
                      )}
                      {index === 2 && (
                        <Ionicons name="cube" size={52} color={colors.primary} />
                      )}
                    </View>
                  </View>
                </View>

                {/* Text Content */}
                <View style={styles.slideInfoContainer}>
                  <Text style={styles.slideTitle}>
                    {slide.title}
                  </Text>
                  <Text style={styles.slideDesc}>
                    {slide.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Pagination dots centered below description and above action button */}
      <View style={styles.dotsCenterContainer}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.pagingDot,
              {
                backgroundColor: i === activeSlide ? colors.primary : '#D0D8DF',
                width: i === activeSlide ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom Button (Full-width, clean blue layout) */}
      <View style={styles.footerButtonContainer}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.fullWidthButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.fullWidthButtonText}>
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
  // SPLASH INTRO LOGO PAGE STYLES
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90, // Perfect circle shape
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    // Soft drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  splashLogoImage: {
    width: 130,
    height: 130,
    borderRadius: 65, // Round shape for splash logo image
  },
  splashTitle: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: Spacing.xs,
  },
  splashTagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6E7E8B',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // ONBOARDING PAGE STYLES
  onboardingHeader: {
    height: 50,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  skipButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E7E8B',
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
  circleOuterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  circleInnerContainer: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#EAF5FF', // Soft light-blue background circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCardShadow: {
    width: 115,
    height: 115,
    borderRadius: 57.5, // Perfect round circle logo card
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  onboardingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40, // Perfect round logo image inside card
  },
  slideInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A3563', // Bold dark blue title
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6E7E8B', // Muted grey description text
    textAlign: 'center',
  },
  dotsCenterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pagingDot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  footerButtonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
    width: '100%',
  },
  fullWidthButton: {
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
