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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useData, PaymentMethod } from '@/context/DataContext';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';

export default function PaymentMethodsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { paymentMethods, addPaymentMethod, deletePaymentMethod } = useData();

  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Input focus highlights
  const [focusedField, setFocusedField] = useState<'holder' | 'number' | 'expiry' | 'cvv' | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const openAddModal = () => {
    haptics.light();
    setCardholderName('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setModalVisible(true);
  };

  const handleCardNumberChange = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');
    // Limit to 16 digits
    const limited = cleaned.slice(0, 16);
    // Format in blocks of 4 digits
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 4);
    if (limited.length > 2) {
      setExpiryDate(`${limited.slice(0, 2)}/${limited.slice(2)}`);
    } else {
      setExpiryDate(limited);
    }
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.slice(0, 3));
  };

  const handleSubmit = () => {
    const cleanNum = cardNumber.replace(/\s/g, '');
    const cleanExp = expiryDate.trim();
    const cleanCvv = cvv.trim();

    if (!cardholderName.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (cleanNum.length !== 16) {
      Alert.alert(t('common.error'), t('payment.invalidCard'));
      return;
    }

    // Expiry date validation (MM/YY)
    const expRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expRegex.test(cleanExp)) {
      Alert.alert(t('common.error'), t('payment.invalidExpiry'));
      return;
    }

    if (cleanCvv.length !== 3) {
      Alert.alert(t('common.error'), t('payment.invalidCvv'));
      return;
    }

    haptics.heavy();
    addPaymentMethod({
      cardholderName: cardholderName.trim(),
      cardNumber: cleanNum,
      expiryDate: cleanExp,
    });

    setModalVisible(false);
  };

  const handleDeleteCard = (id: string) => {
    haptics.medium();
    Alert.alert(
      t('payment.deleteCard'),
      t('payment.deleteCardConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('payment.delete'),
          style: 'destructive',
          onPress: () => {
            haptics.heavy();
            deletePaymentMethod(id);
          },
        },
      ]
    );
  };

  const getCardGradientColors = (type: PaymentMethod['cardType']): [string, string] => {
    if (type === 'Visa') {
      return ['#1E3C72', '#2A5298']; // Visa blue
    }
    if (type === 'Mastercard') {
      return ['#C31432', '#240B36']; // Mastercard red/burgundy
    }
    return ['#3E5151', '#DECBA4']; // Generic gold/slate
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
        <Text style={[styles.title, { color: colors.foreground }]}>{t('payment.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Credit Cards list */}
      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={getCardGradientColors(item.cardType)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creditCardBackground}
            >
              <View style={styles.creditCardHeader}>
                <Text style={styles.creditCardVendor}>
                  {item.cardType === 'Visa' ? 'VISA' : item.cardType === 'Mastercard' ? 'mastercard' : 'CARD'}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteCard(item.id)} style={styles.cardDeleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.creditCardNumber}>{item.cardNumber}</Text>
              <View style={styles.creditCardFooter}>
                <View>
                  <Text style={styles.cardFooterLabel}>CARDHOLDER</Text>
                  <Text style={styles.cardFooterValue} numberOfLines={1}>{item.cardholderName.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardFooterLabel}>EXPIRES</Text>
                  <Text style={styles.cardFooterValue}>{item.expiryDate}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('payment.emptyTitle')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t('payment.emptyDesc')}
            </Text>
          </View>
        }
      />

      {/* Floating Add Card button */}
      <TouchableOpacity
        onPress={openAddModal}
        style={[styles.floatingBtn, { backgroundColor: colors.primary, bottom: insets.bottom + 20 }]}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.floatingBtnText}>{t('payment.addNew')}</Text>
      </TouchableOpacity>

      {/* Add Card Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('payment.addNew')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('payment.cardholder')} *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'holder' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'holder' ? 1.5 : 1,
                    },
                  ]}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  onFocus={() => setFocusedField('holder')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('payment.cardNumber')} *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'number' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'number' ? 1.5 : 1,
                    },
                  ]}
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={colors.muted}
                  onFocus={() => setFocusedField('number')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.expiryCvvRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('payment.expiry')} *</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.foreground,
                        backgroundColor: colors.card,
                        borderColor: focusedField === 'expiry' ? colors.primary : colors.border,
                        borderWidth: focusedField === 'expiry' ? 1.5 : 1,
                      },
                    ]}
                    keyboardType="numeric"
                    value={expiryDate}
                    onChangeText={handleExpiryChange}
                    placeholder={t('payment.expiryPlaceholder')}
                    placeholderTextColor={colors.muted}
                    onFocus={() => setFocusedField('expiry')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('payment.cvv')} *</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.foreground,
                        backgroundColor: colors.card,
                        borderColor: focusedField === 'cvv' ? colors.primary : colors.border,
                        borderWidth: focusedField === 'cvv' ? 1.5 : 1,
                      },
                    ]}
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvv}
                    onChangeText={handleCvvChange}
                    placeholder="123"
                    placeholderTextColor={colors.muted}
                    onFocus={() => setFocusedField('cvv')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
              >
                <Text style={styles.submitBtnText}>{t('payment.saveCard')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
  list: { padding: 20, gap: 16 },
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  creditCardBackground: {
    padding: 22,
    height: 180,
    justifyContent: 'space-between',
  },
  creditCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creditCardVendor: { color: '#fff', fontSize: 22, fontFamily: 'Nunito_800ExtraBold', fontStyle: 'italic', letterSpacing: 1 },
  cardDeleteBtn: { padding: 4 },
  creditCardNumber: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold', letterSpacing: 2, marginVertical: 14 },
  creditCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardFooterLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontFamily: 'Nunito_700Bold', letterSpacing: 0.5, marginBottom: 2 },
  cardFooterValue: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold', letterSpacing: 0.5 },
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
  expiryCvvRow: { flexDirection: 'row', gap: 16 },
  submitBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 14 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
});
