import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCart } from '@/context/CartContext';
import { Image } from 'expo-image';
import { haptics } from '@/lib/haptics';
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { promoCode: promoParam } = useLocalSearchParams<{ promoCode?: string }>();
  const { session } = useAuth();
  const { addresses, paymentMethods, addOrder } = useData();
  const { items, restaurant, total, clearCart } = useCart();

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('cod'); // 'cod' or card ID
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNoteFocused, setIsNoteFocused] = useState(false);

  // Promo states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoFocused, setIsPromoFocused] = useState(false);

  useEffect(() => {
    if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses]);

  useEffect(() => {
    const code = typeof promoParam === 'string' ? promoParam.trim().toUpperCase() : '';
    if (code === 'FAST20' || code === 'FREE') {
      setPromoCode(code);
      setAppliedPromo(code);
      setPromoError(null);
    }
  }, [promoParam]);

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const deliveryFeeFinal = appliedPromo === 'FREE' ? 0 : deliveryFee;
  const discountValue = appliedPromo === 'FAST20' ? total * 0.20 : 0;
  const grandTotal = Math.max(0, total + deliveryFeeFinal - discountValue);

  const handleApplyPromo = () => {
    haptics.medium();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'FAST20') {
      setAppliedPromo('FAST20');
      setPromoError(null);
    } else if (code === 'FREE') {
      setAppliedPromo('FREE');
      setPromoError(null);
    } else {
      setPromoError(t('checkout.invalidPromoCode'));
      setAppliedPromo(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (!session) {
      Alert.alert(
        'Sign In Required',
        'You need to be signed in to place an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') },
        ]
      );
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress) {
      Alert.alert(t('checkout.addressRequired'), t('checkout.pleaseEnterAddress'));
      return;
    }

    if (restaurant && total < restaurant.minOrder) {
      Alert.alert(
        t('checkout.minOrderTitle'),
        t('checkout.minOrderMessage', { min: restaurant.minOrder.toFixed(2) })
      );
      return;
    }

    const selectedPay = paymentMethods.find((pm) => pm.id === selectedPaymentId);
    const paymentLabel = selectedPay
      ? `${selectedPay.cardType} •••• ${selectedPay.cardNumber.slice(-4)}`
      : t('checkout.cashOnDelivery');

    haptics.heavy();
    setLoading(true);

    const orderItems = items.map((item) => {
      const mods = item.selectedModifiers && item.selectedModifiers.length > 0
        ? ` (${item.selectedModifiers.map(m => m.choiceName).join(', ')})`
        : '';
      const notes = item.specialInstructions ? ` [Notes: ${item.specialInstructions}]` : '';
      return `${item.menuItem.name}${mods}${notes} x${item.quantity}`;
    });
    
    const itemsRaw = items.map((item) => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
      selectedModifiers: item.selectedModifiers,
      specialInstructions: item.specialInstructions,
    }));

    addOrder(
      restaurant?.id ?? '1',
      orderItems,
      grandTotal,
      selectedAddress.label,
      selectedAddress.details,
      discountValue > 0 ? discountValue : undefined,
      appliedPromo || undefined,
      paymentLabel,
      itemsRaw
    );

    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    clearCart();
    Alert.alert(
      t('checkout.orderPlaced'),
      t('checkout.orderConfirmed', { name: restaurant?.name ?? '', time: restaurant?.deliveryTime ?? '' }),
      [{ text: t('checkout.trackOrder'), onPress: () => { router.replace('/(tabs)/orders'); } }]
    );
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('checkout.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('checkout.orderSummary')}</Text>
          {items.map((item) => {
            const modifiersCost = item.selectedModifiers?.reduce((sum, m) => sum + m.price, 0) || 0;
            const singleItemPrice = item.menuItem.price + modifiersCost;
            return (
              <View key={item.id} style={styles.orderItem}>
                <Image source={{ uri: item.menuItem.imageUrl }} style={styles.itemImg} contentFit="cover" />
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.menuItem.name}
                  </Text>
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1, fontFamily: 'Nunito_400Regular' }}>
                      {item.selectedModifiers.map(m => m.choiceName).join(' · ')}
                    </Text>
                  )}
                  {item.specialInstructions ? (
                    <Text style={{ fontSize: 11, color: colors.muted, fontStyle: 'italic', marginTop: 1, fontFamily: 'Nunito_400Regular' }} numberOfLines={1}>
                      "{item.specialInstructions}"
                    </Text>
                  ) : null}
                  <Text style={[styles.itemQty, { color: colors.muted, marginTop: 2 }]}>× {item.quantity}</Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                  ${(singleItemPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Address Selector */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('checkout.deliveryAddress')}</Text>
            <TouchableOpacity onPress={() => { haptics.light(); router.push('/profile/addresses'); }}>
              <Text style={[styles.manageText, { color: colors.primary }]}>
                {addresses.length > 0 ? t('common.manage') : t('addresses.addNew')}
              </Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity
              onPress={() => {
                haptics.medium();
                router.push('/profile/addresses');
              }}
              style={[styles.noAddressBtn, { borderColor: colors.primary }]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.noAddressText, { color: colors.primary }]}>{t('addresses.addNew')}</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressScroll}>
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => {
                      haptics.light();
                      setSelectedAddressId(addr.id);
                    }}
                    style={[
                      styles.checkoutAddressCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={styles.addressLabelRow}>
                      <Ionicons
                        name={
                          addr.label.toLowerCase().includes('home') || addr.label.includes('🏠')
                            ? 'home'
                            : addr.label.toLowerCase().includes('work') || addr.label.includes('🏢')
                            ? 'business'
                            : 'location'
                        }
                        size={14}
                        color={isSelected ? colors.primary : colors.muted}
                      />
                      <Text style={[styles.checkoutAddressLabel, { color: colors.foreground }]} numberOfLines={1}>
                        {addr.label}
                      </Text>
                    </View>
                    <Text style={[styles.checkoutAddressDetails, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {addr.details}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('checkout.driverNote')}</Text>
          <View
            style={[
              styles.inputWrapper,
              {
                borderColor: isNoteFocused ? colors.primary : colors.border,
                backgroundColor: colors.background,
                borderWidth: 1.5,
              },
            ]}
          >
            <Ionicons name="chatbubble-outline" size={18} color={isNoteFocused ? colors.primary : colors.muted} style={{ marginTop: 2 }} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder={t('checkout.driverNotePlaceholder')}
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              multiline
              onFocus={() => setIsNoteFocused(true)}
              onBlur={() => setIsNoteFocused(false)}
            />
          </View>
        </View>

        {/* Promo Codes */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('checkout.promoCode')}
          </Text>
          <View style={styles.promoRow}>
            <View
              style={[
                styles.promoInputWrapper,
                {
                  borderColor: isPromoFocused ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Ionicons name="gift-outline" size={18} color={isPromoFocused ? colors.primary : colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground, minHeight: 38 }]}
                placeholder={t('checkout.promoPlaceholder')}
                placeholderTextColor={colors.muted}
                value={promoCode}
                onChangeText={(val) => {
                  setPromoCode(val);
                  setPromoError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                onFocus={() => setIsPromoFocused(true)}
                onBlur={() => setIsPromoFocused(false)}
              />
            </View>
            <TouchableOpacity
              onPress={handleApplyPromo}
              style={[styles.promoApplyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.promoApplyBtnText}>
                {t('common.apply')}
              </Text>
            </TouchableOpacity>
          </View>
          {appliedPromo ? (
            <View style={styles.promoSuccessRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.promoSuccessText, { color: colors.success }]}>
                {appliedPromo === 'FAST20'
                  ? t('checkout.fast20Applied')
                  : t('checkout.freeApplied')}
              </Text>
            </View>
          ) : null}
          {promoError ? (
            <Text style={[styles.promoErrorText, { color: colors.error }]}>{promoError}</Text>
          ) : null}
        </View>

        {/* Payment Methods Selector */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('checkout.payment')}</Text>
            <TouchableOpacity onPress={() => { haptics.light(); router.push('/profile/payment'); }}>
              <Text style={[styles.manageText, { color: colors.primary }]}>
                {paymentMethods.length > 0 ? t('common.manage') : t('payment.addNew')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressScroll}>
            {/* Cash on Delivery Option */}
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setSelectedPaymentId('cod');
              }}
              style={[
                styles.checkoutPaymentCard,
                {
                  backgroundColor: colors.background,
                  borderColor: selectedPaymentId === 'cod' ? colors.primary : colors.border,
                  borderWidth: selectedPaymentId === 'cod' ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.addressLabelRow}>
                <Ionicons name="cash-outline" size={16} color={selectedPaymentId === 'cod' ? colors.primary : colors.muted} />
                <Text style={[styles.checkoutAddressLabel, { color: colors.foreground }]}>
                  {t('checkout.codShort')}
                </Text>
              </View>
              <Text style={[styles.checkoutAddressDetails, { color: colors.mutedForeground }]} numberOfLines={1}>
                {t('checkout.cashOnDelivery')}
              </Text>
            </TouchableOpacity>

            {/* Saved Credit Cards */}
            {paymentMethods.map((pm) => {
              const isSelected = selectedPaymentId === pm.id;
              return (
                <TouchableOpacity
                  key={pm.id}
                  onPress={() => {
                    haptics.light();
                    setSelectedPaymentId(pm.id);
                  }}
                  style={[
                    styles.checkoutPaymentCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.addressLabelRow}>
                    <Ionicons
                      name="card-outline"
                      size={16}
                      color={isSelected ? colors.primary : colors.muted}
                    />
                    <Text style={[styles.checkoutAddressLabel, { color: colors.foreground }]} numberOfLines={1}>
                      {pm.cardType}
                    </Text>
                  </View>
                  <Text style={[styles.checkoutAddressDetails, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {pm.cardNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Totals Summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>{t('checkout.subtotal')}</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>${total.toFixed(2)}</Text>
          </View>

          {discountValue > 0 ? (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.success }]}>
                {t('checkout.discount')} ({appliedPromo})
              </Text>
              <Text style={[styles.totalValue, { color: colors.success }]}>
                -${discountValue.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>{t('checkout.deliveryFee')}</Text>
            <Text
              style={[
                styles.totalValue,
                { color: deliveryFeeFinal === 0 ? colors.success : colors.foreground },
              ]}
            >
              {deliveryFeeFinal === 0 ? t('checkout.free') : `$${deliveryFeeFinal.toFixed(2)}`}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.grandRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.grandLabel, { color: colors.foreground }]}>{t('checkout.total')}</Text>
            <Text style={[styles.grandValue, { color: colors.primary }]}>${grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          style={[styles.orderBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.orderBtnText}>{t('checkout.placeOrder', { total: '$' + grandTotal.toFixed(2) })}</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 12,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  section: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  manageText: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', marginBottom: 4 },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImg: { width: 44, height: 44, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  itemQty: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  itemPrice: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  addressScroll: { gap: 12, paddingVertical: 4 },
  checkoutAddressCard: {
    width: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  checkoutPaymentCard: {
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkoutAddressLabel: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  checkoutAddressDetails: { fontSize: 12, fontFamily: 'Nunito_400Regular', lineHeight: 16 },
  noAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  noAddressText: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  inputWrapper: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 10,
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Nunito_400Regular', minHeight: 40, paddingVertical: Platform.OS === 'ios' ? 4 : 0 },
  promoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  promoInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  promoApplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  promoApplyBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  promoSuccessRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  promoSuccessText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  promoErrorText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', marginTop: -4 },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  payIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payLabel: { flex: 1, fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  selectedDot: { width: 18, height: 18, borderRadius: 9 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
  totalValue: { fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  grandRow: { marginTop: 4, paddingTop: 10, borderTopWidth: 1 },
  grandLabel: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  grandValue: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  footer: { paddingHorizontal: 20, paddingTop: 16 },
  orderBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  orderBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Nunito_800ExtraBold' },
});
