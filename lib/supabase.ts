import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { return Promise.resolve(localStorage.getItem(key)); } catch { return Promise.resolve(null); }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Provide ws transport for Node.js < 22 (Expo Router SSR context)
let wsTransport: any;
if (Platform.OS === 'web' && typeof window === 'undefined') {
  try {
    const wsName = 'ws';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    wsTransport = require(wsName);
  } catch {}
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: wsTransport ? { transport: wsTransport } : undefined,
});

export const isSupabaseConfigured =
  !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
