import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';

export default function LegalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const sections = [
    { title: t('legal.termsTitle'), body: t('legal.termsBody') },
    { title: t('legal.privacyTitle'), body: t('legal.privacyBody') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { haptics.light(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('legal.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: colors.muted }]}>{t('legal.lastUpdated')}</Text>
        {sections.map((section, i) => (
          <View key={i} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.muted }]}>{section.body}</Text>
          </View>
        ))}
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
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  updated: { fontSize: 12, fontFamily: 'Nunito_400Regular', marginBottom: 4 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
  sectionBody: { fontSize: 13, fontFamily: 'Nunito_400Regular', lineHeight: 20 },
});
