import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamily } from '../../constants/theme';
import { t } from '../../i18n';
import type { RendererProps } from '../types';

export type SyllableAnswer = string;

export interface SyllablePayload {
  consonant: string;
  targetVowel: string;
  options: string[];
}

export function Renderer({ task, onAnswer, disabled }: RendererProps<SyllableAnswer>) {
  const payload = task.payload as SyllablePayload;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
  }, [task.id]);

  const handlePress = (value: string) => {
    if (disabled || locked) return;
    setLocked(true);
    onAnswer(value);
  };

  const isDisabled = !!disabled || locked;
  const prompt = t('game.syllableBuild.prompt', {
    syllable: `${payload.consonant}_`,
  });
  const [row1, row2] = [payload.options.slice(0, 2), payload.options.slice(2, 4)];

  return (
    <View style={styles.wrap}>
      <View style={styles.promptBox}>
        <AppText style={styles.prompt}>{prompt}</AppText>
      </View>

      <View style={styles.assemble}>
        <View style={styles.tileFilled}>
          <AppText style={styles.tileText}>{payload.consonant}</AppText>
        </View>
        <View style={styles.tileEmpty}>
          <AppText style={styles.tileQuestion}>?</AppText>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          {row1.map((v, i) => (
            <VowelBtn key={`r1-${i}`} letter={v} onPress={() => handlePress(v)} disabled={isDisabled} />
          ))}
        </View>
        <View style={styles.row}>
          {row2.map((v, i) => (
            <VowelBtn key={`r2-${i}`} letter={v} onPress={() => handlePress(v)} disabled={isDisabled} />
          ))}
        </View>
      </View>
    </View>
  );
}

interface VowelBtnProps {
  letter: string;
  onPress: () => void;
  disabled: boolean;
}

function VowelBtn({ letter, onPress, disabled }: VowelBtnProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tapZone,
        disabled && styles.tapZoneDisabled,
        pressed && !disabled && styles.tapZonePressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={letter}
      hitSlop={4}
    >
      <AppText style={styles.vowel} color={disabled ? colors.textDisabled : colors.text}>
        {letter}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  promptBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  prompt: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: fontFamily.extraBold,
    color: colors.text,
    textAlign: 'center',
  },
  assemble: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  tileFilled: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmpty: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontSize: 56,
    lineHeight: 68,
    fontFamily: fontFamily.extraBold,
  },
  tileQuestion: {
    fontSize: 48,
    lineHeight: 60,
    fontFamily: fontFamily.extraBold,
    color: colors.textMuted,
  },
  grid: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  tapZone: {
    flex: 1,
    minHeight: 100,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapZoneDisabled: { opacity: 0.5 },
  tapZonePressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  vowel: {
    fontSize: 56,
    lineHeight: 68,
    fontFamily: fontFamily.extraBold,
  },
});
