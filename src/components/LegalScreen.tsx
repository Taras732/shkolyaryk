import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import type { LegalDoc } from '@/src/legal/privacyPolicy';
import { colors, spacing, radius } from '@/src/constants/theme';

interface LegalScreenProps {
  docUK: LegalDoc;
  docEN: LegalDoc;
}

export function LegalScreen({ docUK, docEN }: LegalScreenProps) {
  const [lang, setLang] = useState<'uk' | 'en'>('uk');
  const router = useRouter();
  const doc = lang === 'uk' ? docUK : docEN;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} hitSlop={12} style={styles.backBtn}>
          <AppText style={styles.backGlyph} color={colors.primary}>‹</AppText>
        </Pressable>
        <View style={styles.langToggle}>
          <Pressable
            style={[styles.langBtn, lang === 'uk' && styles.langBtnActive]}
            onPress={() => setLang('uk')}
          >
            <AppText style={[styles.langText, lang === 'uk' && styles.langTextActive]}>УКР</AppText>
          </Pressable>
          <Pressable
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            onPress={() => setLang('en')}
          >
            <AppText style={[styles.langText, lang === 'en' && styles.langTextActive]}>ENG</AppText>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>{doc.title}</AppText>
        <AppText style={styles.meta}>{doc.meta}</AppText>

        {doc.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            {section.heading ? (
              <AppText style={styles.heading}>{section.heading}</AppText>
            ) : null}
            <AppText style={styles.body}>{section.body}</AppText>
          </View>
        ))}

        <View style={styles.footer}>
          <AppText style={styles.footerText} color={colors.textMuted}>
            {lang === 'uk' ? 'Школярик — безпечний застосунок для дітей' : 'Shkolyaryk — a safe app for children'}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F2FF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4DFF5',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: '#EEEAFF',
  },
  backGlyph: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: -2,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: '#EEEAFF',
    borderRadius: radius.full,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: spacing.smd,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 720,
    alignSelf: 'center' as const,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E4DFF5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
