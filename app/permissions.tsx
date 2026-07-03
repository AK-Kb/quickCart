import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

// Map of the 29 Indian States/Regions
const INDIAN_STATES = [
  { id: 'andhra_pradesh', name: 'Andhra Pradesh' },
  { id: 'arunachal_pradesh', name: 'Arunachal Pradesh' },
  { id: 'assam', name: 'Assam' },
  { id: 'bihar', name: 'Bihar' },
  { id: 'chhattisgarh', name: 'Chhattisgarh' },
  { id: 'goa', name: 'Goa' },
  { id: 'gujarat', name: 'Gujarat' },
  { id: 'haryana', name: 'Haryana' },
  { id: 'himachal_pradesh', name: 'Himachal Pradesh' },
  { id: 'jharkhand', name: 'Jharkhand' },
  { id: 'karnataka', name: 'Karnataka' },
  { id: 'kerala', name: 'Kerala' },
  { id: 'madhya_pradesh', name: 'Madhya Pradesh' },
  { id: 'maharashtra', name: 'Maharashtra' },
  { id: 'manipur', name: 'Manipur' },
  { id: 'meghalaya', name: 'Meghalaya' },
  { id: 'mizoram', name: 'Mizoram' },
  { id: 'nagaland', name: 'Nagaland' },
  { id: 'odisha', name: 'Odisha' },
  { id: 'punjab', name: 'Punjab' },
  { id: 'rajasthan', name: 'Rajasthan' },
  { id: 'sikkim', name: 'Sikkim' },
  { id: 'tamil_nadu', name: 'Tamil Nadu' },
  { id: 'telangana', name: 'Telangana' },
  { id: 'tripura', name: 'Tripura' },
  { id: 'uttarakhand', name: 'Uttarakhand' },
  { id: 'uttar_pradesh', name: 'Uttar Pradesh' },
  { id: 'west_bengal', name: 'West Bengal' },
  { id: 'delhi', name: 'Delhi' }
];

// Normalize geocoded state/region strings to database ID keys
function normalizeStateName(rawName: string): { id: string; name: string } | null {
  if (!rawName) return null;
  const clean = rawName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // 1. Direct matches
  for (const state of INDIAN_STATES) {
    const formattedStateName = state.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (clean === formattedStateName || clean === state.id) {
      return state;
    }
  }

  // 2. Fuzzy matches (contains)
  for (const state of INDIAN_STATES) {
    const formattedStateName = state.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (clean.includes(formattedStateName) || formattedStateName.includes(clean)) {
      return state;
    }
  }

  return null;
}

