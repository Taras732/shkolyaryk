import { View, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing, radius } from '@/src/constants/theme';

export type BottomTab = {
  key: string;
  icon: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function BottomTabBar({ tabs, activeKey }: { tabs: BottomTab[]; activeKey: string }) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={tab.disabled ? undefined : tab.onPress}
            style={({ pressed }) => [
              styles.tab,
              pressed && !tab.disabled ? { opacity: 0.6 } : null,
            ]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive, disabled: tab.disabled ?? false }}
          >
            <AppText
              style={[styles.icon, isActive ? styles.iconActive : null, tab.disabled ? styles.disabled : null]}
            >
              {tab.icon}
            </AppText>
            <AppText
              variant="caption"
              color={isActive ? colors.primary : tab.disabled ? colors.textDisabled : colors.textMuted}
              style={styles.label}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 72,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  icon: {
    fontSize: 22,
  },
  iconActive: {
    transform: [{ scale: 1.15 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
});
