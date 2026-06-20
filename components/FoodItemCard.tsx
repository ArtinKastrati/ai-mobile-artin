import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { MenuItem, Restaurant } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { haptics } from '@/lib/haptics';
import { usePreferences } from '@/context/PreferencesContext';
import { CustomizationSheet } from './CustomizationSheet';

type Props = {
  item: MenuItem;
  restaurant: Restaurant;
};

export function FoodItemCard({ item, restaurant }: Props) {
  const colors = useColors();
  const { t } = usePreferences();
  const { addItem, items, restaurant: cartRestaurant, clearAndAddItem } = useCart();
  const [customizerVisible, setCustomizerVisible] = useState(false);

  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;
  const totalQuantity = items
    .filter((i) => i.menuItem.id === item.id)
    .reduce((sum, i) => sum + i.quantity, 0);

  const handleAdd = () => {
    haptics.light();
    if (hasModifiers) {
      setCustomizerVisible(true);
      return;
    }
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      Alert.alert(
        t('cart.conflictTitle') || 'Start a new basket?',
        (t('cart.conflictBody') || 'Adding items from {newRest} will clear your current basket from {oldRest}.')
          .replace('{newRest}', restaurant.name)
          .replace('{oldRest}', cartRestaurant.name),
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          { 
            text: t('cart.conflictConfirm') || 'Yes, start new basket', 
            style: 'destructive',
            onPress: () => {
              haptics.heavy();
              clearAndAddItem(item, restaurant);
            } 
          }
        ]
      );
    } else {
      addItem(item, restaurant);
    }
  };

  const handleCardPress = () => {
    if (hasModifiers) {
      haptics.light();
      setCustomizerVisible(true);
    }
  };

  const CardComponent = hasModifiers ? TouchableOpacity : View;

  return (
    <>
      <CardComponent 
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={hasModifiers ? handleCardPress : undefined}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <View style={styles.textSection}>
            {item.popular && (
              <View style={[styles.popularBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.popularText, { color: colors.primary }]}>{t('restaurant.popular')}</Text>
              </View>
            )}
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[styles.price, { color: colors.foreground }]}>
              ${item.price.toFixed(2)}
            </Text>
          </View>
          <View style={styles.imageSection}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
            {totalQuantity > 0 && (
              <View style={[styles.quantityBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.quantityText}>{totalQuantity}</Text>
              </View>
            )}
          </View>
        </View>
      </CardComponent>

      {hasModifiers && (
        <CustomizationSheet
          visible={customizerVisible}
          onClose={() => setCustomizerVisible(false)}
          item={item}
          restaurant={restaurant}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' } as any,
    }),
  },
  content: { flexDirection: 'row', gap: 12 },
  textSection: { flex: 1, justifyContent: 'center' },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  popularText: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 4, lineHeight: 20 },
  description: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  price: { fontSize: 15, fontWeight: '800' },
  imageSection: { position: 'relative' },
  image: { width: 100, height: 100, borderRadius: 12 },
  addButton: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
