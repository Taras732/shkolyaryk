import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';

export type StageId = 'seed' | 'sprout' | 'sapling' | 'flower' | 'fruit';

export interface PlantGrowPayload {
  targetStage: StageId;
  emoji: string;
  choices: StageId[];
}

export type PlantGrowAnswer = StageId;

const STAGE_EMOJI: Record<StageId, string> = {
  seed: '🌰',
  sprout: '🌱',
  sapling: '🌿',
  flower: '🌸',
  fruit: '🍎',
};

export function Renderer({ task, onAnswer, disabled }: RendererProps<PlantGrowAnswer>) {
  const payload = task.payload as PlantGrowPayload;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [task.id]);

  const handlePress = (value: StageId) => {
    if (disabled || locked) return;
    setLocked(true);
    onAnswer(value);
  };

  const isDisabled = disabled || locked;
  const choiceCols = payload.choices.length <= 3 ? 3 : 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <AppText style={styles.emoji}>{payload.emoji}</AppText>
        <AppText style={styles.prompt}>{t('game.plantGrow.prompt')}</AppText>
      </View>

      <View style={[styles.grid, choiceCols === 3 ? styles.gridRow : styles.gridWrap]}>
        {payload.choices.map((stageId) => (
          <ChoiceButton
            key={stageId}
            stageId={stageId}
            emoji={STAGE_EMOJI[stageId]}
            onPress={() => handlePress(stageId)}
            disabled={isDisabled}
          />
        ))}
      </View>
    </View>
  );
}

interface ChoiceButtonProps {
  stageId: StageId;
  emoji: string;
  onPress: () => void;
  disabled: boolean;
}

function ChoiceButton({ stageId, emoji, onPress, disabled }: ChoiceButtonProps) {
  const label = t(`game.plantGrow.stages.${stageId}`);
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
      <AppText style={styles.buttonEmoji}>{emoji}</AppText>
      <AppText style={styles.buttonLabel} color={disabled ? colors.textDisabled : colors.text}>
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
  card: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 180,
  },
  emoji: {
    fontSize: 96,
    lineHeight: 112,
  },
  prompt: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamily.bold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  grid: {
    paddingBottom: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minWidth: '45%',
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
  buttonEmoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  buttonLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
  },
});
