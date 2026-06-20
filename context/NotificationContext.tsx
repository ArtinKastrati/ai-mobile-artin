import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
};

type NotificationContextType = {
  showNotification: (title: string, message: string) => void;
  notifications: SavedNotification[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearAll: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState<SavedNotification[]>([]);
  
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef<any>(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('app_notifications').then((data) => {
      if (data) {
        try {
          setNotifications(JSON.parse(data));
        } catch (e) {
          console.warn('Failed to parse notifications', e);
        }
      }
    });
  }, []);

  const hideNotification = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  }, [slideAnim]);

  const showNotification = useCallback((newTitle: string, newMessage: string) => {
    // Cancel any scheduled dismiss timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    haptics.light();
    setTitle(newTitle);
    setMessage(newMessage);
    setVisible(true);

    // Save notification to history
    setNotifications((prev) => {
      const newNotif: SavedNotification = {
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: newTitle,
        message: newMessage,
        timestamp: Date.now(),
        read: false,
      };
      const next = [newNotif, ...prev];
      AsyncStorage.setItem('app_notifications', JSON.stringify(next)).catch((e) =>
        console.warn('Failed to save notifications', e)
      );
      return next;
    });

    // Slide Down
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto dismiss after 3.5 seconds
    timeoutRef.current = setTimeout(() => {
      hideNotification();
    }, 3500);
  }, [slideAnim, hideNotification]);

  const handlePress = () => {
    haptics.light();
    hideNotification();
  };

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      AsyncStorage.setItem('app_notifications', JSON.stringify(next)).catch((e) =>
        console.warn('Failed to save notifications', e)
      );
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    AsyncStorage.removeItem('app_notifications').catch((e) =>
      console.warn('Failed to remove notifications', e)
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const topOffset = Platform.OS === 'ios' ? insets.top + 10 : insets.top + 12;

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        notifications,
        unreadCount,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
      
      {visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: topOffset,
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={styles.toastContent}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="notifications" size={18} color={colors.primary} />
            </View>
            <View style={styles.textWrapper}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={2}>
                {message}
              </Text>
            </View>
            <Ionicons name="chevron-up" size={16} color={colors.muted} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        maxWidth: 500,
        alignSelf: 'center',
        left: 'auto',
        right: 'auto',
        width: width - 32,
      } as any,
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  message: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 16,
  },
});
