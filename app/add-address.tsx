import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SessionStore } from '../constants/cart';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddAddressScreen() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  const currentUser = SessionStore.getUser();

  // Form Fields
  const [recipientName, setRecipientName] = useState(currentUser?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.mobile || '');
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [label, setLabel] = useState('Home');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // States
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setErrorMsg('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location access permission was denied. You can enter your address details manually.',
          [{ text: 'OK' }]
        );
        setIsFetchingLocation(false);
        return;
      }

      // Fetch position with timeout/fallback
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setCoords({ latitude, longitude });

      // Reverse geocoding
      const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode) {
        setHouseFlat(geocode.name || '');
        setStreetArea(geocode.street || geocode.district || '');
        setLandmark(geocode.subregion || '');
        setCity(geocode.city || '');
        setState(geocode.region || '');
        setPostalCode(geocode.postalCode || '');
      } else {
        setErrorMsg('Could not fetch address details automatically. Please enter manually.');
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        'GPS Error',
        'Could not obtain location. Make sure GPS is enabled and try again, or enter address manually.',
        [{ text: 'Retry', onPress: () => handleUseCurrentLocation() }, { text: 'OK' }]
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSave = () => {
    setErrorMsg('');

    // Validations
    if (!recipientName.trim()) return setErrorMsg('Recipient Name is required.');
    if (!phoneNumber.trim() || phoneNumber.trim().length !== 10 || isNaN(Number(phoneNumber))) {
      return setErrorMsg('Recipient Phone must be a valid 10-digit number.');
    }
    if (!houseFlat.trim()) return setErrorMsg('House / Flat details are required.');
    if (!streetArea.trim()) return setErrorMsg('Street / Area details are required.');
    if (!city.trim()) return setErrorMsg('City is required.');
    if (!state.trim()) return setErrorMsg('State is required.');
    if (!postalCode.trim() || postalCode.trim().length !== 6 || isNaN(Number(postalCode))) {
      return setErrorMsg('Postal Code must be a valid 6-digit number.');
    }

    // Confirm before saving
    Alert.alert(
      'Confirm Address',
      `Save this address as your delivery address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => saveAddress()
        }
      ]
    );
  };

  const saveAddress = async () => {
    setIsSaving(true);
    try {
      const addressText = `${houseFlat.trim()}, ${streetArea.trim()}, ${
        landmark.trim() ? landmark.trim() + ', ' : ''
      }${city.trim()}, ${state.trim()} - ${postalCode.trim()}`;

      // Check if user already has addresses. If not, make this default automatically.
      const q = query(
        collection(db, 'addresses'),
        where('userEmail', '==', currentUser?.email.toLowerCase())
      );
      const snap = await getDocs(q);
      const isDefault = snap.empty;

      const newId = `addr_${Date.now()}`;
      const addrRef = doc(db, 'addresses', newId);

      await setDoc(addrRef, {
        id: newId,
        userEmail: currentUser?.email.toLowerCase(),
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        houseFlat: houseFlat.trim(),
        streetArea: streetArea.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        addressText,
        label,
        notes: notes.trim(),
        latitude: coords?.latitude || 0,
        longitude: coords?.longitude || 0,
        isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      router.back();
    } catch (e: any) {
      setErrorMsg('Failed to save address: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Delivery Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {errorMsg ? (
            <View style={[styles.banner, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[styles.bannerText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Current Location button */}
          <Pressable
            onPress={handleUseCurrentLocation}
            disabled={isFetchingLocation}
            style={({ pressed }) => [
              styles.locationBtn,
              { borderColor: colors.primary, backgroundColor: colors.primaryLight },
              (pressed || isFetchingLocation) && { opacity: 0.8 }
            ]}
          >
            {isFetchingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="locate" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.locationBtnText, { color: colors.primary }]}>Use Current Location</Text>
              </>
            )}
          </Pressable>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Contact Details</Text>

          {/* Recipient Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Recipient Name *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Aditya Kumar"
              placeholderTextColor={colors.textMuted}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Address Details</Text>

          {/* House / Flat */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Flat, House No., Building *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Flat 402, Shivam Heights"
              placeholderTextColor={colors.textMuted}
              value={houseFlat}
              onChangeText={setHouseFlat}
            />
          </View>

          {/* Street / Area */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Area, Street, Sector *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Sector 15, Vashi"
              placeholderTextColor={colors.textMuted}
              value={streetArea}
              onChangeText={setStreetArea}
            />
          </View>

          {/* Landmark */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Landmark (Optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Near Station"
              placeholderTextColor={colors.textMuted}
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          <View style={styles.row}>
            {/* City */}
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>City *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Navi Mumbai"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            {/* State */}
            <View style={[styles.inputGroup, { width: '48%' }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>State *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Maharashtra"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Pincode / Postal Code *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="6-digit pincode"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </View>

          {/* Address Label */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Address Label</Text>
            <View style={styles.labelPicker}>
              {LABELS.map(lbl => (
                <Pressable
                  key={lbl}
                  onPress={() => setLabel(lbl)}
                  style={[
                    styles.labelOption,
                    label === lbl ? { backgroundColor: colors.primary } : { borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.labelOptionText, label === lbl ? { color: '#fff' } : { color: colors.text }]}>
                    {lbl}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes / Instructions */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Delivery Instructions (e.g. Ring Bell)</Text>
            <TextInput
              multiline
              numberOfLines={3}
              style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Ring doorbell or leave package at reception"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary },
              (pressed || isSaving) && { opacity: 0.9 }
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Delivery Address</Text>
            )}
          </Pressable>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'ios' ? 0 : 30,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  locationBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelPicker: {
    flexDirection: 'row',
    marginTop: 4,
  },
  labelOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  labelOptionText: {
    fontSize: 13,
    fontWeight: '700',
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
