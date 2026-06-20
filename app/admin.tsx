import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth, Profile, UserRole } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';
import { useData, Order } from '@/context/DataContext';
import { Restaurant, MenuItem } from '@/data/mockData';

type Tab = 'orders' | 'foods' | 'restaurants' | 'users';

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role, session, profile } = useAuth();
  const { t } = usePreferences();
  const {
    restaurants,
    menuItems,
    orders,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    updateOrderStatus,
    simulatedRole,
    simulatedRestaurantId,
  } = useData();

  const activeRole = session ? (profile?.role || role || 'client') : simulatedRole;
  const activeRestaurantId = session ? (profile?.restaurant_id || null) : simulatedRestaurantId;

  const isSuperAdmin = activeRole === 'admin';
  const isRestAdmin = activeRole === 'restaurant_admin';
  const isEmployee = activeRole === 'employee';

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const getRoleLabel = (userRole?: UserRole | null, short = false) => {
    if (userRole === 'admin') return t('admin.roleSuperAdmin');
    if (userRole === 'restaurant_admin') return short ? t('admin.roleRestAdmin') : t('admin.roleRestaurantAdmin');
    if (userRole === 'employee') return t('admin.roleEmployee');
    return t('admin.roleClient');
  };

  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Modals visibility states
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userRoleSelect, setUserRoleSelect] = useState<UserRole>('client');
  const [userRestSelect, setUserRestSelect] = useState<string>('');

  // Edit states
  const [editingFood, setEditingFood] = useState<MenuItem | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  // Food Form Fields
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodImage, setFoodImage] = useState('');
  const [foodCategory, setFoodCategory] = useState('Burgers');
  const [foodRestId, setFoodRestId] = useState('');
  const [foodPopular, setFoodPopular] = useState(false);

  // Restaurant Form Fields
  const [restName, setRestName] = useState('');
  const [restCuisine, setRestCuisine] = useState('');
  const [restPriceRange, setRestPriceRange] = useState<'$' | '$$' | '$$$'>('$$');
  const [restDelTime, setRestDelTime] = useState('20-30 min');
  const [restDelFee, setRestDelFee] = useState('');
  const [restMinOrder, setRestMinOrder] = useState('');
  const [restImage, setRestImage] = useState('');
  const [restDesc, setRestDesc] = useState('');
  const [restFeatured, setRestFeatured] = useState(false);

  // Focused state for inputs
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if they are a regular client, or role is empty
    if (activeRole === 'client' || !activeRole) {
      router.replace('/(tabs)/profile');
      return;
    }
    // Only super admins should fetch users list from DB
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [activeRole, isSuperAdmin]);

  // Adjust active tab based on permissions when role changes
  useEffect(() => {
    if (isEmployee) {
      setActiveTab('orders');
    } else if (isRestAdmin && (activeTab === 'restaurants' || activeTab === 'users')) {
      setActiveTab('orders');
    }
  }, [activeRole, isEmployee, isRestAdmin, activeTab]);

  // Set default restaurant select value on foods load
  useEffect(() => {
    if (isRestAdmin && activeRestaurantId) {
      setFoodRestId(activeRestaurantId);
    } else if (restaurants.length > 0 && !foodRestId) {
      setFoodRestId(restaurants[0].id);
    }
  }, [restaurants, isRestAdmin, activeRestaurantId, foodRestId]);

  const fetchUsers = async () => {
    if (!session) {
      // Mock users for local/demo mode
      setUsers([
        { id: 'u1', full_name: 'Artin Kastrati', email: 'artin@test.com', role: 'admin', created_at: '' },
        { id: 'u2', full_name: 'John Owner', email: 'john@gmail.com', role: 'restaurant_admin', restaurant_id: '1', created_at: '' },
        { id: 'u3', full_name: 'Jane Chef', email: 'jane@yahoo.com', role: 'employee', restaurant_id: '1', created_at: '' },
        { id: 'u4', full_name: 'Guest Client', email: 'client@gmail.com', role: 'client', created_at: '' },
      ]);
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setUsers(data as Profile[]);
    } catch (e) {
      console.error('Error loading profiles', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openManageUser = (u: Profile) => {
    haptics.light();
    setEditingUser(u);
    setUserRoleSelect(u.role);
    setUserRestSelect(u.restaurant_id || (restaurants.length > 0 ? restaurants[0].id : ''));
    setUserModalVisible(true);
  };

  const handleUserSubmit = async () => {
    if (!editingUser) return;
    haptics.heavy();
    
    const restId = (userRoleSelect === 'restaurant_admin' || userRoleSelect === 'employee') 
      ? userRestSelect 
      : null;

    if (!session) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: userRoleSelect, restaurant_id: restId } : u));
      setUserModalVisible(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: userRoleSelect, 
          restaurant_id: restId 
        })
        .eq('id', editingUser.id);
      
      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        fetchUsers();
      }
    } catch (e) {
      console.error('Error updating user role', e);
    } finally {
      setUserModalVisible(false);
    }
  };

  // Display Lists filtered by role & restaurant
  const displayOrders = useMemo(() => {
    if (isSuperAdmin) return orders;
    return orders.filter(o => o.restaurantId === activeRestaurantId);
  }, [orders, isSuperAdmin, activeRestaurantId]);

  const displayFoods = useMemo(() => {
    if (isSuperAdmin) return menuItems;
    return menuItems.filter(item => item.restaurantId === activeRestaurantId);
  }, [menuItems, isSuperAdmin, activeRestaurantId]);

  // Stats Calculations
  const stats = useMemo(() => {
    const filteredOrders = isSuperAdmin 
      ? orders 
      : orders.filter(o => o.restaurantId === activeRestaurantId);
      
    const revenue = filteredOrders.reduce((sum, o) => o.status === 'delivered' ? sum + o.total : sum, 0);
    const active = filteredOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    return {
      revenue: `$${revenue.toFixed(2)}`,
      activeOrders: String(active),
      totalRestaurants: isSuperAdmin ? String(restaurants.length) : '1',
    };
  }, [orders, restaurants, isSuperAdmin, activeRestaurantId]);

  // Handle Order Status Changer
  const handleOrderStatusPress = (orderId: string, currentStatus: Order['status']) => {
    haptics.medium();
    Alert.alert(
      t('orders.status'),
      undefined,
      [
        { text: t('orders.statusPending'), onPress: () => updateOrderStatus(orderId, 'pending') },
        { text: t('orders.statusPreparing'), onPress: () => updateOrderStatus(orderId, 'preparing') },
        { text: t('orders.statusDelivering'), onPress: () => updateOrderStatus(orderId, 'on_the_way') },
        { text: t('orders.statusCompleted'), onPress: () => updateOrderStatus(orderId, 'delivered') },
        { text: t('orders.statusCancelled'), onPress: () => updateOrderStatus(orderId, 'cancelled'), style: 'destructive' },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  // Open Add Food modal
  const openAddFood = () => {
    haptics.light();
    setEditingFood(null);
    setFoodName('');
    setFoodPrice('');
    setFoodDesc('');
    setFoodImage('');
    setFoodCategory('Burgers');
    if (isRestAdmin && activeRestaurantId) {
      setFoodRestId(activeRestaurantId);
    } else if (restaurants.length > 0) {
      setFoodRestId(restaurants[0].id);
    }
    setFoodPopular(false);
    setFoodModalVisible(true);
  };

  // Open Edit Food modal
  const openEditFood = (item: MenuItem) => {
    haptics.light();
    setEditingFood(item);
    setFoodName(item.name);
    setFoodPrice(String(item.price));
    setFoodDesc(item.description);
    setFoodImage(item.imageUrl);
    setFoodCategory(item.category);
    if (isRestAdmin && activeRestaurantId) {
      setFoodRestId(activeRestaurantId);
    } else {
      setFoodRestId(item.restaurantId);
    }
    setFoodPopular(!!item.popular);
    setFoodModalVisible(true);
  };

  // Submit Food Form
  const handleFoodSubmit = () => {
    if (!foodName.trim() || !foodPrice.trim() || !foodRestId) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    haptics.heavy();
    const priceNum = parseFloat(foodPrice) || 0;
    const foodPayload = {
      restaurantId: foodRestId,
      name: foodName,
      description: foodDesc,
      price: priceNum,
      imageUrl: foodImage.trim() || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop',
      category: foodCategory,
      popular: foodPopular,
    };

    if (editingFood) {
      updateMenuItem({ ...foodPayload, id: editingFood.id });
    } else {
      addMenuItem(foodPayload);
    }
    setFoodModalVisible(false);
  };

  // Delete Food item
  const handleFoodDelete = (id: string) => {
    haptics.medium();
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('admin.deleteFoodConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.delete'), style: 'destructive', onPress: () => { haptics.heavy(); deleteMenuItem(id); } }
      ]
    );
  };

  // Open Add Restaurant modal
  const openAddRest = () => {
    haptics.light();
    setEditingRestaurant(null);
    setRestName('');
    setRestCuisine('');
    setRestPriceRange('$$');
    setRestDelTime('20-30 min');
    setRestDelFee('');
    setRestMinOrder('');
    setRestImage('');
    setRestDesc('');
    setRestFeatured(false);
    setRestaurantModalVisible(true);
  };

  // Open Edit Restaurant modal
  const openEditRest = (rest: Restaurant) => {
    haptics.light();
    setEditingRestaurant(rest);
    setRestName(rest.name);
    setRestCuisine(rest.cuisine);
    setRestPriceRange(rest.priceRange);
    setRestDelTime(rest.deliveryTime);
    setRestDelFee(String(rest.deliveryFee));
    setRestMinOrder(String(rest.minOrder));
    setRestImage(rest.imageUrl);
    setRestDesc(rest.description);
    setRestFeatured(!!rest.featured);
    setRestaurantModalVisible(true);
  };

  // Submit Restaurant Form
  const handleRestSubmit = () => {
    if (!restName.trim() || !restCuisine.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    haptics.heavy();
    const feeNum = parseFloat(restDelFee) || 0;
    const minOrderNum = parseFloat(restMinOrder) || 0;
    const restPayload = {
      name: restName,
      cuisine: restCuisine,
      rating: editingRestaurant ? editingRestaurant.rating : 5.0,
      reviewCount: editingRestaurant ? editingRestaurant.reviewCount : 1,
      deliveryTime: restDelTime,
      deliveryFee: feeNum,
      minOrder: minOrderNum,
      imageUrl: restImage.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop',
      categories: [restCuisine.split('•')[0].trim().toLowerCase()],
      priceRange: restPriceRange,
      description: restDesc,
      featured: restFeatured,
    };

    if (editingRestaurant) {
      updateRestaurant({ ...restPayload, id: editingRestaurant.id });
    } else {
      addRestaurant(restPayload);
    }
    setRestaurantModalVisible(false);
  };

  // Delete Restaurant
  const handleRestDelete = (id: string) => {
    haptics.medium();
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('admin.deleteRestaurantConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.delete'), style: 'destructive', onPress: () => { haptics.heavy(); deleteRestaurant(id); } }
      ]
    );
  };

  // Render Functions
  const renderOrders = () => (
    <FlatList
      data={displayOrders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const rest = restaurants.find(r => r.id === item.restaurantId);
        const statusColors = {
          pending: '#FFB800',
          preparing: '#FF9500',
          on_the_way: '#FF6B35',
          delivered: '#34C759',
          cancelled: '#FF3B30',
        };
        const statusColor = statusColors[item.status] || '#FFB800';

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleOrderStatusPress(item.id, item.status)}
            activeOpacity={0.88}
            style={[styles.adminCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{rest?.name || t('restaurant.notFound')}</Text>
                <Text style={[styles.cardSub, { color: colors.muted }]}>{item.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.cardItems, { color: colors.mutedForeground }]} numberOfLines={2}>
              {item.items.join(' · ')}
            </Text>
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerInfoText, { color: colors.muted }]}>{t('admin.tapToChangeStatus')}</Text>
              <Text style={[styles.footerPrice, { color: colors.foreground }]}>${item.total.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t('admin.noOrders')}</Text>
        </View>
      }
    />
  );

  const renderFoods = () => {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={openAddFood}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('admin.addFoodItem')}</Text>
        </TouchableOpacity>
        <FlatList
          data={displayFoods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingTop: 8 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const rest = restaurants.find(r => r.id === item.restaurantId);
            return (
              <View style={[styles.adminCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardRow}>
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImg} contentFit="cover" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.cardSub, { color: colors.primary }]} numberOfLines={1}>${item.price.toFixed(2)}</Text>
                    <Text style={[styles.cardSub, { color: colors.muted }]} numberOfLines={1}>{rest?.name || t('admin.unknown')}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => openEditFood(item)} style={styles.iconBtn}>
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleFoodDelete(item.id)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fast-food-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>{t('admin.noFoodItems')}</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderRestaurants = () => {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={openAddRest}
          style={[styles.addButton, { backgroundColor: '#7C3AED' }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('admin.addRestaurant')}</Text>
        </TouchableOpacity>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingTop: 8 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.adminCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImg} contentFit="cover" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]} numberOfLines={1}>{item.cuisine} · {item.priceRange}</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]} numberOfLines={1}>Fee: ${item.deliveryFee} · Min: ${item.minOrder}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => openEditRest(item)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color="#7C3AED" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRestDelete(item.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>{t('admin.noRestaurants')}</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderUsers = () => (
    <View style={{ flex: 1 }}>
      {loadingUsers ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: u }) => {
            const roleColorMap = {
              admin: '#7C3AED',
              restaurant_admin: '#FF9500',
              employee: '#34C759',
              client: colors.primary,
            };
            const roleColor = roleColorMap[u.role] || colors.primary;
            const roleLabel = getRoleLabel(u.role, true);

            return (
              <View key={u.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: roleColor }]}>
                  <Text style={styles.userAvatarText}>
                    {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>
                    {u.full_name ?? t('admin.noName')}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.muted }]}>{u.email ?? '—'}</Text>
                  
                  <View style={[styles.rolePill, { backgroundColor: `${roleColor}18` }]}>
                    <Text style={[styles.rolePillText, { color: roleColor }]}>
                      {roleLabel}
                    </Text>
                  </View>
                  
                  {u.restaurant_id && (
                    <Text style={{ fontSize: 11, fontFamily: 'Nunito_400Regular', color: colors.muted, marginTop: 4 }}>
                      {t('admin.restaurantShort')}: {restaurants.find(r => r.id === u.restaurant_id)?.name || `ID: ${u.restaurant_id}`}
                    </Text>
                  )}
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    onPress={() => openManageUser(u)}
                    style={[styles.actionBtn, { backgroundColor: '#7C3AED18' }]}
                  >
                    <Ionicons name="settings-outline" size={14} color="#7C3AED" />
                    <Text style={[styles.actionText, { color: '#7C3AED' }]}>{t('admin.manage')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>{t('admin.noUsers')}</Text>
            </View>
          }
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: '#7C3AED' }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {isSuperAdmin ? t('profile.adminDashboard') : isRestAdmin ? t('profile.restaurantManager') : t('profile.employeePortal')}
          </Text>
          <Text style={styles.headerSub}>
            {!session ? t('admin.demoMode') : t('admin.liveMode')}
            {activeRestaurantId && ` • ${restaurants.find(r => r.id === activeRestaurantId)?.name || t('admin.restaurantShort') + ' ' + activeRestaurantId}`}
          </Text>
        </View>
        {isSuperAdmin && activeTab === 'users' && (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              fetchUsers();
            }}
            style={styles.refreshBtn}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Summary Panel */}
      {!isEmployee && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t('admin.salesRevenue')}</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.revenue}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t('admin.activeOrders')}</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.activeOrders}</Text>
          </View>
          {isSuperAdmin && (
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{t('admin.restaurants')}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.totalRestaurants}</Text>
            </View>
          )}
        </View>
      )}

      {/* Segment Selector Tabs */}
      {!isEmployee && (
        <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity
            onPress={() => { haptics.selection(); setActiveTab('orders'); }}
            style={[styles.tabItem, activeTab === 'orders' && { borderBottomColor: colors.primary }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'orders' ? colors.primary : colors.muted }]}>{t('admin.orders')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { haptics.selection(); setActiveTab('foods'); }}
            style={[styles.tabItem, activeTab === 'foods' && { borderBottomColor: colors.primary }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === 'foods' ? colors.primary : colors.muted }]}>{t('admin.foods')}</Text>
          </TouchableOpacity>
          {isSuperAdmin && (
            <>
              <TouchableOpacity
                onPress={() => { haptics.selection(); setActiveTab('restaurants'); }}
                style={[styles.tabItem, activeTab === 'restaurants' && { borderBottomColor: colors.primary }]}
              >
                <Text style={[styles.tabLabel, { color: activeTab === 'restaurants' ? colors.primary : colors.muted }]}>{t('admin.restaurants')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { haptics.selection(); setActiveTab('users'); }}
                style={[styles.tabItem, activeTab === 'users' && { borderBottomColor: colors.primary }]}
              >
                <Text style={[styles.tabLabel, { color: activeTab === 'users' ? colors.primary : colors.muted }]}>{t('admin.users')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Content Rendering based on Tab */}
      <View style={{ flex: 1 }}>
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'foods' && !isEmployee && renderFoods()}
        {activeTab === 'restaurants' && isSuperAdmin && renderRestaurants()}
        {activeTab === 'users' && isSuperAdmin && renderUsers()}
      </View>

      {/* -------------------- FOOD MODAL FORM -------------------- */}
      <Modal visible={foodModalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingFood ? t('admin.editFoodItem') : t('admin.addFoodItem')}
              </Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.foodName')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'foodName' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'foodName' ? 1.5 : 1,
                    }
                  ]}
                  value={foodName}
                  onChangeText={setFoodName}
                  onFocus={() => setFocusedField('foodName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.price')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'foodPrice' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'foodPrice' ? 1.5 : 1,
                    }
                  ]}
                  keyboardType="numeric"
                  value={foodPrice}
                  onChangeText={setFoodPrice}
                  onFocus={() => setFocusedField('foodPrice')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.description')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'foodDesc' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'foodDesc' ? 1.5 : 1,
                    }
                  ]}
                  multiline
                  numberOfLines={2}
                  value={foodDesc}
                  onChangeText={setFoodDesc}
                  onFocus={() => setFocusedField('foodDesc')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.imageUrl')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'foodImage' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'foodImage' ? 1.5 : 1,
                    }
                  ]}
                  value={foodImage}
                  onChangeText={setFoodImage}
                  onFocus={() => setFocusedField('foodImage')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.category')}</Text>
                <View style={styles.categoriesSelectContainer}>
                  {['Burgers', 'Pizzas', 'Sides', 'Nigiri', 'Rolls', 'Bowls', 'Cakes', 'Coffee'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFoodCategory(cat)}
                      style={[
                        styles.catSelectBtn,
                        {
                          backgroundColor: foodCategory === cat ? colors.primary : colors.card,
                          borderColor: foodCategory === cat ? colors.primary : colors.border,
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 13, color: foodCategory === cat ? '#fff' : colors.foreground }}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {!isRestAdmin && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.restaurantRequired')}</Text>
                  <View style={styles.categoriesSelectContainer}>
                    {restaurants.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setFoodRestId(r.id)}
                        style={[
                          styles.catSelectBtn,
                          {
                            backgroundColor: foodRestId === r.id ? colors.primary : colors.card,
                            borderColor: foodRestId === r.id ? colors.primary : colors.border,
                          }
                        ]}
                      >
                        <Text style={{ fontSize: 13, color: foodRestId === r.id ? '#fff' : colors.foreground }}>{r.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={[styles.switchGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: 'Nunito_600SemiBold' }}>{t('admin.markAsPopular')}</Text>
                <Switch value={foodPopular} onValueChange={setFoodPopular} thumbColor={foodPopular ? colors.primary : '#ccc'} trackColor={{ true: colors.primaryLight }} />
              </View>

              <TouchableOpacity
                onPress={handleFoodSubmit}
                style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
              >
                <Text style={styles.submitBtnText}>{t('admin.saveMenuItem')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------------------- RESTAURANT MODAL FORM -------------------- */}
      <Modal visible={restaurantModalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingRestaurant ? t('admin.editRestaurant') : t('admin.addRestaurant')}
              </Text>
              <TouchableOpacity onPress={() => setRestaurantModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.restaurantName')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restName' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restName' ? 1.5 : 1,
                    }
                  ]}
                  value={restName}
                  onChangeText={setRestName}
                  onFocus={() => setFocusedField('restName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.cuisineTag')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restCuisine' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restCuisine' ? 1.5 : 1,
                    }
                  ]}
                  placeholder={t('admin.cuisinePlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={restCuisine}
                  onChangeText={setRestCuisine}
                  onFocus={() => setFocusedField('restCuisine')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.deliveryTime')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restDelTime' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restDelTime' ? 1.5 : 1,
                    }
                  ]}
                  placeholder={t('admin.deliveryTimePlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={restDelTime}
                  onChangeText={setRestDelTime}
                  onFocus={() => setFocusedField('restDelTime')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.deliveryFee')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restDelFee' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restDelFee' ? 1.5 : 1,
                    }
                  ]}
                  keyboardType="numeric"
                  value={restDelFee}
                  onChangeText={setRestDelFee}
                  onFocus={() => setFocusedField('restDelFee')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.minOrder')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restMinOrder' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restMinOrder' ? 1.5 : 1,
                    }
                  ]}
                  keyboardType="numeric"
                  value={restMinOrder}
                  onChangeText={setRestMinOrder}
                  onFocus={() => setFocusedField('restMinOrder')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.imageUrl')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restImage' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restImage' ? 1.5 : 1,
                    }
                  ]}
                  value={restImage}
                  onChangeText={setRestImage}
                  onFocus={() => setFocusedField('restImage')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.description')}</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: focusedField === 'restDesc' ? colors.primary : colors.border,
                      borderWidth: focusedField === 'restDesc' ? 1.5 : 1,
                    }
                  ]}
                  multiline
                  numberOfLines={2}
                  value={restDesc}
                  onChangeText={setRestDesc}
                  onFocus={() => setFocusedField('restDesc')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.priceRange')}</Text>
                <View style={styles.categoriesSelectContainer}>
                  {['$', '$$', '$$$'].map(pr => (
                    <TouchableOpacity
                      key={pr}
                      onPress={() => setRestPriceRange(pr as any)}
                      style={[
                        styles.catSelectBtn,
                        {
                          backgroundColor: restPriceRange === pr ? '#7C3AED' : colors.card,
                          borderColor: restPriceRange === pr ? '#7C3AED' : colors.border,
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 13, color: restPriceRange === pr ? '#fff' : colors.foreground }}>{pr}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={[styles.switchGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: 'Nunito_600SemiBold' }}>{t('admin.featuredRestaurant')}</Text>
                <Switch value={restFeatured} onValueChange={setRestFeatured} thumbColor={restFeatured ? '#7C3AED' : '#ccc'} trackColor={{ true: '#7C3AED60' }} />
              </View>

              <TouchableOpacity
                onPress={handleRestSubmit}
                style={[styles.submitBtn, { backgroundColor: '#7C3AED', marginTop: 10 }]}
              >
                <Text style={styles.submitBtnText}>{t('admin.saveRestaurant')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------------------- USER MODAL FORM -------------------- */}
      <Modal visible={userModalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('admin.manageUserRole')}</Text>
              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.userDetails')}</Text>
                <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.foreground }}>
                  {editingUser?.full_name || t('admin.noName')}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_400Regular', color: colors.muted }}>
                  {editingUser?.email}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.selectRole')}</Text>
                <View style={styles.categoriesSelectContainer}>
                  {([
                    { label: t('admin.roleSuperAdmin'), value: 'admin' },
                    { label: t('admin.roleRestaurantAdmin'), value: 'restaurant_admin' },
                    { label: t('admin.roleEmployee'), value: 'employee' },
                    { label: t('admin.roleClient'), value: 'client' }
                  ] as { label: string; value: UserRole }[]).map(r => (
                    <TouchableOpacity
                      key={r.value}
                      onPress={() => setUserRoleSelect(r.value)}
                      style={[
                        styles.catSelectBtn,
                        {
                          backgroundColor: userRoleSelect === r.value ? '#7C3AED' : colors.card,
                          borderColor: userRoleSelect === r.value ? '#7C3AED' : colors.border,
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 13, color: userRoleSelect === r.value ? '#fff' : colors.foreground }}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(userRoleSelect === 'restaurant_admin' || userRoleSelect === 'employee') && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('admin.assignRestaurant')}</Text>
                  <View style={styles.categoriesSelectContainer}>
                    {restaurants.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setUserRestSelect(r.id)}
                        style={[
                          styles.catSelectBtn,
                          {
                            backgroundColor: userRestSelect === r.id ? '#7C3AED' : colors.card,
                            borderColor: userRestSelect === r.id ? '#7C3AED' : colors.border,
                          }
                        ]}
                      >
                        <Text style={{ fontSize: 13, color: userRestSelect === r.id ? '#fff' : colors.foreground }}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={handleUserSubmit}
                style={[styles.submitBtn, { backgroundColor: '#7C3AED', marginTop: 10 }]}
              >
                <Text style={styles.submitBtnText}>{t('admin.saveChanges')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  headerSub: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.7)' },
  refreshBtn: { padding: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: { fontSize: 10, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  list: { padding: 16, paddingBottom: 60, gap: 12 },
  adminCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  cardSub: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  cardItems: { fontSize: 13, fontFamily: 'Nunito_400Regular', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 10, fontFamily: 'Nunito_700Bold' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  footerInfoText: { fontSize: 11, fontFamily: 'Nunito_400Regular', fontStyle: 'italic' },
  footerPrice: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  itemImg: { width: 48, height: 48, borderRadius: 8 },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  userInfo: { flex: 1, gap: 1 },
  userName: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  userEmail: { fontSize: 11, fontFamily: 'Nunito_400Regular' },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 20,
    marginTop: 2,
  },
  rolePillText: { fontSize: 9, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase' },
  userActions: { gap: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionText: { fontSize: 11, fontFamily: 'Nunito_700Bold' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 11, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  categoriesSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  submitBtn: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
});
