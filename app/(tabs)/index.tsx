import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { RestaurantCard } from '@/components/RestaurantCard';
import { CategoryPill } from '@/components/CategoryPill';
import { CartButton } from '@/components/CartButton';
import { CartSheet } from '@/components/CartSheet';
import { CATEGORIES, RESTAURANTS } from '@/data/mockData';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartVisible, setCartVisible] = useState(false);

  const featured = RESTAURANTS.filter((r) => r.featured);
  const filtered =
    selectedCategory === 'all'
      ? RESTAURANTS
      : RESTAURANTS.filter((r) => r.categories.includes(selectedCategory));

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={['#FF6B35', '#FF8C5A']}
          style={[styles.header, { paddingTop: topPadding + 16 }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good morning 👋</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.location}>New York, NY</Text>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Search bar */}
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={styles.searchBar}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>
              Search restaurants, cuisines...
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          {/* Categories */}
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryPill
                category={item}
                selected={selectedCategory === item.id}
                onPress={() => setSelectedCategory(item.id)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
            style={{ marginBottom: 24 }}
          />

          {/* Featured */}
          {selectedCategory === 'all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔥 Featured</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={featured}
                keyExtractor={(r) => r.id}
                renderItem={({ item }) => (
                  <RestaurantCard
                    restaurant={item}
                    onPress={() => router.push(`/restaurant/${item.id}`)}
                    featured
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 20 }}
              />
            </View>
          )}

          {/* All / Filtered */}
          <View style={[styles.section, { paddingHorizontal: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>
              {selectedCategory === 'all' ? '🍽 All Restaurants' : `${CATEGORIES.find((c) => c.id === selectedCategory)?.name ?? ''}`}
            </Text>
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onPress={() => router.push(`/restaurant/${r.id}`)}
              />
            ))}
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No restaurants in this category</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <CartButton onPress={() => setCartVisible(true)} />
      <CartSheet visible={cartVisible} onClose={() => setCartVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  greeting: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: '#fff', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchPlaceholder: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
  content: { marginTop: 20 },
  categories: { paddingHorizontal: 20, paddingRight: 8 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  seeAll: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold' },
});
