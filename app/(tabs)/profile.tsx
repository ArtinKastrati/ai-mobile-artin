import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { haptics } from '@/lib/haptics';

type MenuItemProps = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#FFF0EE' : colors.primaryLight }]}>
        <Ionicons name={icon as any} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.foreground }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, role, signOut, session } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSignOut = async () => {
    haptics.medium();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const displayName =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'Guest';
  const email = user?.email ?? 'Sign in to your account';
  const isAdmin = role === 'admin';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
        <View style={[styles.avatar, { backgroundColor: isAdmin ? '#7C3AED' : colors.primary }]}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{email}</Text>
          {session && role && (
            <View style={[
              styles.roleBadge,
              { backgroundColor: isAdmin ? '#7C3AED18' : `${colors.primary}18` }
            ]}>
              <Ionicons
                name={isAdmin ? 'shield-checkmark' : 'person'}
                size={11}
                color={isAdmin ? '#7C3AED' : colors.primary}
              />
              <Text style={[
                styles.roleText,
                { color: isAdmin ? '#7C3AED' : colors.primary }
              ]}>
                {isAdmin ? 'Admin' : 'Client'}
              </Text>
            </View>
          )}
        </View>
        {!session && (
          <TouchableOpacity
            onPress={() => router.push('/auth')}
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>ADMIN</Text>
          <TouchableOpacity
            onPress={() => router.push('/admin')}
            activeOpacity={0.8}
            style={[styles.adminBtn, { backgroundColor: '#7C3AED' }]}
          >
            <View style={styles.adminBtnInner}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <View>
                <Text style={styles.adminBtnTitle}>Admin Dashboard</Text>
                <Text style={styles.adminBtnSub}>Manage users & platform</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>ACCOUNT</Text>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
        <MenuItem icon="location-outline" label="Saved Addresses" onPress={() => {}} />
        <MenuItem icon="card-outline" label="Payment Methods" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>PREFERENCES</Text>
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
        <MenuItem icon="language-outline" label="Language" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SUPPORT</Text>
        <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
        <MenuItem icon="star-outline" label="Rate App" onPress={() => {}} />
        <MenuItem icon="document-text-outline" label="Terms & Privacy" onPress={() => {}} />
      </View>

      {session && (
        <View style={[styles.section, { marginTop: 8 }]}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
        </View>
      )}

      <Text style={[styles.version, { color: colors.muted }]}>FoodRush v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: 'Nunito_800ExtraBold' },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontFamily: 'Nunito_800ExtraBold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontFamily: 'Nunito_700Bold', marginBottom: 2 },
  userEmail: { fontSize: 13, fontFamily: 'Nunito_400Regular', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  roleText: { fontSize: 11, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  signInBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  signInText: { color: '#fff', fontFamily: 'Nunito_700Bold', fontSize: 14 },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Nunito_700Bold', letterSpacing: 1, marginBottom: 10 },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  adminBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminBtnTitle: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
  adminBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Nunito_400Regular' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Nunito_600SemiBold' },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Nunito_400Regular', marginTop: 8, marginBottom: 8 },
});
