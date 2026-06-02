import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { getThemeById } from '@/src/constants/learningThemes';
import { colors, radius, spacing, shadows } from '@/src/constants/theme';
import { t } from '@/src/i18n';

type Phase = 'theory' | 'checks' | 'done';

export default function LearnTopicScreen() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 50);

  const theme = topic ? getThemeById(topic) : undefined;

  const [phase, setPhase] = useState<Phase>('theory');
  const [checkIndex, setCheckIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);

  if (!theme) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.center, { paddingTop: topPad }]}>
          <AppText variant="h2">Тему не знайдено</AppText>
          <AppButton title={t('common.back')} tone="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const goPlay = () =>
    router.replace({ pathname: '/(main)/game/[id]', params: { id: theme.gameId } });

  // ── Теорія ───────────────────────────────────────────────
  if (phase === 'theory') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}>
          <AppText variant="display" style={styles.icon}>{theme.icon}</AppText>
          <AppText variant="h1" style={styles.centerText}>{theme.title}</AppText>
          <AppText variant="body" color={colors.textMuted} style={styles.centerText}>
            {theme.intro}
          </AppText>

          <AppText variant="h2" style={styles.sectionTitle}>{t('learn.theoryTitle')}</AppText>
          {theme.theory.map((p, i) => (
            <View key={i} style={styles.theoryCard}>
              <AppText variant="body" color={colors.text}>{p}</AppText>
            </View>
          ))}

          <AppText variant="h2" style={styles.sectionTitle}>{t('learn.examplesTitle')}</AppText>
          {theme.examples.map((ex, i) => (
            <View key={i} style={styles.exampleCard}>
              <AppText variant="h2" color={colors.primary} style={{ textAlign: 'center' }}>{ex}</AppText>
            </View>
          ))}

          <View style={styles.tipCard}>
            <AppText variant="caption" color={colors.primaryDark} style={{ fontWeight: '700' }}>
              👨‍👩‍👧 {t('learn.parentTipTitle')}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>{theme.parentTip}</AppText>
          </View>

          <AppButton title={t('learn.checkTitle')} tone="primary" size="xl" onPress={() => setPhase('checks')} />
          <AppButton title={t('common.back')} tone="ghost" onPress={() => router.back()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Перевір себе ─────────────────────────────────────────
  if (phase === 'checks') {
    const check = theme.checks[checkIndex];
    const answered = picked !== null;
    const isRight = answered && picked === check.correct;

    const choose = (value: boolean) => {
      if (answered) return;
      setPicked(value);
    };

    const next = () => {
      if (checkIndex + 1 >= theme.checks.length) {
        setPhase('done');
      } else {
        setCheckIndex((i) => i + 1);
        setPicked(null);
      }
    };

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={[styles.center, { paddingTop: topPad }]}>
          <AppText variant="caption" color={colors.textMuted}>
            {checkIndex + 1} / {theme.checks.length}
          </AppText>
          <AppText variant="h2" style={styles.centerText}>{t('learn.checkPrompt')}</AppText>

          <View style={styles.statementCard}>
            <AppText variant="display" style={{ fontSize: 40, textAlign: 'center' }}>
              {check.statement}
            </AppText>
          </View>

          <View style={styles.answerRow}>
            <Pressable
              disabled={answered}
              onPress={() => choose(true)}
              style={[
                styles.answerBtn,
                answered && check.correct && styles.answerRight,
                answered && picked === true && !check.correct && styles.answerWrong,
              ]}
            >
              <AppText variant="h2" style={{ color: '#fff', fontWeight: '800' }}>{t('learn.answerTrue')}</AppText>
            </Pressable>
            <Pressable
              disabled={answered}
              onPress={() => choose(false)}
              style={[
                styles.answerBtn,
                styles.answerBtnNeg,
                answered && !check.correct && styles.answerRight,
                answered && picked === false && check.correct && styles.answerWrong,
              ]}
            >
              <AppText variant="h2" style={{ color: '#fff', fontWeight: '800' }}>{t('learn.answerFalse')}</AppText>
            </Pressable>
          </View>

          {answered ? (
            <>
              <AppText
                variant="h2"
                color={isRight ? colors.success : colors.warning}
                style={styles.centerText}
              >
                {isRight ? t('learn.correctMark') : t('learn.wrongMark')}
              </AppText>
              <AppButton title={t('learn.continueBtn')} tone="primary" size="xl" onPress={next} />
            </>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  // ── Готово ───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.center, { paddingTop: topPad }]}>
        <AppText variant="display" style={{ fontSize: 96 }}>🎉</AppText>
        <AppText variant="h1" style={styles.centerText}>{t('learn.doneTitle')}</AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.centerText}>
          {t('learn.doneHint')}
        </AppText>
        <AppButton title={t('learn.startGame')} tone="primary" size="xl" onPress={goPlay} />
        <AppButton title={t('common.back')} tone="ghost" onPress={() => router.replace('/(main)')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  icon: { fontSize: 80, textAlign: 'center' },
  centerText: { textAlign: 'center' },
  sectionTitle: { marginTop: spacing.sm },
  theoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  exampleCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  tipCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statementCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  answerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  answerBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  answerBtnNeg: {
    backgroundColor: colors.warning,
  },
  answerRight: {
    borderWidth: 4,
    borderColor: '#1F8A4C',
  },
  answerWrong: {
    opacity: 0.5,
  },
});
