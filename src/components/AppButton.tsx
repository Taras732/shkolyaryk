import { useState } from 'react';
import { Pressable, ActivityIndicator, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing, shadows } from '../constants/theme';
import { AppText } from './AppText';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Size = 'sm' | 'md' | 'lg' | 'xl';
type Tone = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  size?: Size;
  tone?: Tone;
  fullWidth?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const sizeStyles: Record<Size, { minHeight: number; paddingVertical: number; paddingHorizontal: number }> = {
  sm: { minHeight: 44, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { minHeight: 48, paddingVertical: spacing.smd, paddingHorizontal: spacing.lg },
  lg: { minHeight: 56, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  xl: { minHeight: 64, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
};

export function AppButton({
  title,
  size = 'md',
  tone = 'primary',
  fullWidth = false,
  loading = false,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: AppButtonProps) {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const backgroundColor =
    tone === 'primary'
      ? colors.primary
      : tone === 'secondary'
      ? colors.secondary
      : tone === 'danger'
      ? colors.danger
      : 'transparent';

  const textColor =
    tone === 'outline' || tone === 'ghost' ? colors.primary : '#FFFFFF';

  const borderStyle: ViewStyle =
    tone === 'outline'
      ? { borderWidth: 2, borderColor: colors.primary }
      : {};

  const flatStyle: ViewStyle = {
    ...styles.base,
    ...sizeStyles[size],
    backgroundColor,
    ...borderStyle,
    ...(fullWidth ? { width: '100%' } : {}),
    opacity: isDisabled ? 0.4 : 1,
    transform: pressed && !isDisabled && !reducedMotion ? [{ scale: 0.96 }] : [{ scale: 1 }],
    ...(tone === 'primary' && !isDisabled ? (pressed ? shadows.btnPressed : shadows.btn) : {}),
    ...style,
  };

  return (
    <Pressable
      style={flatStyle}
      disabled={isDisabled}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText variant="body" color={textColor} style={styles.label}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontWeight: '700',
  },
});
