import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';

export type BehaviorId = 'sink' | 'float';
export type SinkFloatAnswer = BehaviorId;

export interface SinkFloatPayload {
  target: BehaviorId;
  emoji: string;
  itemKey: string;
}

const CHOICES: { id: BehaviorId; icon: string }[] = [
  { id: 'sink', icon: '⬇️' },
  { id: 'float', icon: '⬆️' },
];

export function Renderer({ task, onAnswer, disabled }: RendererProps<SinkFloatAnswer>) {
  const payload = task.payload as SinkFloatPayload;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [task.id]);

  const handlePress = (value: BehaviorId) => {
    if (disabled || locked) return;
    setLocked(true);
    onAnswer(value);
  };

  const isDisabled = disabled || locked;

  return (
    <View style={styles.wrap}>
      <View style={styles.emojiCard}>
        <AppText style={styles.emoji}>{payload.emoji}</AppText>
        <AppText style={styles.prompt}>{t('game.sinkFloat.prompt')}</AppText>
      </View>

      <View style={styles.buttonsRow}>
        {CHOICES.map((c) => (
          <ChoiceButton
            key={c.id}
            id={c.id}
            icon={c.icon}
            onPress={() => handlePress(c.id)}
            disabled={isDisabled}
          />
        ))}
      </View>
    </View>
  );
}

interface ChoiceButtonProps {
  id: BehaviorId;
  icon: string;
  onPress: () => void;
  disabled: boolean;
}

function ChoiceButton({ id, icon, onPress, disabled }: ChoiceButtonProps) {
  const label = t(`game.sinkFloat.choices.${id}`);
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
      <AppText style={styles.buttonIcon}>{icon}</AppText>
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
    minHeight: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  buttonIcon: {
    fontSize: 36,
    lineHeight: 42,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
  },
});
