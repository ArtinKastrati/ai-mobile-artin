import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePreferences } from '@/context/PreferencesContext';
import { haptics } from '@/lib/haptics';

type FaqItem = { q: string; a: string };

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const faqs: FaqItem[] = [
    { q: t('help.faq1q'), a: t('help.faq1a') },
    { q: t('help.faq2q'), a: t('help.faq2a') },
    { q: t('help.faq3q'), a: t('help.faq3a') },
    { q: t('help.faq4q'), a: t('help.faq4a') },
  ];

  const handleContact = () => {
    haptics.medium();
    Linking.openURL('mailto:support@foodrush.app?subject=FoodRush%20Support');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { haptics.light(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('help.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.muted }]}>{t('help.intro')}</Text>

        {faqs.map((faq, i) => (
          <View key={i} style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.faqQ, { color: colors.foreground }]}>{faq.q}</Text>
            <Text style={[styles.faqA, { color: colors.muted }]}>{faq.a}</Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleContact}
          activeOpacity={0.88}
          style={[styles.contactBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>{t('help.contactSupport')}</Text>
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
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 14, fontFamily: 'Nunito_400Regular', lineHeight: 20, marginBottom: 8 },
  faqCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  faqQ: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  faqA: { fontSize: 13, fontFamily: 'Nunito_400Regular', lineHeight: 19 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  contactBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito_700Bold' },
});
