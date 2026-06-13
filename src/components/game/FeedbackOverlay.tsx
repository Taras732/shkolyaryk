import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Pressable } from 'react-native';
import { AppText } from '../AppText';
import { colors, radius, spacing } from '../../constants/theme';

export type FeedbackKind = 'correct' | 'wrong';

interface Props {
  visible: boolean;
  kind: FeedbackKind;
  messageCorrect: string;
  messageWrong: string;
  /** Mistake-review lines (e.g. "You chose: 5", "Correct: 7"). Wrong only. */
  detailLines?: string[];
  /** Label for the continue button shown on a wrong answer. */
  nextLabel?: string;
  /** When provided, a wrong answer waits for the child to tap to continue. */
  onDismiss?: () => void;
}

export function FeedbackOverlay({
  visible,
  kind,
  messageCorrect,
  messageWrong,
  detailLines,
  nextLabel,
  onDismiss,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      scale.setValue(0.7);
    }
  }, [visible, opacity, scale]);

  if (!visible) return null;

  const isCorrect = kind === 'correct';
  const icon = isCorrect ? '✓' : '✗';
  const emoji = isCorrect ? '🎉' : '🤔';
  const message = isCorrect ? messageCorrect : messageWrong;
  const tint = isCorrect ? colors.success : colors.warning;

  // A wrong answer with a dismiss handler becomes an interactive review card:
  // it stays up (catching touches so the child can't tap the game underneath)
  // until the child taps "Next", and shows what they chose vs. the answer.
  const interactive = !isCorrect && !!onDismiss;
  const lines = interactive ? detailLines?.filter(Boolean) ?? [] : [];

  return (
    <Animated.View pointerEvents={interactive ? 'auto' : 'none'} style={[styles.backdrop, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <AppText variant="display" style={styles.emoji}>{emoji}</AppText>
        <View style={[styles.iconCircle, { backgroundColor: tint }]}>
          <AppText variant="h1" color="#FFFFFF">{icon}</AppText>
        </View>
        <AppText variant="h2" style={styles.msg}>{message}</AppText>

        {lines.length > 0 ? (
          <View style={styles.review}>
            {lines.map((line, i) => (
              <AppText key={i} variant="body" style={styles.reviewLine}>{line}</AppText>
            ))}
          </View>
        ) : null}

        {interactive ? (
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed]}
          >
            <AppText variant="h2" color="#FFFFFF" style={styles.nextLabel}>{nextLabel}</AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 27, 58, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 220,
    maxWidth: 340,
  },
  emoji: {
    fontSize: 56,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msg: {
    textAlign: 'center',
  },
  review: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
  },
  reviewLine: {
    textAlign: 'center',
    fontWeight: '700',
  },
  nextBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 160,
    alignItems: 'center',
  },
  nextBtnPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: colors.primaryLight,
  },
  nextLabel: {
    fontWeight: '800',
  },
});
