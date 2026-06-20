import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const { profileDetails, updateProfileDetails } = useData();
  const { session, user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'avatar' | null>(null);

  useEffect(() => {
    if (session && profile) {
      setFullName(profile.full_name ?? '');
      setEmail(profile.email ?? user?.email ?? '');
      setAvatarUrl(profileDetails.avatarUrl || '');
    } else {
      setFullName(profileDetails.fullName);
      setEmail(profileDetails.email);
      setAvatarUrl(profileDetails.avatarUrl || '');
    }
  }, [session, profile, user, profileDetails]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    haptics.heavy();
    setSaving(true);

    try {
      const updated = {
        fullName: fullName.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      };

      updateProfileDetails(updated);

      if (session && user) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: updated.fullName })
          .eq('id', user.id);
        if (error) {
          Alert.alert(t('common.error'), error.message);
          return;
        }
        await refreshProfile();
      }

      Alert.alert(t('common.success'), t('editProfile.saveSuccess'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('editProfile.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('editProfile.fullName')} *</Text>
          <View style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.card,
              borderColor: focusedField === 'name' ? colors.primary : colors.border,
              borderWidth: focusedField === 'name' ? 1.5 : 1,
            }
          ]}>
            <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? colors.primary : colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('editProfile.email')} *</Text>
          <View style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.card,
              borderColor: focusedField === 'email' ? colors.primary : colors.border,
              borderWidth: focusedField === 'email' ? 1.5 : 1,
              opacity: session ? 0.7 : 1,
            }
          ]}>
            <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!session}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {session && (
            <Text style={[styles.hint, { color: colors.muted }]}>{t('editProfile.emailReadOnly')}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{t('editProfile.avatarUrl')}</Text>
          <View style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.card,
              borderColor: focusedField === 'avatar' ? colors.primary : colors.border,
              borderWidth: focusedField === 'avatar' ? 1.5 : 1,
            }
          ]}>
            <Ionicons name="image-outline" size={18} color={focusedField === 'avatar' ? colors.primary : colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              onFocus={() => setFocusedField('avatar')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 12, opacity: saving ? 0.7 : 1 }]}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 11, fontFamily: 'Nunito_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 11, fontFamily: 'Nunito_400Regular', marginTop: 4 },
  inputWrapper: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 14, fontFamily: 'Nunito_400Regular' },
  saveBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
});
