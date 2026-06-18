import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RESTAURANTS } from '@/data/mockData';

const TRENDING = ['Burgers', 'Pizza', 'Sushi', 'Salads', 'Coffee', 'Desserts'];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Restaurants, cuisines..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
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
              <Text style={[styles.trendingTitle, { color: colors.foreground }]}>🔍 Trending</Text>
              <View style={styles.trendingTags}>
                {TRENDING.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setQuery(tag)}
                    style={[styles.tag, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => router.push(`/restaurant/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          query.trim() ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={44} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Try "{query}" with a different spelling
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
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
