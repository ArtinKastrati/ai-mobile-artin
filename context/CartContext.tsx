import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem, Restaurant } from '@/data/mockData';

export type SelectedModifier = {
  groupTitle: string;
  choiceName: string;
  price: number;
};

export type CartItem = {
  id: string; // unique item id: menuItem.id + JSON.stringify(sortedModifiers) + instructions
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  specialInstructions?: string;
};

type CartContextType = {
  items: CartItem[];
  restaurant: Restaurant | null;
  addItem: (item: MenuItem, restaurant: Restaurant, modifiers?: SelectedModifier[], instructions?: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  clearAndAddItem: (item: MenuItem, restaurant: Restaurant, modifiers?: SelectedModifier[], instructions?: string, quantity?: number) => void;
  reorderItems: (
    items: { menuItem: MenuItem; quantity: number; selectedModifiers?: SelectedModifier[]; specialInstructions?: string }[],
    restaurant: Restaurant
  ) => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

const getCartItemId = (menuItem: MenuItem, modifiers?: SelectedModifier[], instructions?: string) => {
  const sortedMods = modifiers 
    ? [...modifiers].sort((a, b) => (a.groupTitle + a.choiceName).localeCompare(b.groupTitle + b.choiceName))
    : [];
  const modsString = JSON.stringify(sortedMods);
  const instString = instructions ? instructions.trim() : '';
  return `${menuItem.id}_${modsString}_${instString}`;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('cart').then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const loadedItems: CartItem[] = parsed.items ?? [];
          const migratedItems = loadedItems.map((item) => {
            const correctId = getCartItemId(item.menuItem, item.selectedModifiers, item.specialInstructions);
            if (item.id !== correctId) {
              return {
                ...item,
                id: correctId,
              };
            }
            return item;
          });
          setItems(migratedItems);
          setRestaurant(parsed.restaurant ?? null);
        } catch {}
      }
    });
  }, []);

  const save = useCallback((newItems: CartItem[], newRestaurant: Restaurant | null) => {
    AsyncStorage.setItem('cart', JSON.stringify({ items: newItems, restaurant: newRestaurant }));
  }, []);

  const addItem = useCallback((
    menuItem: MenuItem, 
    rest: Restaurant, 
    modifiers?: SelectedModifier[], 
    instructions?: string,
    quantity: number = 1
  ) => {
    setItems((prev) => {
      // Guard against adding items from different restaurants
      if (restaurant && restaurant.id !== rest.id) {
        return prev;
      }
      const uniqueId = getCartItemId(menuItem, modifiers, instructions);
      let next: CartItem[];
      const existing = prev.find((i) => i.id === uniqueId);
      if (existing) {
        next = prev.map((i) =>
          i.id === uniqueId ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        next = [...prev, { id: uniqueId, menuItem, quantity, selectedModifiers: modifiers, specialInstructions: instructions }];
      }
      save(next, rest);
      return next;
    });
    setRestaurant((prevRest) => {
      if (prevRest && prevRest.id !== rest.id) {
        return prevRest;
      }
      return rest;
    });
  }, [save, restaurant]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
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
        i.id === itemId ? { ...i, quantity } : i
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

  const clearAndAddItem = useCallback((
    menuItem: MenuItem, 
    rest: Restaurant, 
    modifiers?: SelectedModifier[], 
    instructions?: string,
    quantity: number = 1
  ) => {
    const uniqueId = getCartItemId(menuItem, modifiers, instructions);
    const next = [{ id: uniqueId, menuItem, quantity, selectedModifiers: modifiers, specialInstructions: instructions }];
    setItems(next);
    setRestaurant(rest);
    save(next, rest);
  }, [save]);

  const reorderItems = useCallback((
    newItems: { menuItem: MenuItem; quantity: number; selectedModifiers?: SelectedModifier[]; specialInstructions?: string }[],
    rest: Restaurant
  ) => {
    const cartItems: CartItem[] = newItems.map((item) => {
      const uniqueId = getCartItemId(item.menuItem, item.selectedModifiers, item.specialInstructions);
      return {
        id: uniqueId,
        menuItem: item.menuItem,
        quantity: item.quantity,
        selectedModifiers: item.selectedModifiers,
        specialInstructions: item.specialInstructions,
      };
    });
    setItems(cartItems);
    setRestaurant(rest);
    save(cartItems, rest);
  }, [save]);

  const total = items.reduce((sum, i) => {
    const modifiersCost = i.selectedModifiers?.reduce((mSum, m) => mSum + m.price, 0) || 0;
    return sum + (i.menuItem.price + modifiersCost) * i.quantity;
  }, 0);
  
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, restaurant, addItem, removeItem, updateQuantity, clearCart, clearAndAddItem, reorderItems, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
