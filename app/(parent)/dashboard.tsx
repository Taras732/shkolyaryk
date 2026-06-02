import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { ConfirmModal } from '@/src/components/ConfirmModal';
import { colors, radius, spacing, shadows, fontFamily } from '@/src/constants/theme';
import { t } from '@/src/i18n';
import { signOut, deleteAccount } from '@/src/hooks/useAuthActions';
import { useChildProfilesStore } from '@/src/stores/childProfilesStore';
import { useProgressStore, type SessionLog } from '@/src/stores/progressStore';
import { usePinStore } from '@/src/stores/pinStore';
import { getGame } from '@/src/games/registry';
import { getIslandById } from '@/src/constants/islands';
import { dayMinutes, weekMinutes, streakDays, recentSessions, startOfDay, todayIslandBreakdown } from '@/src/utils/sessionStats';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { mmkvStorage } from '@/src/utils/mmkv';

type Tab = 'progress' | 'time' | 'settings';
type DialogKind = null | 'logout' | 'delete1' | 'delete2' | 'deleteError';

const TABS: { id: Tab; icon: string; labelKey: string }[] = [
  { id: 'progress', icon: '📊', labelKey: 'parent.tabProgress' },
  { id: 'time', icon: '⏱️', labelKey: 'parent.tabTime' },
  { id: 'settings', icon: '⚙️', labelKey: 'parent.tabSettings' },
];

