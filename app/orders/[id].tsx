import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { haptics } from '@/lib/haptics';
import { ReviewModal } from '@/components/ReviewModal';
import { useAuth } from '@/context/AuthContext';

export default function OrderTrackingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { orders, restaurants } = useData();
  const { isGuestMode } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Guests cannot track orders — redirect them away
  useEffect(() => {
    if (isGuestMode) {
      router.replace('/auth');
    }
  }, [isGuestMode]);

  const order = orders.find((o) => o.id === id);
  const restaurant = order ? restaurants.find((r) => r.id === order.restaurantId) : null;

  const [courierProgress, setCourierProgress] = useState(0);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Simulate courier movement when order status is "on_the_way"
  useEffect(() => {
    if (!order) return;

    if (order.status === 'pending' || order.status === 'preparing') {
      setCourierProgress(15); // Waiting at restaurant
      Animated.timing(progressAnim, {
        toValue: 0.15,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else if (order.status === 'on_the_way') {
      // Progress from restaurant (15%) to near customer (85%) over time
      setCourierProgress(45);
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnim, {
            toValue: 0.8,
            duration: 12000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnim, {
            toValue: 0.2,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else if (order.status === 'delivered') {
      setCourierProgress(100); // Arrived
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      setCourierProgress(0); // Cancelled
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [order?.status]);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>{t('orders.notFound')}</Text>
      </View>
    );
  }

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const getStepActive = (step: 'pending' | 'preparing' | 'on_the_way' | 'delivered') => {
    const statusOrder = ['pending', 'preparing', 'on_the_way', 'delivered'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(step);
    return currentIdx >= stepIdx;
  };

  const getStatusColor = (status: typeof order.status) => {
    switch (status) {
      case 'pending': return '#FFB800';
      case 'preparing': return '#FF9500';
      case 'on_the_way': return '#FF6B35';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
    }
  };

  const handleCallDriver = () => {
    haptics.light();
    Alert.alert(
      t('orders.callCourier'),
      t('orders.callCourierConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('orders.call'), onPress: () => haptics.medium() }
      ]
    );
  };

  const handleMessageDriver = () => {
    haptics.light();
    Alert.alert(
      t('orders.messageCourier'),
      t('orders.messageCourierConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('orders.message'), onPress: () => haptics.medium() }
      ]
    );
  };

  // Interpolate courier indicator position on the simulated map path
  const courierLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '85%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('orders.details')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Status Stepper Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.orderNumberLabel, { color: colors.muted }]}>
                {t('orders.order')} #{order.id}
              </Text>
              <Text style={[styles.orderDateValue, { color: colors.foreground }]}>{order.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}18` }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status) }]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {order.status !== 'cancelled' ? (
            <View style={styles.stepperContainer}>
              {/* Vertical line indicator */}
              <View style={[styles.stepperLine, { backgroundColor: colors.border }]}>
                <Animated.View 
                  style={[
                    styles.stepperLineActive, 
                    { 
                      backgroundColor: colors.primary,
                      height: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]} 
                />
              </View>

              {/* Steps */}
              <View style={styles.stepsColumn}>
                {/* Step 1: Placed */}
                <View style={styles.stepRow}>
                  <View style={[
                    styles.stepDot, 
                    { backgroundColor: getStepActive('pending') ? colors.primary : colors.card, borderColor: getStepActive('pending') ? colors.primary : colors.border }
                  ]}>
                    {getStepActive('pending') && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: getStepActive('pending') ? colors.foreground : colors.muted }]}>
                      {t('orders.placedTitle')}
                    </Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      {t('orders.placedDesc')}
                    </Text>
                  </View>
                </View>

                {/* Step 2: Preparing */}
                <View style={styles.stepRow}>
                  <View style={[
                    styles.stepDot, 
                    { backgroundColor: getStepActive('preparing') ? colors.primary : colors.card, borderColor: getStepActive('preparing') ? colors.primary : colors.border }
                  ]}>
                    {getStepActive('preparing') && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: getStepActive('preparing') ? colors.foreground : colors.muted }]}>
                      {t('orders.statusPreparing')}
                    </Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      {t('orders.preparingDesc')}
                    </Text>
                  </View>
                </View>

                {/* Step 3: Delivering */}
                <View style={styles.stepRow}>
                  <View style={[
                    styles.stepDot, 
                    { backgroundColor: getStepActive('on_the_way') ? colors.primary : colors.card, borderColor: getStepActive('on_the_way') ? colors.primary : colors.border }
                  ]}>
                    {getStepActive('on_the_way') && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: getStepActive('on_the_way') ? colors.foreground : colors.muted }]}>
                      {t('orders.statusDelivering')}
                    </Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      {t('orders.deliveringDesc')}
                    </Text>
                  </View>
                </View>

                {/* Step 4: Completed */}
                <View style={styles.stepRow}>
                  <View style={[
                    styles.stepDot, 
                    { backgroundColor: getStepActive('delivered') ? colors.primary : colors.card, borderColor: getStepActive('delivered') ? colors.primary : colors.border }
                  ]}>
                    {getStepActive('delivered') && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: getStepActive('delivered') ? colors.foreground : colors.muted }]}>
                      {t('orders.statusCompleted')}
                    </Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      {t('orders.deliveredDesc')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.cancelledContainer}>
              <Ionicons name="close-circle-outline" size={36} color={colors.error} />
              <Text style={[styles.cancelledText, { color: colors.error }]}>
                {t('orders.cancelledDesc')}
              </Text>
            </View>
          )}
        </View>

        {/* Live Route Map Simulation */}
        {order.status !== 'cancelled' ? (
          <View style={[styles.card, styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.mapTitle, { color: colors.foreground }]}>
              📍 {t('orders.liveTrackingMap')}
            </Text>
            
            <View style={[styles.mapCanvas, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {/* Dotted delivery route */}
              <View style={[styles.routePath, { borderColor: colors.border }]} />

              {/* Restaurant Indicator */}
              <View style={[styles.mapNode, { left: '10%', backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Ionicons name="restaurant" size={14} color={colors.primary} />
                <Text style={[styles.nodeLabel, { color: colors.mutedForeground }]}>{restaurant?.name || 'Shop'}</Text>
              </View>

              {/* Moving Courier icon */}
              <Animated.View style={[styles.mapCourier, { left: courierLeft, backgroundColor: colors.accent }]}>
                <Ionicons name="bicycle" size={16} color="#fff" />
              </Animated.View>

              {/* User Address Indicator */}
              <View style={[styles.mapNode, { right: '10%', backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Ionicons name="home" size={14} color={colors.primary} />
                <Text style={[styles.nodeLabel, { color: colors.mutedForeground }]}>{order.addressLabel || 'Home'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Courier Contact Card */}
        {order.status !== 'cancelled' && order.status !== 'delivered' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.courierRow}>
              <View style={[styles.courierAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.courierInfo}>
                <Text style={[styles.courierName, { color: colors.foreground }]}>Blerand Krasniqi</Text>
                <View style={styles.courierRatingRow}>
                  <Ionicons name="star" size={12} color={colors.accent} />
                  <Text style={[styles.courierRating, { color: colors.foreground }]}>4.9</Text>
                  <Text style={[styles.courierVehicle, { color: colors.muted }]}>· Bicycle Courier</Text>
                </View>
              </View>
              <View style={styles.courierActions}>
                <TouchableOpacity onPress={handleCallDriver} style={[styles.courierBtn, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleMessageDriver} style={[styles.courierBtn, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="chatbubble" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Post-Order Review Prompt */}
        {order.status === 'delivered' && !order.reviewed ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewPromptRow}>
              <View style={styles.reviewPromptTextSection}>
                <Text style={[styles.reviewPromptTitle, { color: colors.foreground }]}>
                  How was the food?
                </Text>
                <Text style={[styles.reviewPromptSub, { color: colors.muted }]}>
                  Share your review for {restaurant?.name || 'the restaurant'}.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  haptics.medium();
                  setReviewModalVisible(true);
                }}
                style={[styles.reviewPromptBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.88}
              >
                <Text style={styles.reviewPromptBtnText}>Write Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Ordered Items Receipt Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.foreground }]}>
            {t('checkout.orderSummary')}
          </Text>

          <View style={styles.receiptItemsList}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.receiptItemRow}>
                <Text style={[styles.receiptItemText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Delivery Point details */}
          <View style={[styles.addressDetailBlock, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressBlockLabel, { color: colors.foreground }]}>
                {order.addressLabel || 'Delivery Address'}
              </Text>
              <Text style={[styles.addressBlockDetails, { color: colors.mutedForeground }]}>
                {order.addressDetails || 'None provided'}
              </Text>
            </View>
          </View>

          {/* Receipt price columns */}
          <View style={styles.receiptPriceRow}>
            <Text style={{ color: colors.muted }}>{t('checkout.subtotal')}</Text>
            <Text style={{ color: colors.foreground, fontFamily: 'Nunito_600SemiBold' }}>
              €{(order.total - (order.promoCodeUsed === 'FREE' ? 0 : (restaurant?.deliveryFee || 0)) + (order.discountApplied || 0)).toFixed(2)}
            </Text>
          </View>

          {order.discountApplied ? (
            <View style={styles.receiptPriceRow}>
              <Text style={{ color: colors.success }}>{t('checkout.discount')} ({order.promoCodeUsed})</Text>
              <Text style={{ color: colors.success, fontFamily: 'Nunito_600SemiBold' }}>
                -€{order.discountApplied.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <View style={styles.receiptPriceRow}>
            <Text style={{ color: colors.muted }}>{t('checkout.deliveryFee')}</Text>
            <Text style={{ color: colors.foreground, fontFamily: 'Nunito_600SemiBold' }}>
              {order.promoCodeUsed === 'FREE' ? t('checkout.free') : `€${(restaurant?.deliveryFee || 0).toFixed(2)}`}
            </Text>
          </View>

          <View style={[styles.receiptPriceRow, styles.receiptGrandRow]}>
            <Text style={[styles.receiptGrandLabel, { color: colors.foreground }]}>{t('checkout.total')}</Text>
            <Text style={[styles.receiptGrandValue, { color: colors.primary }]}>€{order.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {order && restaurant && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          orderId={order.id}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumberLabel: { fontSize: 12, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  orderDateValue: { fontSize: 15, fontFamily: 'Nunito_700Bold', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontFamily: 'Nunito_800ExtraBold' },
  stepperContainer: {
    flexDirection: 'row',
    position: 'relative',
    marginTop: 8,
    paddingLeft: 4,
  },
  stepperLine: {
    width: 3,
    position: 'absolute',
    left: 10,
    top: 14,
    bottom: 14,
    borderRadius: 2,
  },
  stepperLineActive: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
  },
  stepsColumn: { flex: 1, gap: 20 },
  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepInfo: { flex: 1, gap: 1 },
  stepTitle: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  stepDesc: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  cancelledContainer: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  cancelledText: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  mapCard: { gap: 10 },
  mapTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  mapCanvas: {
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  routePath: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    position: 'absolute',
    left: '15%',
    right: '15%',
  },
  mapNode: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nodeLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    position: 'absolute',
    bottom: -18,
    textAlign: 'center',
    width: 80,
  },
  mapCourier: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courierRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierInfo: { flex: 1, gap: 1 },
  courierName: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  courierRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  courierRating: { fontSize: 12, fontFamily: 'Nunito_600SemiBold' },
  courierVehicle: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  courierActions: { flexDirection: 'row', gap: 8 },
  courierBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSectionTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', marginBottom: 4 },
  receiptItemsList: { gap: 8 },
  receiptItemRow: { paddingVertical: 2 },
  receiptItemText: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
  addressDetailBlock: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 4,
  },
  addressBlockLabel: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  addressBlockDetails: { fontSize: 12, fontFamily: 'Nunito_400Regular', marginTop: 1 },
  receiptPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptGrandRow: { marginTop: 4, paddingTop: 10 },
  receiptGrandLabel: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold' },
  receiptGrandValue: { fontSize: 17, fontFamily: 'Nunito_800ExtraBold' },
  reviewPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewPromptTextSection: {
    flex: 1,
  },
  reviewPromptTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 2,
  },
  reviewPromptSub: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  reviewPromptBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reviewPromptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
});
