import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restaurant, MenuItem, RESTAURANTS, MENU_ITEMS } from '@/data/mockData';
import { UserRole } from './AuthContext';
import { SelectedModifier } from './CartContext';
import { supabase } from '@/lib/supabase';

export type OrderItemRecord = {
  menuItemId: string;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  specialInstructions?: string;
};

export type Review = {
  id: string;
  restaurantId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

export type Address = {
  id: string;
  label: string;
  details: string;
  notes?: string;
};

export type PaymentMethod = {
  id: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cardType: 'Visa' | 'Mastercard' | 'Generic';
};

export type ProfileDetails = {
  fullName: string;
  email: string;
  avatarUrl?: string;
};

export type Order = {
  id: string;
  restaurantId: string;
  items: string[];
  itemsRaw?: OrderItemRecord[];
  reviewed?: boolean;
  total: number;
  status: 'delivered' | 'preparing' | 'on_the_way' | 'pending' | 'cancelled';
  date: string;
  addressLabel?: string;
  addressDetails?: string;
  discountApplied?: number;
  promoCodeUsed?: string;
  paymentMethod?: string;
};

const DEFAULT_REVIEWS: Review[] = [
  { id: 'rev1', restaurantId: '1', userName: 'John Doe', rating: 5, comment: 'Best burgers in town! Wagyu beef was cooked to perfection.', date: '2 days ago' },
  { id: 'rev2', restaurantId: '1', userName: 'Sarah Jenkins', rating: 4, comment: 'Loved the bacon stack, but fries were a bit cold.', date: '1 week ago' },
  { id: 'rev3', restaurantId: '2', userName: 'Luca Rossi', rating: 5, comment: 'Real wood-fired Neapolitan pizza. Sauce is sweet and authentic.', date: '3 days ago' },
  { id: 'rev4', restaurantId: '2', userName: 'Elena D.', rating: 4, comment: 'Very tasty Margherita, took slightly longer than expected.', date: '5 days ago' },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'o1',
    restaurantId: '1',
    items: ['Classic Smash Burger', 'Crispy Fries'],
    total: 17.98,
    status: 'delivered',
    date: 'Today, 12:30 PM',
    addressLabel: 'Home',
    addressDetails: 'Rruga Nëna Terezë, Pristina',
    paymentMethod: 'Cash on Delivery',
  },
  {
    id: 'o2',
    restaurantId: '2',
    items: ['Margherita', 'Diavola'],
    total: 35.98,
    status: 'on_the_way',
    date: 'Today, 1:15 PM',
    addressLabel: 'Work',
    addressDetails: 'Rruga B, Pristina',
    paymentMethod: 'Visa •••• 4321',
  },
  {
    id: 'o3',
    restaurantId: '3',
    items: ['Dragon Roll', 'Salmon Nigiri (x2)'],
    total: 25.98,
    status: 'preparing',
    date: 'Yesterday, 7:45 PM',
    addressLabel: 'Home',
    addressDetails: 'Rruga Nëna Terezë, Pristina',
    paymentMethod: 'Cash on Delivery',
  },
];

const DEFAULT_ADDRESSES: Address[] = [
  { id: 'a1', label: '🏠 Home', details: 'Rruga Nëna Terezë, Kati 3, Pristina', notes: 'Kodi i hyrjes 4321' },
  { id: 'a2', label: '🏢 Work', details: 'Rruga B, Ndërtesa A2, Pristina', notes: 'Lëre te recepsioni' },
];

const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: 'p1', cardholderName: 'Artin Kastrati', cardNumber: '•••• •••• •••• 4321', expiryDate: '12/28', cardType: 'Visa' },
];

const DEFAULT_PROFILE: ProfileDetails = {
  fullName: 'Artin Kastrati',
  email: 'artin@test.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
};

// ── Supabase row mappers ──────────────────────────────────────────────────────

function mapDbRestaurant(r: any): Restaurant {
  return {
    id: r.id,
    name: r.name,
    cuisine: r.cuisine,
    rating: r.rating,
    reviewCount: r.review_count,
    deliveryTime: r.delivery_time,
    deliveryFee: r.delivery_fee,
    minOrder: r.min_order,
    imageUrl: r.image_url,
    categories: r.categories ?? [],
    featured: r.featured ?? false,
    priceRange: r.price_range,
    description: r.description,
  };
}

