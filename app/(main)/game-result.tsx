import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { StarsReveal } from '@/src/components/game/StarsReveal';
import { getGame } from '@/src/games/registry';
import { colors, radius, spacing, shadows } from '@/src/constants/theme';
import { t } from '@/src/i18n';

export default function GameResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 50);
  const params = useLocalSearchParams<{ gameId: string; stars: string; xp: string }>();

  const gameId = params.gameId ?? '';
  const stars = Math.max(1, Math.min(3, parseInt(params.stars ?? '1', 10))) as 1 | 2 | 3;
  const xp = parseInt(params.xp ?? '0', 10);
  const game = gameId ? getGame(gameId) : undefined;

  const handleAgain = () => {
    if (!gameId) {
      router.replace('/(main)');
      return;
    }
    router.replace({ pathname: '/(main)/game/[id]', params: { id: gameId } });
  };

  const handleOther = () => {
    if (game?.islandId) {
      router.replace({ pathname: '/(main)/island/[id]', params: { id: game.islandId } });
    } else {
      router.replace('/(main)');
    }
  };

  const handleHub = () => router.replace('/(main)');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.content, { paddingTop: topPad }]}>
        <AppText variant="display" style={styles.celebrate}>🎉</AppText>
        <AppText variant="h1" style={styles.title}>{t('game.starsEarned')}</AppText>

        <View style={styles.starsWrap}>
          <StarsReveal stars={stars} />
        </View>

        <View style={styles.xpCard} accessibilityLiveRegion="polite" accessibilityLabel={`${t('game.xpEarned')} +${xp} XP`}>
          <AppText variant="caption" color={colors.textMuted}>{t('game.xpEarned')}</AppText>
          <AppText variant="h1" color={colors.primary}>+{xp} XP</AppText>
        </View>

        <View style={styles.actions}>
          <AppButton title={t('game.again')} tone="primary" size="lg" onPress={handleAgain} fullWidth accessibilityHint={t('game.againA11yHint')} />
          <AppButton title={t('game.otherGame')} tone="outline" size="md" onPress={handleOther} fullWidth accessibilityHint={t('game.otherGameA11yHint')} />
          <AppButton title={t('game.toHub')} tone="ghost" size="md" onPress={handleHub} fullWidth accessibilityHint={t('game.toHubA11yHint')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  celebrate: {
    fontSize: 80,
  },
  title: {
    textAlign: 'center',
  },
  starsWrap: {
    marginVertical: spacing.md,
  },
  xpCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.card,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
