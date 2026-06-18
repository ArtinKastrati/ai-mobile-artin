import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCart } from '@/context/CartContext';
import { Image } from 'expo-image';
import { haptics } from '@/lib/haptics';

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, restaurant, total, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const grandTotal = total + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter your delivery address.');
      return;
    }
    haptics.heavy();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    clearCart();
    Alert.alert(
      'Order Placed!',
      `Your order from ${restaurant?.name} has been confirmed. Estimated delivery: ${restaurant?.deliveryTime}.`,
      [{ text: 'Track Order', onPress: () => { router.replace('/(tabs)/orders'); } }]
    );
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.menuItem.id} style={styles.orderItem}>
              <Image source={{ uri: item.menuItem.imageUrl }} style={styles.itemImg} contentFit="cover" />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.menuItem.name}
                </Text>
                <Text style={[styles.itemQty, { color: colors.muted }]}>× {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                ${(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Address</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="location-outline" size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Enter your delivery address"
              placeholderTextColor={colors.muted}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Note for driver</Text>
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Leave at door, ring bell, etc."
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment</Text>
          <View style={[styles.paymentRow, { borderColor: colors.border }]}>
            <View style={[styles.payIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.payLabel, { color: colors.foreground }]}>Cash on Delivery</Text>
            <View style={[styles.selectedDot, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Subtotal</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>${total.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Delivery fee</Text>
            <Text style={[styles.totalValue, { color: deliveryFee === 0 ? colors.success : colors.foreground }]}>
              {deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={[styles.grandLabel, { color: colors.foreground }]}>Total</Text>
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
            <Text style={styles.orderBtnText}>Place Order · ${grandTotal.toFixed(2)}</Text>
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
  sectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', marginBottom: 4 },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImg: { width: 44, height: 44, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  itemQty: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  itemPrice: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  inputWrapper: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Nunito_400Regular', minHeight: 40 },
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
  grandRow: { marginTop: 4 },
  grandLabel: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  grandValue: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  footer: { paddingHorizontal: 20, paddingTop: 16 },
  orderBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  orderBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Nunito_800ExtraBold' },
});
