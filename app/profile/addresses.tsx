import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useData, Address } from '@/context/DataContext';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';
import { MapPicker } from '@/components/MapPicker';

export default function AddressesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { addresses, addAddress, updateAddress, deleteAddress } = useData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form Fields
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [notes, setNotes] = useState('');

  // Active input focus states
  const [focusedField, setFocusedField] = useState<'label' | 'details' | 'notes' | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const openAddModal = () => {
    haptics.light();
    setEditingAddress(null);
    setLabel('');
    setDetails('');
    setNotes('');
    setModalVisible(true);
  };

  const openEditModal = (address: Address) => {
    haptics.light();
    setEditingAddress(address);
    setLabel(address.label);
    setDetails(address.details);
    setNotes(address.notes || '');
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!label.trim() || !details.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    haptics.heavy();

    const payload = {
      label: label.trim(),
      details: details.trim(),
      notes: notes.trim() || undefined,
    };

    if (editingAddress) {
      updateAddress({ ...payload, id: editingAddress.id });
    } else {
      addAddress(payload);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    haptics.medium();
    Alert.alert(
      t('addresses.deleteConfirm'),
      t('addresses.deleteConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.heavy();
            deleteAddress(id);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('addresses.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Address List */}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardInfo}>
              <View style={styles.labelRow}>
                <Ionicons
                  name={
                    item.label.toLowerCase().includes('home') || item.label.includes('🏠')
                      ? 'home-outline'
                      : item.label.toLowerCase().includes('work') || item.label.includes('🏢')
                      ? 'business-outline'
                      : 'location-outline'
                  }
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.cardLabel, { color: colors.foreground }]}>{item.label}</Text>
              </View>
              <Text style={[styles.cardDetails, { color: colors.mutedForeground }]}>{item.details}</Text>
              {item.notes ? (
                <Text style={[styles.cardNotes, { color: colors.muted }]} numberOfLines={1}>
                  💬 {item.notes}
                </Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('addresses.noAddresses')}</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>{t('addresses.addInstructions')}</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={openAddModal}
        style={[styles.floatingBtn, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.floatingBtnText}>{t('addresses.addNew')}</Text>
      </TouchableOpacity>

      {/* Edit/Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingAddress ? t('addresses.editAddress') : t('addresses.addNew')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              scrollEnabled={scrollEnabled}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 16 }}
            >
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('addresses.label')} *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'label' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'label' ? 1.5 : 1,
                    },
                  ]}
                  placeholder={t('addresses.labelPlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={label}
                  onChangeText={setLabel}
                  onFocus={() => setFocusedField('label')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Locate on Map</Text>
                <MapPicker
                  onAddressSelected={(address) => setDetails(address)}
                  onDragStateChange={(dragging) => setScrollEnabled(!dragging)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('addresses.details')} *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'details' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'details' ? 1.5 : 1,
                      minHeight: 60,
                    },
                  ]}
                  placeholder={t('addresses.detailsPlaceholder')}
                  placeholderTextColor={colors.muted}
                  multiline
                  value={details}
                  onChangeText={setDetails}
                  onFocus={() => setFocusedField('details')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('addresses.notes')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'notes' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'notes' ? 1.5 : 1,
                    },
                  ]}
                  placeholder={t('addresses.notesPlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={notes}
                  onChangeText={setNotes}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
              >
                <Text style={styles.submitBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  list: { padding: 16, gap: 12 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardInfo: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabel: { fontSize: 16, fontFamily: 'Nunito_700Bold' },
  cardDetails: { fontSize: 13, fontFamily: 'Nunito_400Regular', lineHeight: 18 },
  cardNotes: { fontSize: 12, fontFamily: 'Nunito_400Regular', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 20 },
  floatingBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 11, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  submitBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 14 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
});
