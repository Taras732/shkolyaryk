import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, radius } from '../constants/theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, disabled }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={[styles.touchTarget, disabled ? styles.disabled : null]}
    >
      <View
        style={[
          styles.box,
          checked ? styles.boxChecked : styles.boxUnchecked,
        ]}
      >
        {checked ? (
          <AppText style={styles.mark} color="#FFFFFF">
            ✓
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxUnchecked: {
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  mark: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
});

interface RequirementRowProps {
  met: boolean;
  label: string;
}

export function RequirementRow({ met, label }: RequirementRowProps) {
  return (
    <View style={reqStyles.row}>
      <View
        style={[
          reqStyles.dot,
          met ? reqStyles.dotMet : reqStyles.dotUnmet,
        ]}
      >
        {met ? (
          <AppText style={reqStyles.check} color="#FFFFFF">
            ✓
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={met ? colors.success : colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dotMet: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dotUnmet: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  check: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
});
