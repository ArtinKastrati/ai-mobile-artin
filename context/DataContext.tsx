import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restaurant, MenuItem, RESTAURANTS, MENU_ITEMS } from '@/data/mockData';
import { UserRole } from './AuthContext';
import { SelectedModifier } from './CartContext';

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
  label: string; // e.g. "Home", "Work", "Office"
  details: string; // e.g. "Rruga Nëna Terezë, Pristina"
  notes?: string;
};

export type PaymentMethod = {
  id: string;
  cardholderName: string;
  cardNumber: string; // e.g. "•••• •••• •••• 4321"
  expiryDate: string; // MM/YY
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
  paymentMethod?: string; // e.g. "Cash on Delivery", "Visa •••• 4321"
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

  // Role simulation states (for developer local checks)
  const [simulatedRole, setSimulatedRoleState] = useState<UserRole>('client');
  const [simulatedRestaurantId, setSimulatedRestaurantIdState] = useState<string>('1');

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedRest = await AsyncStorage.getItem('app_restaurants');
        const storedMenu = await AsyncStorage.getItem('app_menu_items');
        const storedOrders = await AsyncStorage.getItem('app_orders');
        const storedFavs = await AsyncStorage.getItem('app_favorites');
        const storedAddr = await AsyncStorage.getItem('app_addresses');
        const storedPay = await AsyncStorage.getItem('app_payment_methods');
        const storedProfile = await AsyncStorage.getItem('app_profile_details');
        const storedRole = await AsyncStorage.getItem('app_simulated_role');
        const storedSimRestId = await AsyncStorage.getItem('app_simulated_rest_id');
        const storedReviews = await AsyncStorage.getItem('app_reviews');

        if (storedReviews) {
          setReviews(JSON.parse(storedReviews));
        } else {
          setReviews(DEFAULT_REVIEWS);
          await AsyncStorage.setItem('app_reviews', JSON.stringify(DEFAULT_REVIEWS));
        }

        if (storedRest) {
          const parsed = JSON.parse(storedRest) as Restaurant[];
          const migrated = parsed.map((rest) => {
            const fresh = RESTAURANTS.find((r) => r.id === rest.id);
            if (fresh && rest.reviewCount > 20) {
              return {
                ...rest,
                reviewCount: fresh.reviewCount,
              };
            }
            return rest;
          });
          setRestaurants(migrated);
        } else {
          setRestaurants(RESTAURANTS);
          await AsyncStorage.setItem('app_restaurants', JSON.stringify(RESTAURANTS));
        }

        if (storedMenu) {
          const parsed = JSON.parse(storedMenu) as MenuItem[];
          const merged = parsed.map((item) => {
            const fresh = MENU_ITEMS.find((m) => m.id === item.id);
            if (fresh && fresh.modifierGroups) {
              return { ...item, modifierGroups: fresh.modifierGroups };
            }
            return item;
          });
          setMenuItems(merged);
        } else {
          setMenuItems(MENU_ITEMS);
          await AsyncStorage.setItem('app_menu_items', JSON.stringify(MENU_ITEMS));
        }

        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        } else {
          setOrders(DEFAULT_ORDERS);
          await AsyncStorage.setItem('app_orders', JSON.stringify(DEFAULT_ORDERS));
        }

        if (storedFavs) {
          setFavorites(JSON.parse(storedFavs));
        } else {
          setFavorites([]);
          await AsyncStorage.setItem('app_favorites', JSON.stringify([]));
        }

        if (storedAddr) {
          setAddresses(JSON.parse(storedAddr));
        } else {
          setAddresses(DEFAULT_ADDRESSES);
          await AsyncStorage.setItem('app_addresses', JSON.stringify(DEFAULT_ADDRESSES));
        }

        if (storedPay) {
          setPaymentMethods(JSON.parse(storedPay));
        } else {
          setPaymentMethods(DEFAULT_PAYMENTS);
          await AsyncStorage.setItem('app_payment_methods', JSON.stringify(DEFAULT_PAYMENTS));
        }

        if (storedProfile) {
          setProfileDetails(JSON.parse(storedProfile));
        } else {
          setProfileDetails(DEFAULT_PROFILE);
          await AsyncStorage.setItem('app_profile_details', JSON.stringify(DEFAULT_PROFILE));
        }

        if (storedRole) {
          setSimulatedRoleState(storedRole as UserRole);
        } else {
          setSimulatedRoleState('client');
          await AsyncStorage.setItem('app_simulated_role', 'client');
        }

        if (storedSimRestId) {
          setSimulatedRestaurantIdState(storedSimRestId);
        } else {
          setSimulatedRestaurantIdState('1');
          await AsyncStorage.setItem('app_simulated_rest_id', '1');
        }
      } catch (e) {
        console.error('Error loading data context', e);
        setRestaurants(RESTAURANTS);
        setMenuItems(MENU_ITEMS);
        setOrders(DEFAULT_ORDERS);
        setFavorites([]);
        setAddresses(DEFAULT_ADDRESSES);
        setPaymentMethods(DEFAULT_PAYMENTS);
        setProfileDetails(DEFAULT_PROFILE);
        setSimulatedRoleState('client');
        setSimulatedRestaurantIdState('1');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const saveToStorage = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to storage`, e);
    }
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + Date.now(),
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    saveToStorage('app_menu_items', updated);
  };

  const updateMenuItem = (item: MenuItem) => {
    const updated = menuItems.map((m) => (m.id === item.id ? item : m));
    setMenuItems(updated);
    saveToStorage('app_menu_items', updated);
  };

  const deleteMenuItem = (id: string) => {
    const updated = menuItems.filter((m) => m.id !== id);
    setMenuItems(updated);
    saveToStorage('app_menu_items', updated);
  };

  const addRestaurant = (restaurant: Omit<Restaurant, 'id'>) => {
    const newRest: Restaurant = {
      ...restaurant,
      id: 'r_' + Date.now(),
    };
    const updated = [...restaurants, newRest];
    setRestaurants(updated);
    saveToStorage('app_restaurants', updated);
  };

  const updateRestaurant = (restaurant: Restaurant) => {
    const updated = restaurants.map((r) => (r.id === restaurant.id ? restaurant : r));
    setRestaurants(updated);
    saveToStorage('app_restaurants', updated);
  };

  const deleteRestaurant = (id: string) => {
    const updated = restaurants.filter((r) => r.id !== id);
    const updatedMenu = menuItems.filter((m) => m.restaurantId !== id);
    setRestaurants(updated);
    setMenuItems(updatedMenu);
    saveToStorage('app_restaurants', updated);
    saveToStorage('app_menu_items', updatedMenu);
  };

  const addOrder = (
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
    const dateString = now.toLocaleDateString() === new Date().toLocaleDateString() 
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
  };

  const submitReview = useCallback((restaurantId: string, stars: number, comment: string) => {
    setRestaurants((prev) => {
      const next = prev.map((rest) => {
        if (rest.id === restaurantId) {
          const newCount = rest.reviewCount + 1;
          const newRating = ((rest.rating * rest.reviewCount) + stars) / newCount;
          return {
            ...rest,
            reviewCount: newCount,
            rating: Number(newRating.toFixed(1)),
          };
        }
        return rest;
      });
      saveToStorage('app_restaurants', next);
      return next;
    });

    setReviews((prev) => {
      const newReview: Review = {
        id: 'rev_' + Date.now(),
        restaurantId,
        userName: profileDetails.fullName || 'Anonymous',
        rating: stars,
        comment,
        date: 'Just now',
      };
      const next = [newReview, ...prev];
      saveToStorage('app_reviews', next);
      return next;
    });
  }, [profileDetails.fullName]);

  const markOrderReviewed = useCallback((orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            reviewed: true,
          };
        }
        return order;
      });
      saveToStorage('app_orders', next);
      return next;
    });
  }, []);

  const updateOrderStatus = (id: string, status: Order['status']) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(updated);
    saveToStorage('app_orders', updated);
  };

  const toggleFavorite = (restaurantId: string) => {
    let updated: string[];
    if (favorites.includes(restaurantId)) {
      updated = favorites.filter((id) => id !== restaurantId);
    } else {
      updated = [...favorites, restaurantId];
    }
    setFavorites(updated);
    saveToStorage('app_favorites', updated);
  };

  const addAddress = (address: Omit<Address, 'id'>) => {
    const newAddress: Address = {
      ...address,
      id: 'a_' + Date.now(),
    };
    const updated = [...addresses, newAddress];
    setAddresses(updated);
    saveToStorage('app_addresses', updated);
  };

  const updateAddress = (address: Address) => {
    const updated = addresses.map((a) => (a.id === address.id ? address : a));
    setAddresses(updated);
    saveToStorage('app_addresses', updated);
  };

  const deleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    saveToStorage('app_addresses', updated);
  };

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

  const updateProfileDetails = (profile: ProfileDetails) => {
    setProfileDetails(profile);
    saveToStorage('app_profile_details', profile);
  };

  const setSimulatedRole = (role: UserRole) => {
    setSimulatedRoleState(role);
    saveToStorage('app_simulated_role', role);
  };

  const setSimulatedRestaurantId = (id: string) => {
    setSimulatedRestaurantIdState(id);
    saveToStorage('app_simulated_rest_id', id);
  };

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
    await AsyncStorage.removeItem('app_restaurants');
    await AsyncStorage.removeItem('app_menu_items');
    await AsyncStorage.removeItem('app_orders');
    await AsyncStorage.removeItem('app_favorites');
    await AsyncStorage.removeItem('app_addresses');
    await AsyncStorage.removeItem('app_payment_methods');
    await AsyncStorage.removeItem('app_profile_details');
    await AsyncStorage.removeItem('app_simulated_role');
    await AsyncStorage.removeItem('app_simulated_rest_id');
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
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
