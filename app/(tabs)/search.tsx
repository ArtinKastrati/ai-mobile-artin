import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { RestaurantCard } from '@/components/RestaurantCard';
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { haptics } from '@/lib/haptics';

const TRENDING_KEYS = ['burger', 'pizza', 'sushi', 'salad', 'coffee', 'dessert'];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { restaurants } = useData();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q)
    );
  }, [query, restaurants]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('search.title')}</Text>
        <View style={[
          styles.searchBar,
          {
            backgroundColor: colors.background,
            borderColor: isFocused ? colors.primary : colors.border,
            borderWidth: 1.5,
          }
        ]}>
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

      <FlatList
        data={query.trim() ? results : []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          !query.trim() ? (
            <View style={styles.trending}>
              <Text style={[styles.trendingTitle, { color: colors.foreground }]}>🔍 {t('search.categories')}</Text>
              <View style={styles.trendingTags}>
                {TRENDING_KEYS.map((key) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      haptics.light();
                      setQuery(t('home.categories.' + key));
                    }}
                    style={[styles.tag, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>{t('home.categories.' + key)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => {
              haptics.medium();
              router.push(`/restaurant/${item.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          query.trim() ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('search.noResults')}</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {t('search.trySearchingElse')}
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
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
  list: { padding: 20, paddingBottom: 100 },
  trending: { marginBottom: 24 },
  trendingTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', marginBottom: 14 },
  trendingTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
  },
  tagText: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center' },
});