export default function PermissionsSetup() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // Screen Status: 'checking' | 'manual_select'
  const [setupState, setSetupState] = useState<'checking' | 'manual_select'>('checking');
  const [statusMessage, setStatusMessage] = useState('Setting up permissions...');
  
  // Selection states
  const [selectedStateId, setSelectedStateId] = useState<string>('delhi');
  const [selectedStateName, setSelectedStateName] = useState<string>('Delhi');
  
  const [warningMsg, setWarningMsg] = useState('');

  useEffect(() => {
    runPermissionsAndDetectionFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runPermissionsAndDetectionFlow = async () => {
    try {
      // 1. Request Notification Permission
      setStatusMessage('Requesting notification access...');
      const notifyPerm = await Notifications.requestPermissionsAsync();
      console.log('Notification permission result:', notifyPerm.status);
      // Fallback rule: If denied, continue. We will save notify status to logs or parameters.

      // 2. Request Location Permission
      setStatusMessage('Requesting location access...');
      const locationPerm = await Location.requestForegroundPermissionsAsync();

      if (locationPerm.status === 'granted') {
        setStatusMessage('Pinpointing your coordinates...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setStatusMessage('Detecting your state/region...');
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.region) {
          const detectedRegion = geocode.region.trim();
          const normalized = normalizeStateName(detectedRegion);

          if (normalized) {
            setStatusMessage(`Loading items for ${normalized.name}...`);
            // Check if items actually exist in Firestore for this state
            const productExists = await verifyFirestoreProductsExist(normalized.id);

            if (productExists) {
              // Redirect successfully
              navigateToHome(normalized.id, normalized.name);
              return;
            } else {
              // Empty State Fallback: detected state has no products
              setWarningMsg(`We detected your region as ${normalized.name}, but there are no products listed there yet. Please choose another region below:`);
              setSelectedStateId(normalized.id);
              setSelectedStateName(normalized.name);
              setSetupState('manual_select');
            }
          } else {
            console.log(`Failed to normalize detected region: "${detectedRegion}". Triggering manual select.`);
            setWarningMsg(`We detected your region as "${detectedRegion}" but couldn't verify it. Please select your state manually:`);
            setSetupState('manual_select');
          }
        } else {
          console.log('Reverse geocoding returned no address. Triggering manual select.');
          setWarningMsg('We could not identify your state from geocoding. Please select your region below:');
          setSetupState('manual_select');
        }
      } else {
        // Location denied fallback
        console.log('Location permission denied. Triggering manual select.');
        setWarningMsg('Location access is disabled. Please select your region manually to continue shopping:');
        setSetupState('manual_select');
      }
    } catch (error) {
      console.error('Permission flow crash:', error);
      setWarningMsg('An error occurred during location detection. Please select your region manually:');
      setSetupState('manual_select');
    }
  };

  // Check if products collection has items for specific stateId
  const verifyFirestoreProductsExist = async (stateId: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'products'),
        where('stateId', '==', stateId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (e) {
      console.error('Error verifying products exist:', e);
      return false;
    }
  };

  const handleSelectState = (id: string, name: string) => {
    setSelectedStateId(id);
    setSelectedStateName(name);
  };

  const handleProceedManual = async () => {
    setStatusMessage(`Verifying ${selectedStateName} inventory...`);
    setSetupState('checking');
    
    const exists = await verifyFirestoreProductsExist(selectedStateId);
    if (exists) {
      navigateToHome(selectedStateId, selectedStateName);
    } else {
      setWarningMsg(`No products are currently available in "${selectedStateName}". Please select another region:`);
      setSetupState('manual_select');
    }
  };

  const navigateToHome = (stateId: string, stateName: string) => {
    router.replace({
      pathname: '/home',
      params: { stateId, stateName },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {setupState === 'checking' ? (
        /* Loading & Automatic Setup Screen */
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.text }]}>Setting Up Your Cart</Text>
          <Text style={[styles.loadingDesc, { color: colors.textMuted }]}>{statusMessage}</Text>
        </View>
      ) : (
        /* Manual Region Setup Fallback Screen */
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={styles.badgeCircle}>
              <Ionicons name="location-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Choose Your Region</Text>
            {warningMsg ? (
              <Text style={[styles.subtitle, { color: colors.secondary }]}>{warningMsg}</Text>
            ) : (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Please select your state to display matching e-commerce products.
              </Text>
            )}
          </View>

          {/* List of 29 states */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            <View style={styles.grid}>
              {INDIAN_STATES.map((state) => {
                const isSelected = selectedStateId === state.id;
                return (
                  <Pressable
                    key={state.id}
                    onPress={() => handleSelectState(state.id, state.name)}
                    style={[
                      styles.stateCard,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        ...Shadows.light,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? colors.primary : colors.textMuted}
                      style={{ marginRight: Spacing.sm }}
                    />
                    <Text
                      style={[
                        styles.stateText,
                        {
                          color: colors.text,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {state.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Proceed Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleProceedManual}
              style={({ pressed }) => [
                styles.proceedBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.proceedBtnText}>Proceed to Shop</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        </View>
      )}
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
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  loadingDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stateCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  stateText: {
    fontSize: 15,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  proceedBtn: {
    height: 50,
    borderRadius: BorderRadius.round,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
