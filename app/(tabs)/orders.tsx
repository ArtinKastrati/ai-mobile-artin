import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePreferences } from '@/context/PreferencesContext';
import { useData, Order } from '@/context/DataContext';
import { useCart } from '@/context/CartContext';
import { haptics } from '@/lib/haptics';
import { ReviewModal } from '@/components/ReviewModal';

const STATUS_CONFIG_MAP = {
  pending: { labelKey: 'orders.statusPending', color: '#FFB800', icon: 'time-outline' as const },
  preparing: { labelKey: 'orders.statusPreparing', color: '#FF9500', icon: 'restaurant-outline' as const },
  on_the_way: { labelKey: 'orders.statusDelivering', color: '#FF6B35', icon: 'bicycle-outline' as const },
  delivered: { labelKey: 'orders.statusCompleted', color: '#34C759', icon: 'checkmark-circle-outline' as const },
  cancelled: { labelKey: 'orders.statusCancelled', color: '#FF3B30', icon: 'close-circle-outline' as const },
};

type CardProps = {
  order: Order;
  onReviewPress: (order: Order) => void;
};

function OrderCard({ order, onReviewPress }: CardProps) {
  const colors = useColors();
  const { t } = usePreferences();
  const { restaurants, menuItems } = useData();
  const { reorderItems } = useCart();
  const restaurant = restaurants.find((r) => r.id === order.restaurantId);
  const status = STATUS_CONFIG_MAP[order.status] || STATUS_CONFIG_MAP.pending;

  const handleReorder = () => {
    haptics.medium();
    if (!order.itemsRaw || order.itemsRaw.length === 0 || !restaurant) {
      router.push(`/restaurant/${order.restaurantId}`);
      return;
    }

    const reconstructed = order.itemsRaw
      .map((raw) => {
        const menuItem = menuItems.find((m) => m.id === raw.menuItemId);
        if (!menuItem) return null;
        return {
          menuItem,
          quantity: raw.quantity,
          selectedModifiers: raw.selectedModifiers,
          specialInstructions: raw.specialInstructions,
        };
      })
      .filter(Boolean) as any[];

    if (reconstructed.length > 0) {
      reorderItems(reconstructed, restaurant);
      router.push('/checkout');
    } else {
      router.push(`/restaurant/${order.restaurantId}`);
    }
  };

  const showReviewButton = order.status === 'delivered' && !order.reviewed;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      activeOpacity={0.92}
      onPress={() => {
        haptics.medium();
        router.push({
          pathname: '/orders/[id]',
          params: { id: order.id },
        });
      }}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: restaurant?.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop' }}
          style={styles.restaurantImg}
          contentFit="cover"
        />
        <View style={styles.cardInfo}>
          <Text style={[styles.restName, { color: colors.foreground }]}>
            {restaurant?.name || t('restaurant.notFound')}
          </Text>
          <Text style={[styles.orderDate, { color: colors.muted }]}>{order.date}</Text>
          <Text style={[styles.orderItems, { color: colors.muted }]} numberOfLines={1}>
            {order.items.join(' · ')}
          </Text>
        </View>
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}>
          <Ionicons name={status.icon} size={13} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{t(status.labelKey as any)}</Text>
        </View>
        <Text style={[styles.total, { color: colors.foreground }]}>${order.total.toFixed(2)}</Text>
      </View>

      {/* Dynamic Actions */}
      <View style={styles.actionsRow}>
        {order.status !== 'delivered' && order.status !== 'cancelled' ? (
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              router.push({
                pathname: '/orders/[id]',
                params: { id: order.id },
              });
            }}
            style={[styles.actionBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.actionText, { color: colors.primary }]}>{t('orders.track')}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.completedActions}>
            {showReviewButton && (
              <TouchableOpacity
                onPress={() => onReviewPress(order)}
                style={[styles.actionBtn, { borderColor: colors.accent }]}
              >
                <Text style={[styles.actionText, { color: colors.accent }]}>{t('orders.leaveReview')}</Text>
                <Ionicons name="star" size={14} color={colors.accent} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleReorder}
              style={[styles.actionBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.actionText, { color: colors.foreground }]}>{t('orders.reorder')}</Text>
              <Ionicons name="refresh" size={14} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const { t } = usePreferences();
  const { orders, restaurants } = useData();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const reviewingRestaurant = reviewOrder
    ? restaurants.find((r) => r.id === reviewOrder.restaurantId)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('orders.title')}</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onReviewPress={(order) => setReviewOrder(order)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('orders.noOrders')}</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t('orders.orderHistoryEmpty')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                haptics.medium();
                router.push('/');
              }}
              style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.browseBtnText}>{t('orders.browseRestaurants')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {reviewOrder && reviewingRestaurant && (
        <ReviewModal
          visible={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          orderId={reviewOrder.id}
          restaurantId={reviewingRestaurant.id}
          restaurantName={reviewingRestaurant.name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold' },
  list: { padding: 20, paddingBottom: 100, gap: 14 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
    }),
  },
  cardHeader: { flexDirection: 'row', gap: 12, padding: 14 },
  restaurantImg: { width: 60, height: 60, borderRadius: 12 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  restName: { fontSize: 15, fontFamily: 'Nunito_700Bold', marginBottom: 2 },
  orderDate: { fontSize: 12, fontFamily: 'Nunito_400Regular', marginBottom: 3 },
  orderItems: { fontSize: 13, fontFamily: 'Nunito_400Regular' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: 'Nunito_700Bold' },
  total: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold' },
  actionsRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionText: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 20 },
  browseBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
});
