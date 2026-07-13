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
  Platform,
  Modal,
  Switch
} from 'react-native';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const STATE_OPTIONS = [
  { id: 'delhi', name: 'Delhi' },
  { id: 'maharashtra', name: 'Maharashtra' },
  { id: 'karnataka', name: 'Karnataka' },
  { id: 'gujarat', name: 'Gujarat' },
  { id: 'tamil_nadu', name: 'Tamil Nadu' },
];

export default function CityManagement() {
  const systemScheme = useColorScheme();
  const theme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  // States
  const [cities, setCities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal / Add / Edit state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [cityName, setCityName] = useState('');
  const [stateId, setStateId] = useState('delhi');
  const [enabled, setEnabled] = useState(true);

  // Status banners
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const snap = await getDocs(collection(db, 'cities'));
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });

      if (list.length === 0) {
        // Auto-seed a few sample service areas if empty
        const defaultCities = [
          { id: 'delhi_new_delhi', name: 'New Delhi', stateId: 'delhi', stateName: 'Delhi', enabled: true },
          { id: 'maharashtra_mumbai', name: 'Mumbai', stateId: 'maharashtra', stateName: 'Maharashtra', enabled: true },
          { id: 'karnataka_bengaluru', name: 'Bengaluru', stateId: 'karnataka', stateName: 'Karnataka', enabled: true },
        ];
        for (const item of defaultCities) {
          await setDoc(doc(db, 'cities', item.id), {
            name: item.name,
            stateId: item.stateId,
            stateName: item.stateName,
            enabled: item.enabled,
            createdAt: new Date().toISOString()
          });
          list.push(item);
        }
      }
      setCities(list);
    } catch (e: any) {
      setErrorMsg('Failed to load cities: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCity(null);
    setCityName('');
    setStateId('delhi');
    setEnabled(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (city: any) => {
    setEditingCity(city);
    setCityName(city.name);
    setStateId(city.stateId || 'delhi');
    setEnabled(city.enabled !== false);
    setErrorMsg('');
    setSuccessMsg('');
    setShowAddEditModal(true);
  };

  const handleSaveCity = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!cityName.trim()) {
      setErrorMsg('City name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const stateName = STATE_OPTIONS.find(s => s.id === stateId)?.name || 'Unknown';
      const cityId = editingCity?.id || `${stateId}_${cityName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      const payload = {
        name: cityName.trim(),
        stateId,
        stateName,
        enabled,
        updatedAt: new Date().toISOString()
      };

      if (editingCity) {
        // Edit
        await updateDoc(doc(db, 'cities', editingCity.id), payload);
        setSuccessMsg('Service area updated successfully!');
      } else {
        // Add
        // Check duplicate
        if (cities.find(c => c.id === cityId)) {
          setErrorMsg('This service area already exists.');
          setIsSaving(false);
          return;
        }
        await setDoc(doc(db, 'cities', cityId), {
          ...payload,
          id: cityId,
          createdAt: new Date().toISOString()
        });
        setSuccessMsg('Service area created successfully!');
      }

      setTimeout(() => {
        setShowAddEditModal(false);
        fetchCities();
      }, 1000);

    } catch (e: any) {
      setErrorMsg('Failed to save service area: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCity = (city: any) => {
    Alert.alert(
      'Delete Service Area',
      `Are you sure you want to remove "${city.name}"? This city will no longer be serviced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteDoc(doc(db, 'cities', city.id));
              setSuccessMsg('Service area deleted successfully.');
              fetchCities();
            } catch (e: any) {
              setErrorMsg('Failed to delete service area: ' + e.message);
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleEnable = async (city: any) => {
    const newStatus = !city.enabled;
    try {
      await updateDoc(doc(db, 'cities', city.id), { enabled: newStatus });
      // Update local state instantly for positive UX
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, enabled: newStatus } : c));
    } catch (e: any) {
      setErrorMsg('Failed to toggle status: ' + e.message);
    }
  };

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.stateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Service Areas / Cities</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Manage active service coverage</Text>
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
          <Text style={styles.addBtnText}>Add City</Text>
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

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by city or state..."
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

      {/* Cities list view */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading cities...</Text>
        </View>
      ) : filteredCities.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="location-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No service areas found.</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredCities.map((item) => (
            <View
              key={item.id}
              style={[
                styles.cityCard,
                { backgroundColor: colors.card, borderColor: colors.border, ...Shadows.light }
              ]}
            >
              <View style={styles.cityInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.cityName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.stateTag, { backgroundColor: colors.primaryLight, color: colors.primary }]}>
                    {item.stateName}
                  </Text>
                </View>
                <Text style={[styles.cityId, { color: colors.textMuted }]}>ID: {item.id}</Text>
              </View>
              
              <View style={styles.actionsRow}>
                {/* Switch toggle to enable/disable service area */}
                <View style={styles.switchContainer}>
                  <Switch
                    value={item.enabled !== false}
                    onValueChange={() => handleToggleEnable(item)}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={item.enabled !== false ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.switchLabel, { color: item.enabled !== false ? colors.success : colors.textMuted }]}>
                    {item.enabled !== false ? 'Active' : 'Disabled'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleOpenEdit(item)}
                  style={[styles.iconAction, { borderColor: colors.border }]}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                </Pressable>
                
                <Pressable
                  onPress={() => handleDeleteCity(item)}
                  style={[styles.iconAction, { borderColor: colors.border }]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={showAddEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCity ? 'Edit Service Area' : 'Add Service Area'}
              </Text>
              <Pressable onPress={() => setShowAddEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {errorMsg ? (
              <Text style={[styles.modalError, { color: colors.error }]}>{errorMsg}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>City Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Navi Mumbai"
                placeholderTextColor={colors.textMuted}
                value={cityName}
                onChangeText={setCityName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>State / Region</Text>
              <View style={[styles.selectBox, { borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {STATE_OPTIONS.map(s => (
                    <Pressable
                      key={s.id}
                      onPress={() => setStateId(s.id)}
                      style={[styles.selectOption, stateId === s.id ? { backgroundColor: colors.primaryLight } : null]}
                    >
                      <Text style={[styles.selectOptionText, { color: stateId === s.id ? colors.primary : colors.text }]}>{s.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.statusGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Service Status (Active / Disabled)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Switch
                  value={enabled}
                  onValueChange={setEnabled}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={enabled ? colors.primary : colors.textMuted}
                />
                <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '700', color: enabled ? colors.success : colors.textMuted }}>
                  {enabled ? 'Active Service Area' : 'Disabled Service Area'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleSaveCity}
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
                <Text style={styles.saveBtnText}>Save Service Area</Text>
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
    fontWeight: '600',
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
  cityCard: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cityInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  stateTag: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    textTransform: 'uppercase',
  },
  cityId: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'web' ? 0 : Spacing.md,
    justifyContent: 'flex-end',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    width: 50,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
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
  statusGroup: {
    marginBottom: Spacing.md,
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
