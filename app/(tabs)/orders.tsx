import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { RESTAURANTS } from '@/data/mockData';

type Order = {
  id: string;
  restaurantId: string;
  items: string[];
  total: number;
  status: 'delivered' | 'preparing' | 'on_the_way';
  date: string;
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    restaurantId: '1',
    items: ['Classic Smash Burger', 'Crispy Fries'],
    total: 17.98,
    status: 'delivered',
    date: 'Today, 12:30 PM',
  },
  {
    id: 'o2',
    restaurantId: '2',
    items: ['Margherita', 'Diavola'],
    total: 35.98,
    status: 'on_the_way',
    date: 'Today, 1:15 PM',
  },
  {
    id: 'o3',
    restaurantId: '3',
    items: ['Dragon Roll', 'Salmon Nigiri x2'],
    total: 25.98,
    status: 'preparing',
    date: 'Yesterday, 7:45 PM',
  },
];

const STATUS_CONFIG = {
  delivered: { label: 'Delivered', color: '#34C759', icon: 'checkmark-circle' as const },
  preparing: { label: 'Preparing', color: '#FFB800', icon: 'restaurant' as const },
  on_the_way: { label: 'On the way', color: '#FF6B35', icon: 'bicycle' as const },
};

function OrderCard({ order }: { order: Order }) {
  const colors = useColors();
  const restaurant = RESTAURANTS.find((r) => r.id === order.restaurantId);
  const status = STATUS_CONFIG[order.status];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      activeOpacity={0.92}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: restaurant?.imageUrl }}
          style={styles.restaurantImg}
          contentFit="cover"
        />
        <View style={styles.cardInfo}>
          <Text style={[styles.restName, { color: colors.foreground }]}>{restaurant?.name}</Text>
          <Text style={[styles.orderDate, { color: colors.muted }]}>{order.date}</Text>
          <Text style={[styles.orderItems, { color: colors.muted }]} numberOfLines={1}>
            {order.items.join(' · ')}
          </Text>
        </View>
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}>
          <Ionicons name={status.icon} size={13} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={[styles.total, { color: colors.foreground }]}>${order.total.toFixed(2)}</Text>
      </View>
      {order.status !== 'delivered' && (
        <TouchableOpacity style={[styles.trackBtn, { borderColor: colors.primary }]}>
          <Text style={[styles.trackText, { color: colors.primary }]}>Track Order</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
      {order.status === 'delivered' && (
        <TouchableOpacity
          onPress={() => router.push(`/restaurant/${order.restaurantId}`)}
          style={[styles.trackBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.trackText, { color: colors.foreground }]}>Reorder</Text>
          <Ionicons name="refresh" size={14} color={colors.foreground} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Orders</Text>
      </View>
      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No orders yet</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Your order history will appear here
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/')}
              style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.browseBtnText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  trackText: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center', lineHeight: 20 },
  browseBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  browseBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
});
