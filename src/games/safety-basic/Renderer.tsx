import { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { colors, radius, spacing, fontFamily, shadows } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';
import type { SafetyAction } from './scenarios';

export interface SafetyPayload {
  situation: string;
  icon: string;
  actions: SafetyAction[];
  timeLimitSec?: number;
}

export type SafetyAnswer = string;

type Phase = 'choose' | 'result';

export function Renderer({ task, onAnswer, disabled }: RendererProps<SafetyAnswer>) {
  const payload = task.payload as SafetyPayload;
  const [phase, setPhase] = useState<Phase>('choose');
  const [chosen, setChosen] = useState<SafetyAction | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    setPhase('choose');
    setChosen(null);
    submittedRef.current = false;
  }, [task.id]);

  useEffect(() => {
    if (phase !== 'choose' || !payload.timeLimitSec) return;
    const timer = setTimeout(() => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      onAnswer('');
    }, payload.timeLimitSec * 1000);
    return () => clearTimeout(timer);
  }, [phase, payload.timeLimitSec, onAnswer]);

  const onPickAction = (action: SafetyAction) => {
    if (submittedRef.current || disabled) return;
    setChosen(action);
    setPhase('result');
  };

  const finish = () => {
    if (submittedRef.current || !chosen) return;
    submittedRef.current = true;
    onAnswer(chosen.key);
  };

  if (phase === 'choose') {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.scenarioCard}>
          <AppText style={styles.icon}>{payload.icon}</AppText>
          <AppText style={styles.situationText}>{payload.situation}</AppText>
        </View>

        <AppText style={styles.chooseLabel}>{t('game.safetyBasic.whatWouldYouDo')}</AppText>

        <View style={styles.actionsList}>
          {payload.actions.map((action) => (
            <Pressable
              key={action.key}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.actionCardPressed,
              ]}
              onPress={() => onPickAction(action)}
              disabled={!!disabled || submittedRef.current}
              accessibilityRole="button"
            >
              <AppText style={styles.actionLabel}>{action.label}</AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  // phase === 'result'
  const isSafe = chosen?.isSafe ?? false;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <AppText style={styles.phaseTitle}>
        {isSafe ? t('game.safetyBasic.resultSafe') : t('game.safetyBasic.resultUnsafe')}
      </AppText>

      <View style={[styles.consequenceBox, isSafe ? styles.consequenceSafe : styles.consequenceDanger]}>
        <AppText style={styles.consequenceEmoji}>{isSafe ? '✅' : '⚠️'}</AppText>
        <AppText style={styles.consequenceText}>{chosen?.consequence}</AppText>
      </View>

      <AppButton
        title={t('game.safetyBasic.next')}
        size="lg"
        tone="primary"
        onPress={finish}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  scenarioCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    gap: spacing.sm,
    ...shadows.card,
  },
  icon: {
    fontSize: 64,
    lineHeight: 72,
  },
  situationText: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fontFamily.extraBold,
    color: colors.text,
    textAlign: 'center',
  },
  chooseLabel: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  actionsList: {
    gap: spacing.sm,
  },
  actionCard: {
    padding: spacing.md,
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    ...shadows.card,
  },
  actionCardPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  actionLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  phaseTitle: {
    fontSize: 22,
    fontFamily: fontFamily.extraBold,
    color: colors.text,
    textAlign: 'center',
  },
  consequenceBox: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  consequenceSafe: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  consequenceDanger: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  consequenceEmoji: {
    fontSize: 48,
  },
  consequenceText: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
});
