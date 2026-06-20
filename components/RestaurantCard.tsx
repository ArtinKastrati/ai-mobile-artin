import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Restaurant } from '@/data/mockData';
import { usePreferences } from '@/context/PreferencesContext';

type Props = {
  restaurant: Restaurant;
  onPress: () => void;
  featured?: boolean;
};

export function RestaurantCard({ restaurant, onPress, featured }: Props) {
  const colors = useColors();
  const { t } = usePreferences();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.card, featured && styles.featuredCard, { backgroundColor: colors.card }]}
    >
      <Image
        source={{ uri: restaurant.imageUrl }}
        style={[styles.image, featured && styles.featuredImage]}
        contentFit="cover"
        transition={300}
      />
      {restaurant.deliveryFee === 0 && (
        <View style={[styles.badge, { backgroundColor: colors.success }]}>
          <Text style={styles.badgeText}>{t('restaurant.freeDelivery')}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={[styles.cuisine, { color: colors.muted }]} numberOfLines={1}>
          {restaurant.cuisine} · {restaurant.priceRange}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={13} color={colors.accent} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>
              {restaurant.rating}
            </Text>
            <Text style={[styles.metaTextMuted, { color: colors.muted }]}>
              ({restaurant.reviewCount})
            </Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {restaurant.deliveryTime}
            </Text>
          </View>
          {restaurant.deliveryFee > 0 && (
            <>
              <View style={styles.dot} />
              <Text style={[styles.metaText, { color: colors.muted }]}>
                {t('restaurant.delivery', { fee: '$' + restaurant.deliveryFee.toFixed(2) })}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    }),
  },
  featuredCard: { marginRight: 16, width: 280 },
  image: { width: '100%', height: 160 },
  featuredImage: { height: 180 },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  info: { padding: 14 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  cuisine: { fontSize: 13, marginBottom: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, fontWeight: '600' },
  metaTextMuted: { fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#C7C7CC' },
});
