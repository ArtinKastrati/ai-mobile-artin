import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, setGuestMode } = useAuth();
  const { t } = usePreferences();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const friendlyError = (raw: string): string => {
    const r = raw.toLowerCase();
    if (r.includes('rate limit') || r.includes('email rate'))
      return 'Supabase ka arritur limitin e emailave.\n\nZgjidhja: Shko te Supabase Dashboard → Authentication → Settings → çaktivizo "Enable email confirmations". Pastaj provoni përsëri.';
    if (r.includes('invalid login') || r.includes('invalid credentials'))
      return 'Email ose fjalëkalimi është i gabuar.';
    if (r.includes('already registered') || r.includes('already been registered'))
      return 'Ky email është tashmë i regjistruar. Provo të kyçesh.';
    if (r.includes('password') && r.includes('6'))
      return 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.';
    if (r.includes('invalid email') || r.includes('valid email'))
      return 'Adresa email nuk është e vlefshme.';
    if (r.includes('network') || r.includes('fetch'))
      return 'Nuk ka lidhje interneti. Kontrollo rrjetin tënd.';
    return raw;
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }
    haptics.heavy();
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) Alert.alert(t('auth.signInFailed'), friendlyError(error));
        else router.replace('/(tabs)');
      } else {
        if (!fullName.trim()) {
          Alert.alert(t('common.error'), t('auth.enterFullName'));
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          Alert.alert(t('auth.signUpFailed'), friendlyError(error));
        } else {
          // Try auto-sign-in immediately (works when email confirmation is disabled)
          const { error: signInErr } = await signIn(email, password);
          if (!signInErr) {
            router.replace('/(tabs)');
          } else {
            Alert.alert(
              t('auth.accountCreated'),
              'Llogaria u krijua! Konfirmo emailin tënd pastaj kyçu.',
              [{ text: t('common.ok'), onPress: () => setMode('signin') }]
            );
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              setGuestMode(true);
              router.replace('/(tabs)');
            }}
            style={styles.guestBtn}
          >
            <Text style={[styles.guestText, { color: colors.muted }]}>Vazhdo si vizitor</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Logo */}
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="fast-food" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>FoodRush</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </Text>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={[
                styles.inputGroup, 
                { 
                  borderColor: focusedField === 'name' ? colors.primary : colors.border, 
                  backgroundColor: colors.card,
                  borderWidth: focusedField === 'name' ? 1.5 : 1
                }
              ]}>
                <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? colors.primary : colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder={t('auth.fullName')}
                  placeholderTextColor={colors.muted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            )}

            <View style={[
              styles.inputGroup, 
              { 
                borderColor: focusedField === 'email' ? colors.primary : colors.border, 
                backgroundColor: colors.card,
                borderWidth: focusedField === 'email' ? 1.5 : 1
              }
            ]}>
              <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder={t('auth.email')}
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[
              styles.inputGroup, 
              { 
                borderColor: focusedField === 'password' ? colors.primary : colors.border, 
                backgroundColor: colors.card,
                borderWidth: focusedField === 'password' ? 1.5 : 1
              }
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? colors.primary : colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder={t('auth.password')}
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptics.light();
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
              style={styles.toggleBtn}
            >
              <Text style={[styles.toggleText, { color: colors.muted }]}>
                {mode === 'signin' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
                <Text style={{ color: colors.primary, fontFamily: 'Nunito_700Bold' }}>
                  {mode === 'signin' ? t('auth.signUp') : t('auth.signIn')}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, alignItems: 'flex-end' },
  guestBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8, paddingHorizontal: 4 },
  guestText: { fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 20 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', marginBottom: 6 },
  tagline: { fontSize: 16, fontFamily: 'Nunito_400Regular', marginBottom: 36 },
  form: { width: '100%', gap: 14 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Nunito_400Regular' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 17, fontFamily: 'Nunito_800ExtraBold' },
  toggleBtn: { alignItems: 'center', marginTop: 8 },
  toggleText: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
});
