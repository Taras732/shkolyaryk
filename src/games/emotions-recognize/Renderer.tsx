import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';

export type EmotionId = 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'sleepy';
export type EmotionAnswer = EmotionId;

export interface EmotionPayload {
  target: EmotionId;
  emoji: string;
  candidates: EmotionId[];
  // Pre-reader mode: face emoji per candidate, shown above the name as a cue.
  candidateEmojis?: Record<string, string>;
}

export function Renderer({ task, onAnswer, disabled }: RendererProps<EmotionAnswer>) {
  const payload = task.payload as EmotionPayload;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [task.id]);

  const handlePress = (value: EmotionId) => {
    if (disabled || locked) return;
    setLocked(true);
    onAnswer(value);
  };

  const isDisabled = disabled || locked;

  return (
    <View style={styles.wrap}>
      <View style={styles.emojiCard}>
        <AppText style={styles.emoji}>{payload.emoji}</AppText>
        <AppText style={styles.prompt}>{t('game.emotions.prompt')}</AppText>
      </View>

      <View style={styles.buttonsRow}>
        {payload.candidates.map((id) => (
          <EmotionButton
            key={id}
            id={id}
            emoji={payload.candidateEmojis?.[id]}
            onPress={() => handlePress(id)}
            disabled={isDisabled}
          />
        ))}
      </View>
    </View>
  );
}

interface EmotionButtonProps {
  id: EmotionId;
  emoji?: string;
  onPress: () => void;
  disabled: boolean;
}

function EmotionButton({ id, emoji, onPress, disabled }: EmotionButtonProps) {
  const label = t(`game.emotions.names.${id}`);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
    >
      {emoji ? <AppText style={styles.buttonEmoji}>{emoji}</AppText> : null}
      <AppText style={styles.buttonText} color={disabled ? colors.textDisabled : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  emojiCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 200,
  },
  emoji: {
    fontSize: 104,
    lineHeight: 120,
  },
  prompt: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  button: {
    flex: 1,
    minHeight: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  buttonEmoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
  },
});
