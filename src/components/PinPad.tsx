import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { AppText } from './AppText';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, radius, spacing, shadows } from '../constants/theme';

const PIN_LENGTH = 4;

interface PinPadProps {
  value: string;
  error?: boolean;
  onChange: (next: string) => void;
}

export function PinPad({ value, error = false, onChange }: PinPadProps) {
  const reducedMotion = useReducedMotion();
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!error) return;
    if (reducedMotion) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [error, shake, reducedMotion]);

  const handleKey = (key: string) => {
    if (key === 'back') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= PIN_LENGTH) return;
    onChange(value + key);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                filled && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          );
        })}
      </Animated.View>
      <View style={styles.numpad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
          <NumKey key={k} label={k} onPress={() => handleKey(k)} />
        ))}
        <View style={styles.numKeyWrap} />
        <NumKey label="0" onPress={() => handleKey('0')} />
        <NumKey label="⌫" onPress={() => handleKey('back')} />
      </View>
    </View>
  );
}

function NumKey({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.numKeyWrap}>
      <Pressable
        style={({ pressed }) => [styles.numKey, pressed && styles.numKeyPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <AppText variant="h1">{label}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xl },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.primary },
  dotError: { borderColor: colors.error, backgroundColor: colors.error },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.smd,
    maxWidth: 280,
  },
  numKeyWrap: {
    width: 72,
    height: 72,
  },
  numKey: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  numKeyPressed: {
    backgroundColor: colors.primaryLight,
    transform: [{ scale: 0.94 }],
  },
});
