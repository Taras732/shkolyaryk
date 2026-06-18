import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { getIslandById, isIslandActive } from '@/src/constants/islands';
import { listGamesByIsland, listGamesByIslandForGroup } from '@/src/games/registry';
import { listThemesByIsland } from '@/src/constants/learningThemes';
import { useChildProfilesStore } from '@/src/stores/childProfilesStore';
import { colors, radius, spacing, shadows } from '@/src/constants/theme';
import { t } from '@/src/i18n';

function getTagline(nameKey: string): string | null {
  const match = nameKey.match(/^game\.([^.]+)\.name$/);
  if (!match) return null;
  const key = `game.taglines.${match[1]}`;
  const translated = t(key);
  return translated === key ? null : translated;
}

export default function IslandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 50);
  const islandId = id ?? '';
  const island = getIslandById(islandId);
  const activeProfile = useChildProfilesStore((s) => s.getActiveProfile());
  // Hidden (non-MVP) islands render empty — they're built but not shipped yet.
  const active = isIslandActive(islandId);
  const games = !active
    ? []
    : activeProfile
      ? listGamesByIslandForGroup(islandId, activeProfile.ageGroupId)
      : listGamesByIsland(islandId);
  const themes = active && activeProfile
    ? listThemesByIsland(islandId, activeProfile.ageGroupId)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingTop: topPad }}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="display">{island?.icon ?? '❓'}</AppText>
        <AppText variant="title">{island?.name ?? 'Острів'}</AppText>
        {island?.description ? (
          <AppText variant="body" color={colors.textMuted} style={styles.desc}>
            {island.description}
          </AppText>
        ) : null}

        {themes.length > 0 ? (
          <View style={styles.gamesList}>
            <AppText variant="h2" style={styles.sectionHeading}>{t('learn.sectionTitle')}</AppText>
            {themes.map((th) => (
              <Pressable
                key={th.id}
                style={styles.themeCard}
                onPress={() => router.push(`/(main)/learn/${th.id}` as never)}
              >
                <AppText style={styles.gameIcon}>{th.icon}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="h2" numberOfLines={1}>{th.title}</AppText>
                  <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
                    {th.intro}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.gamesList}>
          {games.length === 0 ? (
            <AppText variant="caption" color={colors.textMuted}>
              Ігри скоро з'являться 🎮
            </AppText>
          ) : (
            games.map((g) => {
              const tagline = getTagline(g.name);
              return (
                <Pressable
                  key={g.id}
                  style={styles.gameCard}
                  onPress={() =>
                    router.push({ pathname: '/(main)/game/[id]', params: { id: g.id } })
                  }
                >
                  <AppText style={styles.gameIcon}>{g.icon ?? '🎯'}</AppText>
                  <View style={{ flex: 1 }}>
                    <AppText variant="h2" numberOfLines={1}>
                      {g.name.startsWith('game.') ? t(g.name) : g.name}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
                      {tagline ?? `${t('common.continue')} →`}
                    </AppText>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <AppButton
          title={t('common.back')}
          tone="ghost"
          onPress={() => router.replace('/(main)')}
        />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  desc: {
    textAlign: 'center',
  },
  gamesList: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeading: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.card,
  },
  gameIcon: {
    fontSize: 40,
  },
});
