import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem, Restaurant } from '@/data/mockData';

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  restaurant: Restaurant | null;
  addItem: (item: MenuItem, restaurant: Restaurant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('cart').then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setItems(parsed.items ?? []);
          setRestaurant(parsed.restaurant ?? null);
        } catch {}
      }
    });
  }, []);

  const save = useCallback((newItems: CartItem[], newRestaurant: Restaurant | null) => {
    AsyncStorage.setItem('cart', JSON.stringify({ items: newItems, restaurant: newRestaurant }));
  }, []);

  const addItem = useCallback((menuItem: MenuItem, rest: Restaurant) => {
    setItems((prev) => {
      let next: CartItem[];
      const existing = prev.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        next = prev.map((i) =>
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        next = [...prev, { menuItem, quantity: 1 }];
      }
      save(next, rest);
      return next;
    });
    setRestaurant(rest);
  }, [save]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.menuItem.id !== itemId);
      if (next.length === 0) {
        setRestaurant(null);
        save([], null);
      } else {
        save(next, restaurant);
      }
      return next;
    });
  }, [save, restaurant]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) => {
      const next = prev.map((i) =>
        i.menuItem.id === itemId ? { ...i, quantity } : i
      );
      save(next, restaurant);
      return next;
    });
  }, [removeItem, save, restaurant]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurant(null);
    AsyncStorage.removeItem('cart');
  }, []);

  const total = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, restaurant, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
