export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  imageUrl: string;
  categories: string[];
  featured?: boolean;
  priceRange: '$' | '$$' | '$$$';
  description: string;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  popular?: boolean;
};

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'burger', name: 'Burgers', icon: 'fast-food' },
  { id: 'pizza', name: 'Pizza', icon: 'pizza' },
  { id: 'sushi', name: 'Sushi', icon: 'fish' },
  { id: 'salad', name: 'Healthy', icon: 'leaf' },
  { id: 'dessert', name: 'Desserts', icon: 'ice-cream' },
  { id: 'coffee', name: 'Coffee', icon: 'cafe' },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Smoke & Fire Burgers',
    cuisine: 'American • Burgers',
    rating: 4.8,
    reviewCount: 1234,
    deliveryTime: '15-25 min',
    deliveryFee: 1.99,
    minOrder: 10,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
    categories: ['burger'],
    featured: true,
    priceRange: '$$',
    description: 'Gourmet smash burgers made with 100% Wagyu beef.',
  },
  {
    id: '2',
    name: 'Napoli Pizza Co.',
    cuisine: 'Italian • Pizza',
    rating: 4.6,
    reviewCount: 892,
    deliveryTime: '20-35 min',
    deliveryFee: 0,
    minOrder: 12,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop',
    categories: ['pizza'],
    featured: true,
    priceRange: '$$',
    description: 'Authentic Neapolitan pizza baked in a wood-fired oven.',
  },
  {
    id: '3',
    name: 'Sakura Sushi Bar',
    cuisine: 'Japanese • Sushi',
    rating: 4.9,
    reviewCount: 567,
    deliveryTime: '25-40 min',
    deliveryFee: 2.99,
    minOrder: 20,
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&auto=format&fit=crop',
    categories: ['sushi'],
    priceRange: '$$$',
    description: 'Premium omakase-style sushi delivered to your door.',
  },
  {
    id: '4',
    name: 'Green Bowl Kitchen',
    cuisine: 'Healthy • Salads',
    rating: 4.5,
    reviewCount: 423,
    deliveryTime: '10-20 min',
    deliveryFee: 1.49,
    minOrder: 8,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
    categories: ['salad'],
    priceRange: '$$',
    description: 'Fresh, nutritious bowls and salads made daily.',
  },
  {
    id: '5',
    name: 'Sweet Tooth Bakery',
    cuisine: 'Desserts • Bakery',
    rating: 4.7,
    reviewCount: 789,
    deliveryTime: '15-30 min',
    deliveryFee: 0.99,
    minOrder: 6,
    imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&auto=format&fit=crop',
    categories: ['dessert'],
    priceRange: '$',
    description: 'Artisan cakes, cookies, and pastries baked fresh every morning.',
  },
  {
    id: '6',
    name: 'Brew & Grind Cafe',
    cuisine: 'Coffee • Snacks',
    rating: 4.4,
    reviewCount: 312,
    deliveryTime: '10-15 min',
    deliveryFee: 1.99,
    minOrder: 5,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop',
    categories: ['coffee'],
    priceRange: '$',
    description: 'Specialty coffee and artisan sandwiches.',
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Smoke & Fire Burgers
  {
    id: 'm1',
    restaurantId: '1',
    name: 'Classic Smash Burger',
    description: 'Double patty, cheddar, special sauce, pickles, onions',
    price: 12.99,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop',
    category: 'Burgers',
    popular: true,
  },
  {
    id: 'm2',
    restaurantId: '1',
    name: 'BBQ Bacon Stack',
    description: 'Triple patty, bacon, BBQ sauce, fried onions, jalapeños',
    price: 15.99,
    imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&auto=format&fit=crop',
    category: 'Burgers',
    popular: true,
  },
  {
    id: 'm3',
    restaurantId: '1',
    name: 'Mushroom Swiss',
    description: 'Single patty, Swiss cheese, sautéed mushrooms, truffle aioli',
    price: 13.49,
    imageUrl: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&auto=format&fit=crop',
    category: 'Burgers',
  },
  {
    id: 'm4',
    restaurantId: '1',
    name: 'Crispy Fries',
    description: 'Hand-cut golden fries with house seasoning',
    price: 4.99,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop',
    category: 'Sides',
  },
  // Napoli Pizza
  {
    id: 'm5',
    restaurantId: '2',
    name: 'Margherita',
    description: 'San Marzano tomato, fior di latte, fresh basil, EVO',
    price: 16.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop',
    category: 'Pizzas',
    popular: true,
  },
  {
    id: 'm6',
    restaurantId: '2',
    name: 'Diavola',
    description: 'Spicy salami, mozzarella, chilli, tomato',
    price: 18.99,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop',
    category: 'Pizzas',
    popular: true,
  },
  {
    id: 'm7',
    restaurantId: '2',
    name: 'Quattro Stagioni',
    description: 'Ham, mushrooms, artichokes, olives, egg',
    price: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop',
    category: 'Pizzas',
  },
  // Sakura Sushi
  {
    id: 'm8',
    restaurantId: '3',
    name: 'Salmon Nigiri (x2)',
    description: 'Premium Atlantic salmon on seasoned sushi rice',
    price: 8.99,
    imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&auto=format&fit=crop',
    category: 'Nigiri',
    popular: true,
  },
  {
    id: 'm9',
    restaurantId: '3',
    name: 'Dragon Roll',
    description: 'Shrimp tempura, avocado, topped with tuna, spicy mayo',
    price: 16.99,
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&auto=format&fit=crop',
    category: 'Rolls',
    popular: true,
  },
  // Green Bowl
  {
    id: 'm10',
    restaurantId: '4',
    name: 'Power Greens Bowl',
    description: 'Quinoa, kale, avocado, chickpeas, tahini dressing',
    price: 13.99,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop',
    category: 'Bowls',
    popular: true,
  },
  // Sweet Tooth
  {
    id: 'm11',
    restaurantId: '5',
    name: 'Chocolate Lava Cake',
    description: 'Warm molten chocolate cake with vanilla ice cream',
    price: 7.99,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop',
    category: 'Cakes',
    popular: true,
  },
  // Brew & Grind
  {
    id: 'm12',
    restaurantId: '6',
    name: 'Flat White',
    description: 'Double ristretto, velvety steamed milk',
    price: 5.49,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop',
    category: 'Coffee',
    popular: true,
  },
];
