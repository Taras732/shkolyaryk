import { useEffect, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily, shadows } from '../../constants/theme';
import type { RendererProps } from '../types';

export interface QuizChoice {
  id: string;
  label: string;
  emoji?: string;
}

export interface QuizPayload {
  promptText: string;
  promptEmoji?: string;
  promptSecondary?: string;
  choices: QuizChoice[];
  correctId: string;
  /** when true, choices render as a 2×2 big grid; otherwise vertical list. */
  gridLayout?: boolean;
  /** when true, choice text labels are hidden (e.g. name-to-emoji: show only emoji). */
  hideLabels?: boolean;
}

export type QuizAnswer = string;

export function QuizRenderer({ task, onAnswer, disabled }: RendererProps<QuizAnswer>) {
  const payload = task.payload as QuizPayload;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [task.id]);

  const submit = (id: string) => {
    if (disabled || locked) return;
    setLocked(true);
    onAnswer(id);
  };

  const isDisabled = disabled || locked;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.promptBox}>
        {payload.promptEmoji ? (
          <AppText style={styles.promptEmoji}>{payload.promptEmoji}</AppText>
        ) : null}
        <AppText style={styles.promptText}>{payload.promptText}</AppText>
        {payload.promptSecondary ? (
          <AppText style={styles.promptSecondary}>{payload.promptSecondary}</AppText>
        ) : null}
      </View>

      <View style={payload.gridLayout ? styles.gridChoices : styles.listChoices}>
        {payload.choices.map((c) => (
          <Pressable
            key={c.id}
            style={[
              payload.gridLayout ? styles.gridChoice : styles.listChoice,
              isDisabled && styles.disabled,
            ]}
            onPress={() => submit(c.id)}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={c.label}
          >
            {c.emoji ? (
              <AppText style={payload.gridLayout ? styles.choiceEmojiBig : styles.choiceEmojiSmall}>
                {c.emoji}
              </AppText>
            ) : null}
            {payload.hideLabels ? null : (
              <AppText style={styles.choiceLabel}>{c.label}</AppText>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  promptBox: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  promptEmoji: {
    fontSize: 96,
    lineHeight: 106,
  },
  promptText: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: fontFamily.extraBold,
    color: colors.text,
    textAlign: 'center',
  },
  promptSecondary: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  listChoices: {
    gap: spacing.sm,
  },
  listChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
  },
  gridChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  gridChoice: {
    width: '46%',
    minHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
    ...shadows.card,
  },
  choiceEmojiBig: {
    fontSize: 48,
    lineHeight: 56,
  },
  choiceEmojiSmall: {
    fontSize: 28,
    lineHeight: 34,
  },
  choiceLabel: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