function mapDbMenuItem(m: any): MenuItem {
  return {
    id: m.id,
    restaurantId: m.restaurant_id,
    name: m.name,
    description: m.description,
    price: m.price,
    imageUrl: m.image_url,
    category: m.category,
    popular: m.popular ?? false,
    modifierGroups: m.modifier_groups ?? undefined,
  };
}

function mapDbOrder(o: any): Order {
  return {
    id: o.id,
    restaurantId: o.restaurant_id,
    items: o.items ?? [],
    itemsRaw: o.items_raw ?? undefined,
    reviewed: o.reviewed ?? false,
    total: o.total,
    status: o.status,
    date: o.date,
    addressLabel: o.address_label ?? undefined,
    addressDetails: o.address_details ?? undefined,
    discountApplied: o.discount_applied ?? undefined,
    promoCodeUsed: o.promo_code_used ?? undefined,
    paymentMethod: o.payment_method ?? undefined,
  };
}

function mapDbReview(r: any): Review {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    userName: r.user_name,
    rating: r.rating,
    comment: r.comment,
    date: r.date,
  };
}

// ── Context type ──────────────────────────────────────────────────────────────

interface DataContextType {
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
  favorites: string[];
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  profileDetails: ProfileDetails;
  simulatedRole: UserRole;
  simulatedRestaurantId: string;
  isLoading: boolean;
  isOffline: boolean;
  refreshData: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  addRestaurant: (restaurant: Omit<Restaurant, 'id'>) => void;
  updateRestaurant: (restaurant: Restaurant) => void;
  deleteRestaurant: (id: string) => void;
  addOrder: (
    restaurantId: string,
    items: string[],
    total: number,
    addressLabel?: string,
    addressDetails?: string,
    discountApplied?: number,
    promoCodeUsed?: string,
    paymentMethod?: string,
    itemsRaw?: OrderItemRecord[]
  ) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  toggleFavorite: (restaurantId: string) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  addPaymentMethod: (card: { cardholderName: string; cardNumber: string; expiryDate: string }) => void;
  deletePaymentMethod: (id: string) => void;
  updateProfileDetails: (profile: ProfileDetails) => void;
  setSimulatedRole: (role: UserRole) => void;
  setSimulatedRestaurantId: (id: string) => void;
  submitReview: (restaurantId: string, rating: number, comment: string) => void;
  markOrderReviewed: (orderId: string) => void;
  reviews: Review[];
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>(DEFAULT_PROFILE);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [simulatedRole, setSimulatedRoleState] = useState<UserRole>('client');
  const [simulatedRestaurantId, setSimulatedRestaurantIdState] = useState<string>('1');

