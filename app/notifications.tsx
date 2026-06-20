import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePreferences } from '@/context/PreferencesContext';
import { useNotification, SavedNotification } from '@/context/NotificationContext';
import { haptics } from '@/lib/haptics';

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { notifications, markAllAsRead, clearAll } = useNotification();

  // Automatically mark all notifications as read when entering the inbox
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = () => {
    haptics.medium();
    clearAll();
  };

  const topPadding = Platform.OS === 'web' ? 24 : insets.top;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('notificationsHistory.title')}
        </Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: colors.primary }]}>
              {t('notificationsHistory.clearAll')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: SavedNotification }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="notifications" size={16} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardTime, { color: colors.muted }]}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardMessage, { color: colors.mutedForeground }]}>
              {item.message}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('notificationsHistory.empty')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              {t('notificationsHistory.emptyDesc')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  cardTime: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    marginTop: 1,
  },
  cardMessage: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
