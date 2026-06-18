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

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) Alert.alert('Sign In Failed', error);
        else router.back();
      } else {
        if (!fullName.trim()) {
          Alert.alert('Error', 'Please enter your full name.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) Alert.alert('Sign Up Failed', error);
        else {
          Alert.alert('Account Created', 'Check your email to confirm your account.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Logo */}
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="fast-food" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>FoodRush</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
          </Text>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={[styles.inputGroup, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Ionicons name="person-outline" size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.muted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={[styles.inputGroup, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="mail-outline" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
                <Text style={styles.submitText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              style={styles.toggleBtn}
            >
              <Text style={[styles.toggleText, { color: colors.muted }]}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: colors.primary, fontFamily: 'Nunito_700Bold' }}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
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
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
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
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Nunito_400Regular' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 17, fontFamily: 'Nunito_800ExtraBold' },
  toggleBtn: { alignItems: 'center', marginTop: 8 },
  toggleText: { fontSize: 14, fontFamily: 'Nunito_400Regular' },
});
