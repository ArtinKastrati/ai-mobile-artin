import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring, withSequence, useSharedValue } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useCart } from '@/context/CartContext';

type Props = {
  onPress: () => void;
};

export function CartButton({ onPress }: Props) {
  const colors = useColors();
  const { itemCount, total } = useCart();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (itemCount > 0) {
      scale.value = withSequence(
        withSpring(1.06, { damping: 12 }),
        withSpring(1, { damping: 12 })
      );
    }
  }, [itemCount]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (itemCount === 0) return null;

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
        <Ionicons name="bag-outline" size={22} color="#fff" />
        <Text style={styles.label}>View Cart</Text>
        <Text style={styles.price}>${total.toFixed(2)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 34 : 20,
    left: 20,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 16px rgba(255,107,53,0.35)' } as any,
    }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 10,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  label: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  price: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
