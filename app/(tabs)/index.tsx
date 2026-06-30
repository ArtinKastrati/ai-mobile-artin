import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
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
import { CATEGORIES } from '@/data/mockData';
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { haptics } from '@/lib/haptics';
import { useNotification } from '@/context/NotificationContext';
import { useCart } from '@/context/CartContext';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { restaurants, favorites, orders, isLoading, refreshData } = useData();
  const { isGuestMode } = useAuth();
  const { unreadCount, showNotification } = useNotification();
  const { itemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartVisible, setCartVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const allRestaurantsY = useRef(0);
  const refreshBannerOpacity = useRef(new Animated.Value(0)).current;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
    // Show "Updated!" pill briefly
    setShowDone(true);
    Animated.sequence([
      Animated.timing(refreshBannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(refreshBannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowDone(false));
  }, [refreshData, refreshBannerOpacity]);

  const categoriesList = [
    { id: 'all', name: t('home.categories.all'), icon: 'grid-outline' },
    { id: 'favorites', name: t('home.categories.favorites'), icon: 'heart' },
    ...CATEGORIES.filter((c) => c.id !== 'all')
  ];

  const featured = restaurants.filter((r) => r.featured);
  const filtered =
    selectedCategory === 'all'
      ? restaurants
      : selectedCategory === 'favorites'
      ? restaurants.filter((r) => favorites.includes(r.id))
      : restaurants.filter((r) => r.categories.includes(selectedCategory));

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const getGreetingKey = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'home.goodMorning';
    if (hrs < 18) return 'home.goodAfternoon';
    return 'home.goodEvening';
  };

  const PROMOS = [
    {
      id: '1',
      code: 'FAST20' as const,
      title: t('home.promos.fast20Title'),
      desc: t('home.promos.fast20Desc'),
      gradient: ['#FF6B35', '#FF8E53'] as [string, string],
    },
    {
      id: '2',
      code: 'FREE' as const,
      title: t('home.promos.freeTitle'),
      desc: t('home.promos.freeDesc'),
      gradient: ['#7C3AED', '#A78BFA'] as [string, string],
    },
    {
      id: '3',
      code: null,
      title: t('home.promos.safeTitle'),
      desc: t('home.promos.safeDesc'),
      gradient: ['#34C759', '#6EE7B7'] as [string, string],
    },
  ];

  const handlePromoPress = (code: 'FAST20' | 'FREE' | null) => {
    haptics.medium();
    if (!code) return;
    if (itemCount > 0) {
      showNotification(t('home.promoCopied', { code }), t('checkout.promoCode'));
      router.push({ pathname: '/checkout', params: { promoCode: code } });
    } else {
      showNotification(t('home.promoBrowse', { code }), t('home.searchPlaceholder'));
    }
  };

  const handleSeeAllFeatured = () => {
    haptics.light();
    scrollRef.current?.scrollTo({ y: allRestaurantsY.current, animated: true });
  };

  // Identify if there is an active order — never show for guests
  const activeOrder = isGuestMode ? null : orders.find(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way'
  );
  const activeRest = activeOrder ? restaurants.find((r) => r.id === activeOrder.restaurantId) : null;

  const getActiveOrderStatusText = (status: string) => {
    if (status === 'pending') return t('orders.statusPending');
    if (status === 'preparing') return t('orders.statusPreparing');
    if (status === 'on_the_way') return t('orders.statusDelivering');
    return status;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Refresh done pill */}
      {showDone && (
        <Animated.View style={[styles.refreshPill, { opacity: refreshBannerOpacity, backgroundColor: colors.primary }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={15} color="#fff" />
          <Text style={styles.refreshPillText}>U përditësua</Text>
        </Animated.View>
      )}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            title="Duke u përditësuar..."
            titleColor={colors.muted}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.primary + 'D0']}
          style={[styles.header, { paddingTop: topPadding + 16 }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{t(getGreetingKey())}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.location}>{t('home.currentLocation')}</Text>
                <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
            <TouchableOpacity 
              style={styles.notifBtn} 
              onPress={() => {
                haptics.light();
                router.push('/notifications');
              }}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.accent }]} />
              )}
            </TouchableOpacity>
          </View>
          {/* Search bar */}
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.push('/search');
            }}
            style={[styles.searchBar, { backgroundColor: colors.card }]}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>
              {t('home.searchPlaceholder')}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          {/* Active Order Banner Widget */}
          {activeOrder && activeRest && (
            <TouchableOpacity
              onPress={() => {
                haptics.medium();
                router.push({
                  pathname: '/orders/[id]',
                  params: { id: activeOrder.id },
                });
              }}
              style={[styles.activeOrderWidget, { backgroundColor: colors.card, borderColor: colors.primary }]}
              activeOpacity={0.9}
            >
              <View style={[styles.activeWidgetBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="bicycle" size={18} color={colors.primary} />
              </View>
              <View style={styles.activeWidgetInfo}>
                <Text style={[styles.activeWidgetTitle, { color: colors.foreground }]}>
                  {t('home.activeOrder')}
                </Text>
                <Text style={[styles.activeWidgetStatus, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {activeRest.name} · {getActiveOrderStatusText(activeOrder.status)}
                </Text>
              </View>
              <View style={styles.activeWidgetLink}>
                <Text style={[styles.activeWidgetLinkText, { color: colors.primary }]}>
                  {t('orders.track')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Promo Banner Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoScrollContainer}
            style={styles.promoScroll}
            snapToInterval={280 + 12}
            decelerationRate="fast"
          >
            {PROMOS.map((promo) => (
              <TouchableOpacity
                key={promo.id}
                activeOpacity={promo.code ? 0.88 : 1}
                onPress={() => handlePromoPress(promo.code)}
              >
                <LinearGradient
                  colors={promo.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.promoBannerCard}
                >
                  <View style={styles.promoTextContainer}>
                    <Text style={styles.promoBannerTitle}>{promo.title}</Text>
                    <Text style={styles.promoBannerDesc}>{promo.desc}</Text>
                  </View>
                  <Ionicons name="gift-outline" size={44} color="rgba(255,255,255,0.22)" style={styles.promoIcon} />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Categories */}
          <FlatList
            horizontal
            data={categoriesList}
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
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.featured')}</Text>
                <TouchableOpacity onPress={handleSeeAllFeatured}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                data={featured}
                keyExtractor={(r) => r.id}
                renderItem={({ item }) => (
                  <RestaurantCard
                    restaurant={item}
                    onPress={() => {
                      haptics.medium();
                      router.push(`/restaurant/${item.id}`);
                    }}
                    featured
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 20 }}
              />
            </View>
          )}

          {/* All / Filtered */}
          <View
            style={[styles.section, { paddingHorizontal: 20 }]}
            onLayout={(e) => { allRestaurantsY.current = e.nativeEvent.layout.y; }}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>
              {selectedCategory === 'all'
                ? t('home.allRestaurants')
                : selectedCategory === 'favorites'
                ? t('home.favoriteRestaurants')
                : t('home.categories.' + selectedCategory)}
            </Text>
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onPress={() => {
                  haptics.medium();
                  router.push(`/restaurant/${r.id}`);
                }}
              />
            ))}
            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>{t('home.noRestaurants')}</Text>
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
  loadingContainer: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  refreshPill: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  refreshPillText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
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
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 5px rgba(0,0,0,0.05)' },
    }),
  },
  searchPlaceholder: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
  content: { marginTop: 8 },
  activeOrderWidget: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeWidgetBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWidgetInfo: {
    flex: 1,
    gap: 2,
  },
  activeWidgetTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
  activeWidgetStatus: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  activeWidgetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  activeWidgetLinkText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
  promoScroll: { marginBottom: 16 },
  promoScrollContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  promoBannerCard: {
    width: 280,
    height: 100,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoTextContainer: { flex: 1, gap: 4, marginRight: 8 },
  promoBannerTitle: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_800ExtraBold' },
  promoBannerDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: 'Nunito_400Regular' },
  promoIcon: { position: 'absolute', right: -6, bottom: -6 },
  categories: { paddingHorizontal: 20, paddingRight: 8 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  seeAll: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold' },
});
