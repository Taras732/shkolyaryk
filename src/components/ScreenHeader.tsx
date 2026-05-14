import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing, shadows } from '../constants/theme';

interface ScreenHeaderProps {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
}

export function ScreenHeader({ title, onBack, backLabel = '‹' }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable style={styles.iconBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Назад">
          <AppText style={styles.iconGlyph} color={colors.primary}>
            {backLabel}
          </AppText>
        </Pressable>
      ) : (
        <View style={styles.iconBtnSpacer} />
      )}
      {title ? (
        <AppText style={styles.title} color={colors.text} numberOfLines={1}>
          {title}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    marginBottom: spacing.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  iconBtnSpacer: {
    width: 44,
    height: 44,
  },
  iconGlyph: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: -2,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
});
