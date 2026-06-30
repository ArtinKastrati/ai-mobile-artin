import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { RestaurantCard } from '@/components/RestaurantCard';
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { haptics } from '@/lib/haptics';

const TRENDING_KEYS = [
  'burger', 'pizza', 'chicken', 'kebab', 'pasta', 'traditional', 'sushi', 'dessert', 'coffee',
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { restaurants, menuItems } = useData();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const results = useMemo(() => {
    if (!query.trim()) return { restaurants: [], dishes: [] };
    const q = query.toLowerCase();

    const matchedRestaurants = restaurants.filter(
      (r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
    );

    const matchedDishes = menuItems
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .slice(0, 20);

    return { restaurants: matchedRestaurants, dishes: matchedDishes };
  }, [query, restaurants, menuItems]);

  const hasResults = results.restaurants.length > 0 || results.dishes.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('search.title')}</Text>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.background,
              borderColor: isFocused ? colors.primary : colors.border,
              borderWidth: 1.5,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={isFocused ? colors.primary : colors.muted} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { haptics.light(); setQuery(''); }}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Empty / trending state */}
      {!query.trim() ? (
        <View style={styles.trending}>
          <Text style={[styles.trendingTitle, { color: colors.foreground }]}>🔍 {t('search.categories')}</Text>
          <View style={styles.trendingTags}>
            {TRENDING_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => { haptics.light(); setQuery(t(('home.categories.' + key) as any)); }}
                style={[styles.tag, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>{t(('home.categories.' + key) as any)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : !hasResults ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={44} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('search.noResults')}</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t('search.trySearchingElse')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {results.restaurants.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>RESTORANTET</Text>
              {results.restaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onPress={() => { haptics.medium(); router.push(`/restaurant/${r.id}`); }}
                />
              ))}
            </>
          )}
          {results.dishes.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground, marginTop: results.restaurants.length > 0 ? 16 : 0 }]}>
                USHQIMET
              </Text>
              {results.dishes.map((dish) => {
                const rest = restaurants.find((r) => r.id === dish.restaurantId);
                return (
                  <TouchableOpacity
                    key={dish.id}
                    onPress={() => { haptics.medium(); router.push(`/restaurant/${dish.restaurantId}`); }}
                    activeOpacity={0.88}
                    style={[styles.dishCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Image source={{ uri: dish.imageUrl }} style={styles.dishImg} contentFit="cover" />
                    <View style={styles.dishInfo}>
                      <Text style={[styles.dishName, { color: colors.foreground }]} numberOfLines={1}>{dish.name}</Text>
                      <Text style={[styles.dishRest, { color: colors.muted }]} numberOfLines={1}>{rest?.name ?? ''}</Text>
                      <Text style={[styles.dishDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{dish.description}</Text>
                    </View>
                    <Text style={[styles.dishPrice, { color: colors.primary }]}>€{dish.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Nunito_400Regular' },
  list: { padding: 16, paddingBottom: 100 },
  trending: { padding: 20, paddingTop: 24 },
  trendingTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', marginBottom: 14 },
  trendingTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1 },
  tagText: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center' },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dishImg: { width: 76, height: 76 },
  dishInfo: { flex: 1, paddingHorizontal: 12, gap: 2 },
  dishName: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  dishRest: { fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  dishDesc: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  dishPrice: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', paddingRight: 14 },
});