  const getCurrentUserId = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  };

  const fetchUserSpecificData = async (userId: string) => {
    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData.map(mapDbOrder));

      const { data: favsData } = await supabase
        .from('user_favorites')
        .select('restaurant_id')
        .eq('user_id', userId);
      if (favsData) setFavorites(favsData.map((f: any) => f.restaurant_id));

      const { data: addrData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId);
      if (addrData && addrData.length > 0) {
        setAddresses(addrData.map((a: any) => ({
          id: a.id,
          label: a.label,
          details: a.details,
          notes: a.notes ?? undefined,
        })));
      }
    } catch (e) {
      console.error('DataContext: error fetching user data', e);
    }
  };

  // ── Seeding helpers ────────────────────────────────────────────────────────

  const seedRestaurantsToSupabase = async () => {
    const rows = RESTAURANTS.map((r) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      review_count: r.reviewCount,
      delivery_time: r.deliveryTime,
      delivery_fee: r.deliveryFee,
      min_order: r.minOrder,
      image_url: r.imageUrl,
      categories: r.categories,
      featured: r.featured ?? false,
      price_range: r.priceRange,
      description: r.description,
    }));
    await supabase.from('restaurants').upsert(rows, { onConflict: 'id' });
  };

  const seedMenuItemsToSupabase = async () => {
    const rows = MENU_ITEMS.map((m) => ({
      id: m.id,
      restaurant_id: m.restaurantId,
      name: m.name,
      description: m.description,
      price: m.price,
      image_url: m.imageUrl,
      category: m.category,
      popular: m.popular ?? false,
      modifier_groups: m.modifierGroups ?? null,
    }));
    await supabase.from('menu_items').upsert(rows, { onConflict: 'id' });
  };

  const seedReviewsToSupabase = async () => {
    const rows = DEFAULT_REVIEWS.map((r) => ({
      id: r.id,
      restaurant_id: r.restaurantId,
      user_name: r.userName,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
    }));
    await supabase.from('reviews').upsert(rows, { onConflict: 'id' });
  };

  // ── Auth state change listener ───────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserSpecificData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setOrders([]);
        setFavorites([]);
        setAddresses([]);
        saveToStorage('app_orders', []);
        saveToStorage('app_favorites', []);
        saveToStorage('app_addresses', []);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Initial load + manual refresh ───────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
        // Always upsert mock data so new restaurants/items appear immediately
        await seedRestaurantsToSupabase();
        await seedMenuItemsToSupabase();

        // Restaurants ─ fetch all from Supabase (includes admin-added ones too)
        const { data: restData, error: restErr } = await supabase
          .from('restaurants')
          .select('*')
          .order('name');

        if (!restErr && restData && restData.length > 0) {
          setRestaurants(restData.map(mapDbRestaurant));
        } else {
          setRestaurants(RESTAURANTS);
        }

        // Menu items ─ fetch all from Supabase
        const { data: menuData, error: menuErr } = await supabase
          .from('menu_items')
          .select('*');

        if (!menuErr && menuData && menuData.length > 0) {
          setMenuItems(menuData.map(mapDbMenuItem));
        } else {
          setMenuItems(MENU_ITEMS);
        }

        // Reviews ─ fetch from Supabase, seed if empty
        const { data: reviewsData, error: reviewErr } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (!reviewErr && reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData.map(mapDbReview));
        } else {
          await seedReviewsToSupabase();
          setReviews(DEFAULT_REVIEWS);
        }

        // User-specific data ─ requires authenticated session
        const userId = await getCurrentUserId();

        // Orders
        if (userId) {
          const { data: ordersData, error: ordersErr } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!ordersErr && ordersData) {
            setOrders(ordersData.map(mapDbOrder));
          } else {
            // Authenticated users always start empty on Supabase failure — never show fake orders
            setOrders([]);
          }
        } else {
          // Guest — no orders
          setOrders([]);
        }

        // Favorites
        if (userId) {
          const { data: favsData } = await supabase
            .from('user_favorites')
            .select('restaurant_id')
            .eq('user_id', userId);

          setFavorites(favsData ? favsData.map((f: any) => f.restaurant_id) : []);
        } else {
          const stored = await AsyncStorage.getItem('app_favorites');
          setFavorites(stored ? JSON.parse(stored) : []);
        }

        // Addresses
        if (userId) {
          const { data: addrData, error: addrErr } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', userId);

          if (!addrErr && addrData && addrData.length > 0) {
            setAddresses(addrData.map((a: any) => ({
              id: a.id,
              label: a.label,
              details: a.details,
              notes: a.notes ?? undefined,
            })));
          } else {
            const stored = await AsyncStorage.getItem('app_addresses');
            setAddresses(stored ? JSON.parse(stored) : DEFAULT_ADDRESSES);
          }
        } else {
          const stored = await AsyncStorage.getItem('app_addresses');
          setAddresses(stored ? JSON.parse(stored) : DEFAULT_ADDRESSES);
        }

        // Payment methods ─ local only (do not store card data in DB)
        const storedPay = await AsyncStorage.getItem('app_payment_methods');
        setPaymentMethods(storedPay ? JSON.parse(storedPay) : DEFAULT_PAYMENTS);

        // Profile details (local cache; authoritative data is in Supabase profiles)
        const storedProfile = await AsyncStorage.getItem('app_profile_details');
        setProfileDetails(storedProfile ? JSON.parse(storedProfile) : DEFAULT_PROFILE);

        // Developer simulation state
        const storedRole = await AsyncStorage.getItem('app_simulated_role');
        setSimulatedRoleState((storedRole as UserRole) || 'client');
        const storedSimRestId = await AsyncStorage.getItem('app_simulated_rest_id');
        setSimulatedRestaurantIdState(storedSimRestId || '1');

      } catch (e) {
        console.error('DataContext: error loading data', e);
        setIsOffline(true);
        setRestaurants(RESTAURANTS);
        setMenuItems(MENU_ITEMS);
        setOrders(DEFAULT_ORDERS);
        setFavorites([]);
        setAddresses(DEFAULT_ADDRESSES);
        setPaymentMethods(DEFAULT_PAYMENTS);
        setProfileDetails(DEFAULT_PROFILE);
        setSimulatedRoleState('client');
        setSimulatedRestaurantIdState('1');
        setReviews(DEFAULT_REVIEWS);
      } finally {
        setIsLoading(false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadData(); }, []);

  // ── Local storage helper ────────────────────────────────────────────────────

  const saveToStorage = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`DataContext: error saving ${key}`, e);
    }
  };

  // ── Menu item CRUD ──────────────────────────────────────────────────────────

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = { ...item, id: 'm_' + Date.now() };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);

    await supabase.from('menu_items').insert({
      id: newItem.id,
      restaurant_id: newItem.restaurantId,
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      image_url: newItem.imageUrl,
      category: newItem.category,
      popular: newItem.popular ?? false,
      modifier_groups: newItem.modifierGroups ?? null,
    });
  };

  const updateMenuItem = async (item: MenuItem) => {
    const updated = menuItems.map((m) => (m.id === item.id ? item : m));
    setMenuItems(updated);

    await supabase.from('menu_items').update({
      restaurant_id: item.restaurantId,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.imageUrl,
      category: item.category,
      popular: item.popular ?? false,
      modifier_groups: item.modifierGroups ?? null,
    }).eq('id', item.id);
  };

  const deleteMenuItem = async (id: string) => {
    const updated = menuItems.filter((m) => m.id !== id);
    setMenuItems(updated);
    await supabase.from('menu_items').delete().eq('id', id);
  };

  // ── Restaurant CRUD ─────────────────────────────────────────────────────────

  const addRestaurant = async (restaurant: Omit<Restaurant, 'id'>) => {
    const newRest: Restaurant = { ...restaurant, id: 'r_' + Date.now() };
    const updated = [...restaurants, newRest];
    setRestaurants(updated);

    await supabase.from('restaurants').insert({
      id: newRest.id,
      name: newRest.name,
      cuisine: newRest.cuisine,
      rating: newRest.rating,
      review_count: newRest.reviewCount,
      delivery_time: newRest.deliveryTime,
      delivery_fee: newRest.deliveryFee,
      min_order: newRest.minOrder,
      image_url: newRest.imageUrl,
      categories: newRest.categories,
      featured: newRest.featured ?? false,
      price_range: newRest.priceRange,
      description: newRest.description,
    });
  };

  const updateRestaurant = async (restaurant: Restaurant) => {
    const updated = restaurants.map((r) => (r.id === restaurant.id ? restaurant : r));
    setRestaurants(updated);

    await supabase.from('restaurants').update({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating,
      review_count: restaurant.reviewCount,
      delivery_time: restaurant.deliveryTime,
      delivery_fee: restaurant.deliveryFee,
      min_order: restaurant.minOrder,
      image_url: restaurant.imageUrl,
      categories: restaurant.categories,
      featured: restaurant.featured ?? false,
      price_range: restaurant.priceRange,
      description: restaurant.description,
    }).eq('id', restaurant.id);
  };

  const deleteRestaurant = async (id: string) => {
    const updatedRest = restaurants.filter((r) => r.id !== id);
    const updatedMenu = menuItems.filter((m) => m.restaurantId !== id);
    setRestaurants(updatedRest);
    setMenuItems(updatedMenu);
    await supabase.from('menu_items').delete().eq('restaurant_id', id);
    await supabase.from('restaurants').delete().eq('id', id);
  };

  // ── Orders ──────────────────────────────────────────────────────────────────

  const addOrder = async (
    restaurantId: string,
    itemNames: string[],
    total: number,
    addressLabel?: string,
    addressDetails?: string,
    discountApplied?: number,
    promoCodeUsed?: string,
    paymentMethod?: string,
    itemsRaw?: OrderItemRecord[]
  ) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString =
      now.toLocaleDateString() === new Date().toLocaleDateString()
        ? `Today, ${timeString}`
        : `${now.toLocaleDateString()}, ${timeString}`;

    const newOrder: Order = {
      id: 'o_' + Date.now(),
      restaurantId,
      items: itemNames,
      itemsRaw,
      reviewed: false,
      total,
      status: 'pending',
      date: dateString,
      addressLabel,
      addressDetails,
      discountApplied,
      promoCodeUsed,
      paymentMethod,
    };

    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveToStorage('app_orders', updated);

    const userId = await getCurrentUserId();
    if (userId) {
      await supabase.from('orders').insert({
        id: newOrder.id,
        user_id: userId,
        restaurant_id: newOrder.restaurantId,
        items: newOrder.items,
        items_raw: newOrder.itemsRaw ?? null,
        reviewed: false,
        total: newOrder.total,
        status: newOrder.status,
        date: newOrder.date,
        address_label: newOrder.addressLabel ?? null,
        address_details: newOrder.addressDetails ?? null,
        discount_applied: newOrder.discountApplied ?? null,
        promo_code_used: newOrder.promoCodeUsed ?? null,
        payment_method: newOrder.paymentMethod ?? null,
      });
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(updated);
    saveToStorage('app_orders', updated);
    await supabase.from('orders').update({ status }).eq('id', id);
  };

  // ── Reviews ─────────────────────────────────────────────────────────────────

  const submitReview = useCallback(async (restaurantId: string, stars: number, comment: string) => {
    // Update local restaurant rating
    setRestaurants((prev) => {
      const next = prev.map((rest) => {
        if (rest.id === restaurantId) {
          const newCount = rest.reviewCount + 1;
          const newRating = Number(
            ((rest.rating * rest.reviewCount + stars) / newCount).toFixed(1)
          );
          return { ...rest, reviewCount: newCount, rating: newRating };
        }
        return rest;
      });

      // Persist updated rating to Supabase
      const target = next.find((r) => r.id === restaurantId);
      if (target) {
        supabase
          .from('restaurants')
          .update({ rating: target.rating, review_count: target.reviewCount })
          .eq('id', restaurantId);
      }

      return next;
    });

    const newReview: Review = {
      id: 'rev_' + Date.now(),
      restaurantId,
      userName: profileDetails.fullName || 'Anonymous',
      rating: stars,
      comment,
      date: 'Just now',
    };

    setReviews((prev) => [newReview, ...prev]);

    await supabase.from('reviews').insert({
      id: newReview.id,
      restaurant_id: newReview.restaurantId,
      user_name: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: newReview.date,
    });
  }, [profileDetails.fullName]);

  const markOrderReviewed = useCallback(async (orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((order) =>
        order.id === orderId ? { ...order, reviewed: true } : order
      );
      saveToStorage('app_orders', next);
      return next;
    });
    await supabase.from('orders').update({ reviewed: true }).eq('id', orderId);
  }, []);

  // ── Favorites ───────────────────────────────────────────────────────────────

  const toggleFavorite = async (restaurantId: string) => {
    const isFav = favorites.includes(restaurantId);
    const updated = isFav
      ? favorites.filter((id) => id !== restaurantId)
      : [...favorites, restaurantId];

    setFavorites(updated);
    saveToStorage('app_favorites', updated);

    const userId = await getCurrentUserId();
    if (userId) {
      if (isFav) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('restaurant_id', restaurantId);
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: userId, restaurant_id: restaurantId });
      }
    }
  };

  // ── Addresses ───────────────────────────────────────────────────────────────

  const addAddress = async (address: Omit<Address, 'id'>) => {
    const newAddress: Address = { ...address, id: 'a_' + Date.now() };
    const updated = [...addresses, newAddress];
    setAddresses(updated);
    saveToStorage('app_addresses', updated);

    const userId = await getCurrentUserId();
    if (userId) {
      await supabase.from('user_addresses').insert({
        id: newAddress.id,
        user_id: userId,
        label: newAddress.label,
        details: newAddress.details,
        notes: newAddress.notes ?? null,
      });
    }
  };

  const updateAddress = async (address: Address) => {
    const updated = addresses.map((a) => (a.id === address.id ? address : a));
    setAddresses(updated);
    saveToStorage('app_addresses', updated);

    await supabase.from('user_addresses').update({
      label: address.label,
      details: address.details,
      notes: address.notes ?? null,
    }).eq('id', address.id);
  };

  const deleteAddress = async (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    saveToStorage('app_addresses', updated);
    await supabase.from('user_addresses').delete().eq('id', id);
  };

  // ── Payment methods (local only) ────────────────────────────────────────────

  const addPaymentMethod = (card: { cardholderName: string; cardNumber: string; expiryDate: string }) => {
    const cleanNum = card.cardNumber.replace(/\s/g, '');
    const last4 = cleanNum.slice(-4);
    const cardType = cleanNum.startsWith('4')
      ? 'Visa'
      : cleanNum.startsWith('5')
      ? 'Mastercard'
      : 'Generic';

    const newCard: PaymentMethod = {
      id: 'pm_' + Date.now(),
      cardholderName: card.cardholderName,
      cardNumber: `•••• •••• •••• ${last4}`,
      expiryDate: card.expiryDate,
      cardType,
    };
    const updated = [...paymentMethods, newCard];
    setPaymentMethods(updated);
    saveToStorage('app_payment_methods', updated);
  };

  const deletePaymentMethod = (id: string) => {
    const updated = paymentMethods.filter((pm) => pm.id !== id);
    setPaymentMethods(updated);
    saveToStorage('app_payment_methods', updated);
  };

  // ── Profile ─────────────────────────────────────────────────────────────────

  const updateProfileDetails = (profile: ProfileDetails) => {
    setProfileDetails(profile);
    saveToStorage('app_profile_details', profile);
  };

  // ── Role simulation ─────────────────────────────────────────────────────────

  const setSimulatedRole = (role: UserRole) => {
    setSimulatedRoleState(role);
    saveToStorage('app_simulated_role', role);
  };

  const setSimulatedRestaurantId = (id: string) => {
    setSimulatedRestaurantIdState(id);
    saveToStorage('app_simulated_rest_id', id);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetData = async () => {
    setRestaurants(RESTAURANTS);
    setMenuItems(MENU_ITEMS);
    setOrders(DEFAULT_ORDERS);
    setFavorites([]);
    setAddresses(DEFAULT_ADDRESSES);
    setPaymentMethods(DEFAULT_PAYMENTS);
    setProfileDetails(DEFAULT_PROFILE);
    setSimulatedRoleState('client');
    setSimulatedRestaurantIdState('1');
    setReviews(DEFAULT_REVIEWS);

    // Re-seed Supabase
    await seedRestaurantsToSupabase();
    await seedMenuItemsToSupabase();
    await seedReviewsToSupabase();

    await AsyncStorage.multiRemove([
      'app_orders',
      'app_favorites',
      'app_addresses',
      'app_payment_methods',
      'app_profile_details',
      'app_simulated_role',
      'app_simulated_rest_id',
      'app_reviews',
    ]);
  };

  return (
    <DataContext.Provider value={{
      restaurants,
      menuItems,
      orders,
      favorites,
      addresses,
      paymentMethods,
      profileDetails,
      simulatedRole,
      simulatedRestaurantId,
      isLoading,
      isOffline,
      refreshData: loadData,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      addOrder,
      updateOrderStatus,
      toggleFavorite,
      addAddress,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateProfileDetails,
      setSimulatedRole,
      setSimulatedRestaurantId,
      submitReview,
      markOrderReviewed,
      reviews,
      resetData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}
