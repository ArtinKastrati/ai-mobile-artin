import { useEffect, useRef } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { PreferencesProvider, usePreferences } from '@/context/PreferencesContext';
import { DataProvider, useData } from '@/context/DataContext';
import { useColorScheme, View, Text, Platform, StyleSheet } from 'react-native';
import { NotificationProvider, useNotification } from '@/context/NotificationContext';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const systemScheme = useColorScheme();
  let statusStyle: 'dark' | 'light' = 'dark';
  try {
    const { theme } = usePreferences();
    const activeTheme = theme === 'system' ? (systemScheme || 'light') : theme;
    statusStyle = activeTheme === 'dark' ? 'light' : 'dark';
  } catch (e) {
    statusStyle = systemScheme === 'dark' ? 'light' : 'dark';
  }

  const { session, loading: authLoading, isGuestMode } = useAuth();
  const segments = useSegments();
  const { orders, isOffline } = useData();
  const { showNotification } = useNotification();
  const prevOrdersRef = useRef<any[]>([]);

  // Auth gate: redirect unauthenticated non-guest users to the auth screen
  useEffect(() => {
    if (authLoading) return;
    const inAuthScreen = segments[0] === 'auth';
    if (!session && !isGuestMode && !inAuthScreen) {
      router.replace('/auth');
    }
  }, [session, authLoading, isGuestMode, segments]);

  useEffect(() => {
    if (prevOrdersRef.current.length === 0) {
      prevOrdersRef.current = orders;
      return;
    }

    orders.forEach((order) => {
      const prev = prevOrdersRef.current.find((o) => o.id === order.id);
      if (prev && prev.status !== order.status) {
        haptics.notificationWarning();
        let title = 'Order Update';
        let message = `Your order status is now: ${order.status}`;
        if (order.status === 'preparing') {
          title = '🍳 Cooking Food';
          message = 'The restaurant is now preparing your delicious meal!';
        } else if (order.status === 'on_the_way') {
          title = '🚴 Rider Dispatched';
          message = 'Your rider is delivering your order. Track it in real-time!';
        } else if (order.status === 'delivered') {
          title = '✅ Order Delivered';
          message = 'Enjoy your meal! Rate your experience to help us improve.';
        } else if (order.status === 'cancelled') {
          title = '❌ Order Cancelled';
          message = 'Your order has been cancelled.';
        }
        showNotification(title, message);
      }
    });

    prevOrdersRef.current = orders;
  }, [orders, showNotification]);

  return (
    <KeyboardProvider>
      <StatusBar style={statusStyle} />
      {isOffline && (
        <View style={layoutStyles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={layoutStyles.offlineText}>No internet connection — showing cached data</Text>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="checkout" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/addresses" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="orders/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/payment" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/help" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/legal" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </KeyboardProvider>
  );
}

const layoutStyles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const webOuter: any = Platform.OS === 'web'
    ? { flex: 1, backgroundColor: '#111', alignItems: 'center' as const }
    : { flex: 1 };
  const webInner: any = Platform.OS === 'web'
    ? { flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.4)' }
    : { flex: 1 };

  return (
    <GestureHandlerRootView style={webOuter}>
      <View style={webInner}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <PreferencesProvider>
                <DataProvider>
                  <NotificationProvider>
                    <AuthProvider>
                      <CartProvider>
                        <AppContent />
                      </CartProvider>
                    </AuthProvider>
                  </NotificationProvider>
                </DataProvider>
              </PreferencesProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
