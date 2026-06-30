import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { haptics } from '@/lib/haptics';

export default function RestaurantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { restaurants, menuItems, favorites, toggleFavorite, reviews } = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cartVisible, setCartVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

  const restaurant = restaurants.find((r) => r.id === id);
  const items = menuItems.filter((m) => m.restaurantId === id);
  const restaurantReviews = reviews.filter((r) => r.restaurantId === id);

  // Group items by category
  const categories = [...new Set(items.map((i) => i.category))];
  
  const sections = activeTab === 'menu'
    ? categories.map((cat) => ({
        title: cat,
        data: items.filter((i) => i.category === cat),
        type: 'menu' as const,
      }))
    : [{ title: 'Reviews', data: restaurantReviews, type: 'reviews' as const }];

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>{t('restaurant.notFound')}</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections as any}
        keyExtractor={(item, index) => item.id || `idx_${index}`}
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
                onPress={() => {
                  haptics.light();
                  router.back();
                }}
                style={[styles.backBtn, { top: topPadding + 12 }]}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              {/* Favorite button */}
              <TouchableOpacity
                onPress={() => {
                  haptics.medium();
                  toggleFavorite(restaurant.id);
                }}
                style={[styles.favoriteBtn, { top: topPadding + 12 }]}
              >
                <Ionicons
                  name={favorites.includes(restaurant.id) ? 'heart' : 'heart-outline'}
                  size={22}
                  color={favorites.includes(restaurant.id) ? '#FF3B30' : '#fff'}
                />
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
                    {restaurant.deliveryFee === 0 ? t('restaurant.freeDelivery') : t('restaurant.delivery', { fee: '€' + restaurant.deliveryFee.toFixed(2) })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tab Selector */}
            <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setActiveTab('menu');
                }}
                style={[
                  styles.tabButton,
                  activeTab === 'menu' && { borderBottomColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: activeTab === 'menu' ? colors.primary : colors.muted },
                  ]}
                >
                  {t('restaurant.menu')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setActiveTab('reviews');
                }}
                style={[
                  styles.tabButton,
                  activeTab === 'reviews' && { borderBottomColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: activeTab === 'reviews' ? colors.primary : colors.muted },
                  ]}
                >
                  {t('restaurant.reviews')} ({restaurantReviews.length})
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderSectionHeader={({ section }) => {
          if ((section as any).type === 'reviews') return null;
          const displayTitle = t('home.categories.' + section.title.toLowerCase());
          const sectionTitle = displayTitle.startsWith('home.categories.') ? section.title : displayTitle;
          return (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{sectionTitle}</Text>
            </View>
          );
        }}
        renderItem={({ item, section }) => {
          if ((section as any).type === 'reviews') {
            const review = item as any;
            return (
              <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewUser, { color: colors.foreground }]}>{review.userName}</Text>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={12} color={colors.accent} />
                    <Text style={[styles.reviewRatingText, { color: colors.foreground }]}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewDate, { color: colors.muted }]}>{review.date}</Text>
                {review.comment ? (
                  <Text style={[styles.reviewComment, { color: colors.foreground }]}>{review.comment}</Text>
                ) : null}
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 16 }}>
              <FoodItemCard item={item} restaurant={restaurant} />
            </View>
          );
        }}
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
  favoriteBtn: {
    position: 'absolute',
    right: 16,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  sectionHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold' },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewRatingText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
});
