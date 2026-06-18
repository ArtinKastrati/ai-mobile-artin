import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SectionList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { FoodItemCard } from '@/components/FoodItemCard';
import { CartButton } from '@/components/CartButton';
import { CartSheet } from '@/components/CartSheet';
import { RESTAURANTS, MENU_ITEMS } from '@/data/mockData';

export default function RestaurantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cartVisible, setCartVisible] = useState(false);

  const restaurant = RESTAURANTS.find((r) => r.id === id);
  const items = MENU_ITEMS.filter((m) => m.restaurantId === id);

  // Group items by category
  const categories = [...new Set(items.map((i) => i.category))];
  const sections = categories.map((cat) => ({
    title: cat,
    data: items.filter((i) => i.category === cat),
  }));

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>Restaurant not found</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <Image
                source={{ uri: restaurant.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
              />
              {/* Back button */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backBtn, { top: topPadding + 12 }]}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.restaurantName, { color: colors.foreground }]}>
                {restaurant.name}
              </Text>
              <Text style={[styles.cuisine, { color: colors.muted }]}>{restaurant.cuisine}</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {restaurant.description}
              </Text>

              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="star" size={14} color={colors.accent} />
                  <Text style={[styles.badgeText, { color: colors.foreground }]}>
                    {restaurant.rating} ({restaurant.reviewCount})
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={[styles.badgeText, { color: colors.foreground }]}>
                    {restaurant.deliveryTime}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: restaurant.deliveryFee === 0 ? '#E8F8EE' : colors.primaryLight }]}>
                  <Ionicons
                    name="bicycle-outline"
                    size={14}
                    color={restaurant.deliveryFee === 0 ? colors.success : colors.primary}
                  />
                  <Text style={[styles.badgeText, { color: restaurant.deliveryFee === 0 ? colors.success : colors.foreground }]}>
                    {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.menuHeader, { color: colors.foreground }]}>Menu</Text>
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <FoodItemCard item={item} restaurant={restaurant} />
          </View>
        )}
      />

      <CartButton onPress={() => setCartVisible(true)} />
      <CartSheet visible={cartVisible} onClose={() => setCartVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { position: 'relative' },
  heroImage: { width: '100%', height: 260 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    margin: 16,
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
    }),
  },
  restaurantName: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', marginBottom: 4 },
  cuisine: { fontSize: 14, fontFamily: 'Nunito_400Regular', marginBottom: 8 },
  description: { fontSize: 13, fontFamily: 'Nunito_400Regular', lineHeight: 19, marginBottom: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  menuHeader: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', paddingHorizontal: 20, marginTop: 4, marginBottom: 4 },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold' },
});
