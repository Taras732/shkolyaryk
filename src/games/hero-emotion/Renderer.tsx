import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';
import type { EmotionId } from '../emotions-recognize/Renderer';

export type { EmotionId };
export type HeroEmotionAnswer = EmotionId;

export type HeroSituationId =
  | 'birthday'
  | 'rainStuck'
  | 'puppy'
  | 'bigAnimal'
  | 'toyBroke'
  | 'gift'
  | 'toySnatched'
  | 'wonGame'
  | 'fire'
  | 'lostToy';

export interface HeroEmotionPayload {
  situationId: HeroSituationId;
  sceneEmoji: string;
  target: EmotionId;
  candidates: EmotionId[];
}

export function Renderer({ task, onAnswer, disabled }: RendererProps<HeroEmotionAnswer>) {
  const payload = task.payload as HeroEmotionPayload;
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
  const situationLabel = t(`game.heroEmotion.situations.${payload.situationId}`);

  return (
    <View style={styles.wrap}>
      <View style={styles.sceneCard}>
        <AppText style={styles.sceneEmoji}>{payload.sceneEmoji}</AppText>
        <AppText style={styles.situationText}>{situationLabel}</AppText>
        <AppText style={styles.prompt}>{t('game.heroEmotion.prompt')}</AppText>
      </View>

      <View style={styles.buttonsCol}>
        {payload.candidates.map((id) => (
          <EmotionButton
            key={id}
            id={id}
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
  onPress: () => void;
  disabled: boolean;
}

function EmotionButton({ id, onPress, disabled }: EmotionButtonProps) {
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
  sceneCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 200,
  },
  sceneEmoji: {
    fontSize: 80,
    lineHeight: 96,
  },
  situationText: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
  },
  prompt: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  buttonsCol: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  button: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
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
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fontFamily.extraBold,
    textAlign: 'center',
  },
});
