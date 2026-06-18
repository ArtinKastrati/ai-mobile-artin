import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth, Profile } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

type Stat = { label: string; value: string; icon: string; color: string };

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== 'admin') {
      router.replace('/(tabs)/profile');
      return;
    }
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const clientCount = users.filter((u) => u.role === 'client').length;

  const stats: Stat[] = [
    { label: 'Total Users', value: String(totalUsers), icon: 'people', color: '#FF6B35' },
    { label: 'Clients', value: String(clientCount), icon: 'person', color: '#34C759' },
    { label: 'Admins', value: String(adminCount), icon: 'shield-checkmark', color: '#7C3AED' },
  ];

  const promoteUser = async (userId: string) => {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    fetchUsers();
  };

  const demoteUser = async (userId: string) => {
    await supabase.from('profiles').update({ role: 'client' }).eq('id', userId);
    fetchUsers();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: '#7C3AED' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={fetchUsers} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}18` }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Users</Text>
          {loading ? (
            <ActivityIndicator color="#7C3AED" style={{ marginTop: 24 }} />
          ) : users.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No users yet. They'll appear here after signing up.
              </Text>
            </View>
          ) : (
            users.map((u) => (
              <View key={u.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: u.role === 'admin' ? '#7C3AED' : colors.primary }]}>
                  <Text style={styles.userAvatarText}>
                    {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>
                    {u.full_name ?? 'No name'}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.muted }]}>{u.email ?? '—'}</Text>
                  <View style={[
                    styles.rolePill,
                    { backgroundColor: u.role === 'admin' ? '#7C3AED18' : `${colors.primary}18` }
                  ]}>
                    <Text style={[
                      styles.rolePillText,
                      { color: u.role === 'admin' ? '#7C3AED' : colors.primary }
                    ]}>
                      {u.role === 'admin' ? 'Admin' : 'Client'}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  {u.role === 'client' ? (
                    <TouchableOpacity
                      onPress={() => promoteUser(u.id)}
                      style={[styles.actionBtn, { backgroundColor: '#7C3AED18' }]}
                    >
                      <Ionicons name="shield-checkmark-outline" size={16} color="#7C3AED" />
                      <Text style={[styles.actionText, { color: '#7C3AED' }]}>Promote</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => demoteUser(u.id)}
                      style={[styles.actionBtn, { backgroundColor: `${colors.primary}18` }]}
                    >
                      <Ionicons name="person-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Demote</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  refreshBtn: { padding: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  statLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' },
  section: { paddingHorizontal: 20, gap: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Nunito_400Regular', textAlign: 'center', maxWidth: 260 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_800ExtraBold' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  userEmail: { fontSize: 12, fontFamily: 'Nunito_400Regular' },
  rolePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    marginTop: 2,
  },
  rolePillText: { fontSize: 11, fontFamily: 'Nunito_700Bold' },
  userActions: { gap: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionText: { fontSize: 12, fontFamily: 'Nunito_700Bold' },
});