export default function ParentDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 50);
  const hasProfiles = useChildProfilesStore((s) => s.profiles.length > 0);
  const setUnlocked = usePinStore((s) => s.setUnlocked);
  const [tab, setTab] = useState<Tab>('progress');
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exitParent = () => {
    setUnlocked(false);
    router.replace('/(main)');
  };

  const performLogout = async () => {
    setLoggingOut(true);
    setUnlocked(false);
    useChildProfilesStore.setState({ activeProfileId: null });
    await signOut();
    setLoggingOut(false);
    setDialog(null);
    router.replace('/(auth)/login');
  };

  const performDelete = async () => {
    setDeleting(true);
    const res = await deleteAccount();
    if (!res.ok) {
      setDeleting(false);
      setDialog('deleteError');
      return;
    }
    const locale = useSettingsStore.getState().locale;
    const hasChosenLanguage = useOnboardingStore.getState().hasChosenLanguage;
    const hasSeenWelcome = useOnboardingStore.getState().hasSeenWelcome;
    mmkvStorage.clearAll();
    useChildProfilesStore.setState({ profiles: [], activeProfileId: null });
    useProgressStore.setState({
      xpByProfile: {},
      badgesByProfile: {},
      gameProgressByProfile: {},
      unlockedLevelByProfile: {},
      sessionsByProfile: {},
    });
    useOnboardingStore.setState({ hasChosenLanguage, hasSeenWelcome });
    usePinStore.setState({ pinHash: null, failedAttempts: 0, lockedUntil: null, unlocked: false });
    useSettingsStore.setState({ locale, parentPin: null, dailyTimeLimitMinutes: null });
    useAnalyticsStore.setState({ events: [] });
    setDeleting(false);
    setDialog(null);
    if (Platform.OS === 'web') {
      router.replace('/phone-home' as never);
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        {hasProfiles ? (
          <Pressable
            onPress={exitParent}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <AppText style={styles.backArrow}>‹</AppText>
            <AppText style={styles.backLabel}>{t('common.back')}</AppText>
          </Pressable>
        ) : <View style={{ width: 80 }} />}
        <AppText variant="title">{t('parent.dashboard')}</AppText>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((tb) => (
          <TabButton
            key={tb.id}
            icon={tb.icon}
            label={t(tb.labelKey)}
            active={tab === tb.id}
            onPress={() => setTab(tb.id)}
          />
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {tab === 'progress' ? <ProgressTab /> : null}
        {tab === 'time' ? <TimeTab /> : null}
        {tab === 'settings' ? (
          <SettingsTab
            onOpenProfiles={() => router.push('/(parent)/profiles')}
            onChangePin={() => router.push('/(parent)/pin-setup' as never)}
            onChangeLanguage={() => router.push('/language?from=settings' as never)}
            onLogout={() => setDialog('logout')}
            onDelete={() => setDialog('delete1')}
          />
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={dialog === 'logout'}
        title={t('auth.signOutConfirmTitle')}
        message={t('auth.signOutConfirmMessage')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('auth.signOut')}
        tone="danger"
        loading={loggingOut}
        onCancel={() => setDialog(null)}
        onConfirm={() => void performLogout()}
      />
      <ConfirmModal
        visible={dialog === 'delete1'}
        title={t('auth.deleteConfirm1Title')}
        message={t('auth.deleteConfirm1Message')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('auth.deleteButton')}
        tone="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => setDialog('delete2')}
      />
      <ConfirmModal
        visible={dialog === 'delete2'}
        title={t('auth.deleteConfirm2Title')}
        message={t('auth.deleteConfirm2Message')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('auth.deleteButton')}
        tone="danger"
        loading={deleting}
        onCancel={() => setDialog(null)}
        onConfirm={() => void performDelete()}
      />
      <ConfirmModal
        visible={dialog === 'deleteError'}
        title={t('auth.deleteAccount')}
        message={t('auth.deleteFailed')}
        confirmLabel={t('common.ok')}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

function TabButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <AppText style={styles.tabIcon}>{icon}</AppText>
      <AppText
        variant="caption"
        color={active ? '#fff' : colors.textMuted}
        style={{ fontWeight: active ? '700' : '600' }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const NO_SESSIONS: SessionLog[] = [];
const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function gameLabel(gameId: string): string {
  const g = getGame(gameId);
  if (!g) return gameId;
  return g.name.startsWith('game.') ? t(g.name) : g.name;
}

function relativeDay(ts: number): string {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  const diffDays = Math.round((today - day) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return t('parent.today');
  if (diffDays === 1) return t('parent.yesterday');
  return new Date(ts).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

function ProgressTab() {
  const activeId = useChildProfilesStore((s) => s.activeProfileId);
  const getXp = useProgressStore((s) => s.getXp);
  const getLevel = useProgressStore((s) => s.getLevel);
  const badgesMap = useProgressStore((s) => s.badgesByProfile);
  const sessions = useProgressStore((s) =>
    activeId ? s.sessionsByProfile[activeId] ?? NO_SESSIONS : NO_SESSIONS,
  );

  const xp = activeId ? getXp(activeId) : 0;
  const level = activeId ? getLevel(activeId) : 1;
  const badges = activeId ? (badgesMap[activeId]?.length ?? 0) : 0;
  const streak = streakDays(sessions);

  const week = weekMinutes(sessions);
  const weekMax = Math.max(...week, 1);
  const recent = recentSessions(sessions, 6);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.statRow}>
        <StatCard value={String(xp)} label={t('parent.statXp')} />
        <StatCard value={String(level)} label={t('parent.statLevel')} />
        <StatCard value={`${streak} 🔥`} label={t('parent.statStreak')} />
        <StatCard value={String(badges)} label={t('parent.statBadges')} />
      </View>

      <View style={styles.panel}>
        <AppText variant="h2" style={styles.panelTitle}>{t('parent.weekActivity')}</AppText>
        <View style={styles.bars}>
          {week.map((m, i) => (
            <View key={i} style={styles.barCol}>
              <AppText variant="caption" color={colors.textMuted}>{m > 0 ? m : ''}</AppText>
              <View style={[styles.bar, { height: m > 0 ? (m / weekMax) * 110 + 6 : 2 }]} />
              <AppText variant="caption" color={colors.textMuted}>{WEEK_DAYS[i]}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <AppText variant="h2" style={styles.panelTitle}>{t('parent.recentActivity')}</AppText>
        {recent.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted}>{t('parent.activityEmpty')}</AppText>
        ) : (
          recent.map((s, i) => (
            <View key={`${s.finishedAt}-${i}`} style={styles.activityRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="body" color={colors.text} style={{ fontWeight: '600' }} numberOfLines={1}>
                  {gameLabel(s.gameId)}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {relativeDay(s.finishedAt)} · {'⭐'.repeat(s.stars)}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>+{s.xpEarned} XP</AppText>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function TimeTab() {
  const activeId = useChildProfilesStore((s) => s.activeProfileId);
  const sessions = useProgressStore((s) =>
    activeId ? s.sessionsByProfile[activeId] ?? NO_SESSIONS : NO_SESSIONS,
  );
  const todayMin = dayMinutes(sessions);
  const islands = todayIslandBreakdown(sessions);
  const todayGames = islands.reduce((acc, i) => acc + i.games, 0);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.statRow}>
        <StatCard value={`${todayMin} хв`} label={t('parent.statToday')} />
        <StatCard value={String(todayGames)} label={t('parent.statGamesToday')} />
      </View>

      <View style={styles.panel}>
        <AppText variant="h2" style={styles.panelTitle}>{t('parent.todayByIsland')}</AppText>
        {islands.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted}>{t('parent.activityEmpty')}</AppText>
        ) : (
          islands.map((isl) => {
            const meta = getIslandById(isl.islandId);
            return (
              <View key={isl.islandId} style={styles.activityRow}>
                <AppText style={{ fontSize: 22 }}>{meta?.icon ?? '🎮'}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" color={colors.text} style={{ fontWeight: '600' }} numberOfLines={1}>
                    {meta?.name ?? isl.islandId}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {t('parent.reportGames', { n: isl.games })} · {isl.minutes} хв · {'⭐'.repeat(Math.min(isl.stars, 5))}
                  </AppText>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.panel}>
        <AppText variant="h2" style={styles.panelTitle}>{t('parent.dailyLimit')}</AppText>
        <AppText variant="caption" color={colors.textMuted}>{t('parent.timeHint')}</AppText>
      </View>
    </View>
  );
}

function SettingsTab({
  onOpenProfiles,
  onChangePin,
  onChangeLanguage,
  onLogout,
  onDelete,
}: {
  onOpenProfiles: () => void;
  onChangePin: () => void;
  onChangeLanguage: () => void;
  onLogout: () => void;
  onDelete: () => void;
}) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setMusicEnabled = useSettingsStore((s) => s.setMusicEnabled);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.panel}>
        <SettingsRow icon="👧" label={t('parent.profiles')} onPress={onOpenProfiles} />
        <SettingsRow icon="🔒" label={t('parent.changePin')} onPress={onChangePin} />
        <SettingsRow icon="🌐" label={t('parent.changeLanguage')} onPress={onChangeLanguage} />
      </View>
      <View style={styles.panel}>
        <SettingsToggleRow icon="🔊" label={t('parent.sound')} value={soundEnabled} onChange={setSoundEnabled} />
        <SettingsToggleRow icon="🎵" label={t('parent.music')} value={musicEnabled} onChange={setMusicEnabled} last />
      </View>
      <View style={styles.panel}>
        <SettingsRow icon="🚪" label={t('auth.signOut')} onPress={onLogout} />
        <SettingsRow icon="🗑️" label={t('auth.deleteAccount')} onPress={onDelete} tone="danger" />
      </View>
    </View>
  );
}

function SettingsToggleRow({
  icon,
  label,
  value,
  onChange,
  last = false,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingsRow, last && { borderBottomWidth: 0 }]}>
      <AppText style={styles.settingsIcon}>{icon}</AppText>
      <AppText variant="body" color={colors.text} style={{ flex: 1, fontWeight: '600' }}>
        {label}
      </AppText>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: string;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}>
      <AppText style={styles.settingsIcon}>{icon}</AppText>
      <AppText variant="body" color={tone === 'danger' ? colors.danger : colors.text} style={{ flex: 1, fontWeight: '600' }}>
        {label}
      </AppText>
      <AppText color={colors.textMuted}>›</AppText>
    </Pressable>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <AppText variant="title" color={colors.primary}>{value}</AppText>
      <AppText variant="caption" color={colors.textMuted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    minWidth: 80,
    ...shadows.card,
  },
  backArrow: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: fontFamily.extraBold,
    color: colors.primary,
  },
  backLabel: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    padding: spacing.xs,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 2,
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabIcon: { fontSize: 22 },
  content: { flex: 1 },
  contentInner: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
    ...shadows.card,
  },
  panel: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  panelTitle: { marginBottom: spacing.xs },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingHorizontal: spacing.xs,
  },
  barCol: { alignItems: 'center', gap: 4, flex: 1 },
  bar: {
    width: '70%',
    backgroundColor: colors.primaryLight,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderWidth: 0,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsIcon: { fontSize: 24 },
});
