import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useData } from '@/context/DataContext';
import { haptics } from '@/lib/haptics';

declare const __DEV__: boolean;

type MenuItemProps = {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({ icon, label, value, onPress, danger }: MenuItemProps) {
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
      {value && (
        <Text style={[styles.menuValue, { color: colors.muted }]}>{value}</Text>
      )}
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, role, signOut, session } = useAuth();
  const { language, setLanguage, theme, setTheme, t } = usePreferences();
  const { 
    profileDetails, 
    simulatedRole, 
    simulatedRestaurantId, 
    setSimulatedRole, 
    setSimulatedRestaurantId, 
    restaurants 
  } = useData();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const requireAuth = (action: () => void) => {
    if (!session) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') },
        ]
      );
      return;
    }
    action();
  };

  const handleSignOut = async () => {
    haptics.medium();
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleLanguagePress = () => {
    haptics.medium();
    Alert.alert(
      t('profile.selectLanguage'),
      undefined,
      [
        { text: 'English', onPress: () => setLanguage('en') },
        { text: 'Shqip', onPress: () => setLanguage('sq') },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleThemePress = () => {
    haptics.medium();
    Alert.alert(
      t('profile.selectTheme'),
      undefined,
      [
        { text: t('profile.light'), onPress: () => setTheme('light') },
        { text: t('profile.dark'), onPress: () => setTheme('dark') },
        { text: t('profile.system'), onPress: () => setTheme('system') },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSelectSimulatedRole = () => {
    haptics.medium();
    Alert.alert(
      t('profile.simulateRole'),
      t('profile.simulateRolePrompt'),
      [
        { text: t('profile.superAdmin'), onPress: () => setSimulatedRole('admin') },
        { text: t('profile.restaurantManager'), onPress: () => setSimulatedRole('restaurant_admin') },
        { text: t('profile.employee'), onPress: () => setSimulatedRole('employee') },
        { text: t('profile.client'), onPress: () => setSimulatedRole('client') },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleSelectSimulatedRestaurant = () => {
    haptics.medium();
    const options = restaurants.map(r => ({
      text: r.name,
      onPress: () => setSimulatedRestaurantId(r.id),
    }));
    Alert.alert(
      t('profile.simulatedRestaurant'),
      t('profile.simulateRestaurantPrompt'),
      [
        ...options,
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const displayName = session
    ? (profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? t('profile.guest'))
    : (profileDetails.fullName || t('profile.guest'));

  const avatarUrl = session
    ? (profileDetails.avatarUrl || undefined)
    : profileDetails.avatarUrl;
  
  const email = session
    ? (user?.email ?? t('auth.dontHaveAccount') + t('profile.signIn'))
    : (profileDetails.email || (t('auth.dontHaveAccount') + t('profile.signIn')));

  const activeRole = session ? (profile?.role || role || 'client') : simulatedRole;
  const showAdminDashboard = activeRole === 'admin' || activeRole === 'restaurant_admin' || activeRole === 'employee';
  const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;
  const showDeveloperOptions = isDevelopment && (!session || role === 'admin');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('profile.title')}</Text>
      </View>

      <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: showAdminDashboard ? '#7C3AED' : colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>{email}</Text>
          <View style={[
            styles.roleBadge,
            { 
              backgroundColor: 
                activeRole === 'admin' ? '#7C3AED18' : 
                activeRole === 'restaurant_admin' ? '#FF950018' : 
                activeRole === 'employee' ? '#34C75918' : 
                `${colors.primary}18` 
            }
          ]}>
            <Ionicons
              name={
                activeRole === 'admin' ? 'shield-checkmark' : 
                activeRole === 'restaurant_admin' ? 'restaurant' : 
                activeRole === 'employee' ? 'briefcase' : 
                'person'
              }
              size={11}
              color={
                activeRole === 'admin' ? '#7C3AED' : 
                activeRole === 'restaurant_admin' ? '#FF9500' : 
                activeRole === 'employee' ? '#34C759' : 
                colors.primary
              }
            />
            <Text style={[
              styles.roleText,
              { 
                color: 
                  activeRole === 'admin' ? '#7C3AED' : 
                  activeRole === 'restaurant_admin' ? '#FF9500' : 
                  activeRole === 'employee' ? '#34C759' : 
                  colors.primary 
              }
            ]}>
              {activeRole === 'admin' ? t('profile.admin') : 
               activeRole === 'restaurant_admin' ? t('profile.restaurantAdmin') : 
               activeRole === 'employee' ? t('profile.employee') : 
               t('profile.client')}
            </Text>
          </View>
        </View>
        {!session && (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              router.push('/auth');
            }}
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.signInText}>{t('profile.signIn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAdminDashboard && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('profile.admin').toUpperCase()}</Text>
          <TouchableOpacity
            onPress={() => {
              haptics.medium();
              router.push('/admin');
            }}
            activeOpacity={0.8}
            style={[styles.adminBtn, { backgroundColor: '#7C3AED' }]}
          >
            <View style={styles.adminBtnInner}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <View>
                <Text style={styles.adminBtnTitle}>
                  {activeRole === 'admin'
                    ? t('profile.adminDashboard')
                    : activeRole === 'restaurant_admin'
                    ? t('profile.restaurantManager')
                    : t('profile.employeePortal')}
                </Text>
                <Text style={styles.adminBtnSub}>
                  {activeRole === 'admin' ? t('profile.managePlatform') : t('profile.manageRestaurantOps')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Developer Control Panel (Only in Guest mode or if logged-in role is admin) */}
      {showDeveloperOptions && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('profile.developerOptions')}</Text>
          <View style={[styles.developerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.developerCardHeader}>
              <Ionicons name="code-working" size={20} color="#7C3AED" />
              <Text style={[styles.developerCardTitle, { color: colors.foreground }]}>
                {t('profile.localRoleSimulation')}
              </Text>
            </View>
            <Text style={[styles.developerCardSub, { color: colors.muted }]}>
              {t('profile.localRoleSimulationDesc')}
            </Text>
            
            <View style={[styles.devDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity 
              onPress={handleSelectSimulatedRole}
              style={styles.devRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.devRowLabel, { color: colors.foreground }]}>
                  {t('profile.simulatedRole')}
                </Text>
                <Text style={[styles.devRowSub, { color: colors.muted }]}>
                  {t('profile.simulatedRoleDesc')}
                </Text>
              </View>
              <View style={styles.devRowValueContainer}>
                <Text style={[styles.devRowValue, { color: '#7C3AED' }]}>
                  {simulatedRole === 'admin' ? t('profile.superAdmin') : simulatedRole === 'restaurant_admin' ? t('profile.restaurantAdmin') : simulatedRole === 'employee' ? t('profile.employee') : t('profile.client')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {(simulatedRole === 'restaurant_admin' || simulatedRole === 'employee') && (
              <>
                <View style={[styles.devDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity 
                  onPress={handleSelectSimulatedRestaurant}
                  style={styles.devRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.devRowLabel, { color: colors.foreground }]}>
                      {t('profile.simulatedRestaurant')}
                    </Text>
                    <Text style={[styles.devRowSub, { color: colors.muted }]}>
                      {t('profile.simulatedRestaurantDesc')}
                    </Text>
                  </View>
                  <View style={styles.devRowValueContainer}>
                    <Text style={[styles.devRowValue, { color: '#7C3AED' }]} numberOfLines={1}>
                      {restaurants.find(r => r.id === simulatedRestaurantId)?.name || `ID: ${simulatedRestaurantId}`}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('profile.account')}</Text>
        <MenuItem icon="person-outline" label={t('profile.editProfile')} onPress={() => { haptics.medium(); requireAuth(() => router.push('/profile/edit')); }} />
        <MenuItem icon="location-outline" label={t('profile.savedAddresses')} onPress={() => { haptics.medium(); requireAuth(() => router.push('/profile/addresses')); }} />
        <MenuItem icon="card-outline" label={t('profile.paymentMethods')} onPress={() => { haptics.medium(); requireAuth(() => router.push('/profile/payment')); }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('profile.preferences')}</Text>
        <MenuItem icon="notifications-outline" label={t('profile.notifications')} onPress={() => { haptics.medium(); router.push('/notifications'); }} />
        <MenuItem 
          icon="language-outline" 
          label={t('profile.language')} 
          value={language === 'en' ? 'English' : 'Shqip'} 
          onPress={handleLanguagePress} 
        />
        <MenuItem 
          icon="color-palette-outline" 
          label={t('profile.theme')} 
          value={theme === 'system' ? t('profile.system') : theme === 'dark' ? t('profile.dark') : t('profile.light')} 
          onPress={handleThemePress} 
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>{t('profile.support')}</Text>
        <MenuItem icon="help-circle-outline" label={t('profile.helpCenter')} onPress={() => { haptics.medium(); router.push('/profile/help'); }} />
        <MenuItem icon="star-outline" label={t('profile.rateApp')} onPress={() => {
          haptics.medium();
          Alert.alert(t('profile.rateAppThanks'), t('profile.rateAppMessage'));
        }} />
        <MenuItem icon="document-text-outline" label={t('profile.termsPrivacy')} onPress={() => { haptics.medium(); router.push('/profile/legal'); }} />
      </View>

      {session && (
        <View style={[styles.section, { marginTop: 8 }]}>
          <MenuItem icon="log-out-outline" label={t('profile.signOut')} onPress={handleSignOut} danger />
        </View>
      )}

      <Text style={[styles.version, { color: colors.muted }]}>{t('profile.version')}</Text>
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
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  menuValue: { fontSize: 14, fontFamily: 'Nunito_400Regular', marginRight: 4 },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Nunito_400Regular', marginTop: 8, marginBottom: 8 },
  developerCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  developerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  developerCardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  developerCardSub: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 16,
  },
  devDivider: {
    height: 1,
    marginVertical: 8,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  devRowLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  devRowSub: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    marginTop: 1,
  },
  devRowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  devRowValue: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
});
