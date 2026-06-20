import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCart } from '@/context/CartContext';
import { router } from 'expo-router';
import { haptics } from '@/lib/haptics';
import { usePreferences } from '@/context/PreferencesContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CartSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const { t } = usePreferences();
  const insets = useSafeAreaInsets();
  const { items, restaurant, updateQuantity, total } = useCart();

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const grandTotal = total + deliveryFee;

  const handleCheckout = () => {
    haptics.medium();
    onClose();
    router.push('/checkout');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 24 : 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('cart.title')}</Text>
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              onClose();
            }} 
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {restaurant && (
          <Text style={[styles.restaurantLabel, { color: colors.muted }]}>
            {t('cart.from', { name: restaurant.name })}
          </Text>
        )}

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 20 }}>
          {items.map((item) => {
            const modifiersCost = item.selectedModifiers?.reduce((sum, m) => sum + m.price, 0) || 0;
            const singleItemPrice = item.menuItem.price + modifiersCost;
            return (
              <View key={item.id} style={[styles.item, { backgroundColor: colors.card }]}>
                <Image
                  source={{ uri: item.menuItem.imageUrl }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
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
                  <Text style={[styles.itemPrice, { color: colors.primary, marginTop: 4 }]}>
                    ${(singleItemPrice * item.quantity).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      updateQuantity(item.id, item.quantity - 1);
                    }}
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="remove" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={[styles.qty, { color: colors.foreground }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      updateQuantity(item.id, item.quantity + 1);
                    }}
                    style={[styles.qtyBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card }]}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.muted }]}>{t('checkout.subtotal')}</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.muted }]}>{t('checkout.deliveryFee')}</Text>
              <Text style={[styles.totalValue, { color: deliveryFee === 0 ? colors.success : colors.foreground }]}>
                {deliveryFee === 0 ? t('checkout.free') : `$${deliveryFee.toFixed(2)}`}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={[styles.grandLabel, { color: colors.foreground }]}>{t('checkout.total')}</Text>
              <Text style={[styles.grandValue, { color: colors.primary }]}>${grandTotal.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCheckout}
            style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.88}
          >
            <Text style={styles.checkoutText}>{t('cart.checkout', { total: '$' + grandTotal.toFixed(2) })}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800' },
  closeBtn: { padding: 4 },
  restaurantLabel: { fontSize: 13, paddingHorizontal: 20, marginBottom: 12 },
  list: { flex: 1, paddingHorizontal: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 14, fontWeight: '700', minWidth: 16, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 16 },
  totals: { marginBottom: 16, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: '600' },
  grandTotalRow: { marginTop: 4 },
  grandLabel: { fontSize: 16, fontWeight: '800' },
  grandValue: { fontSize: 18, fontWeight: '800' },
  checkoutBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
