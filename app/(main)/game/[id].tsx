import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, BackHandler, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { ConfirmModal } from '@/src/components/ConfirmModal';
import { GameHeader } from '@/src/components/game/GameHeader';
import { FeedbackOverlay } from '@/src/components/game/FeedbackOverlay';
import { TimerBar } from '@/src/components/game/TimerBar';
import type { AgeGroupId } from '@/src/constants/ageGroups';
import { getGame } from '@/src/games/registry';
import { useGameSession } from '@/src/games/useGameSession';
import { useChildProfilesStore } from '@/src/stores/childProfilesStore';
import { useProgressStore, type DifficultyLevel, type SessionLog } from '@/src/stores/progressStore';
import { evaluateBadges } from '@/src/utils/badgeEngine';
import { colors, radius, spacing, shadows } from '@/src/constants/theme';
import { t } from '@/src/i18n';

type Screen = 'intro' | 'level-picker' | 'playing';

const DEFAULT_LEVEL_META: Record<DifficultyLevel, { emoji: string; labelKey: string }> = {
  1: { emoji: '🟢', labelKey: 'game.level.easy' },
  2: { emoji: '🟡', labelKey: 'game.level.medium' },
  3: { emoji: '🔴', labelKey: 'game.level.hard' },
};

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 50);

  const activeProfile = useChildProfilesStore((s) => s.getActiveProfile());
  const addXp = useProgressStore((s) => s.addXp);
  const recordGameSession = useProgressStore((s) => s.recordGameSession);
  const logSession = useProgressStore((s) => s.logSession);
  const awardBadge = useProgressStore((s) => s.awardBadge);
  const unlockNextLevel = useProgressStore((s) => s.unlockNextLevel);
  const unlockedLevel = useProgressStore((s) =>
    activeProfile ? s.getUnlockedLevel(activeProfile.id, id ?? '') : 1,
  );

  const gameId = id ?? '';
  const game = gameId ? getGame(gameId) : undefined;

  const hasDifficulty = game?.hasDifficulty !== false;

  const [screen, setScreen] = useState<Screen>('intro');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [rulesOpen, setRulesOpen] = useState(false);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.centered, { paddingTop: topPad }]}>
          <AppText variant="h2">Гру не знайдено</AppText>
          <AppText variant="caption" color={colors.textMuted}>{gameId}</AppText>
          <AppButton title={t('common.back')} tone="ghost" onPress={() => router.replace('/(main)')} />
        </View>
      </SafeAreaView>
    );
  }

  const exit = () => router.replace('/(main)');

  if (screen === 'intro') {
    const gameName = game.name.startsWith('game.') ? t(game.name) : game.name;
    const taglineMatch = game.name.match(/^game\.([^.]+)\.name$/);
    const taglineKey = taglineMatch ? `game.taglines.${taglineMatch[1]}` : null;
    const taglineRaw = taglineKey ? t(taglineKey) : null;
    const tagline = taglineRaw && taglineRaw !== taglineKey ? taglineRaw : null;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={[styles.intro, { paddingTop: topPad }]}>
          <AppText variant="display" style={styles.mascot}>{game.icon ?? '🎯'}</AppText>
          <AppText variant="h1" style={styles.introTitle}>
            {gameName}
          </AppText>
          {tagline ? (
            <AppText variant="body" color={colors.textMuted} style={styles.introTagline}>
              {tagline}
            </AppText>
          ) : null}
          <AppText variant="body" color={colors.textMuted} style={styles.introHint}>
            {t('game.intro')}
          </AppText>
          <AppButton
            title={t('game.letsgo')}
            tone="primary"
            size="xl"
            onPress={() => setScreen(hasDifficulty ? 'level-picker' : 'playing')}
          />
          {game.rulesKey ? (
            <AppButton title={t('game.rules')} tone="outline" size="md" onPress={() => setRulesOpen(true)} />
          ) : null}
          <AppButton title={t('common.back')} tone="ghost" onPress={exit} />
        </View>

        <ConfirmModal
          visible={rulesOpen}
          title={t('game.rulesTitle')}
          message={game.rulesKey ? t(game.rulesKey) : ''}
          confirmLabel={t('game.rulesOk')}
          tone="primary"
          onConfirm={() => setRulesOpen(false)}
          onCancel={() => setRulesOpen(false)}
        />
      </SafeAreaView>
    );
  }

  if (screen === 'level-picker') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={[styles.intro, { paddingTop: topPad }]}>
          <AppText variant="h1" style={styles.introTitle}>
            {t('game.level.pickTitle')}
          </AppText>
          <View style={styles.levelList}>
            {([1, 2, 3] as DifficultyLevel[]).map((lvl) => {
              const unlocked = lvl <= unlockedLevel;
              const passed = lvl < unlockedLevel;
              const meta = game.levelLabels?.[lvl] ?? DEFAULT_LEVEL_META[lvl];
              return (
                <Pressable
                  key={lvl}
                  disabled={!unlocked}
                  onPress={() => {
                    setDifficulty(lvl);
                    setScreen('playing');
                  }}
                  style={[styles.levelCard, !unlocked && styles.levelCardLocked]}
                >
                  <AppText variant="display" style={{ fontSize: 48 }}>
                    {unlocked ? meta.emoji : '🔒'}
                  </AppText>
                  <AppText variant="h2" style={{ fontWeight: '800', color: unlocked ? colors.text : colors.textMuted, flex: 1, marginLeft: spacing.md }}>
                    {t(meta.labelKey)}
                  </AppText>
                  {passed ? (
                    <AppText variant="h2" style={{ color: colors.success ?? '#4CAF50', fontWeight: '800' }}>
                      ✓
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <AppButton title={t('common.back')} tone="ghost" onPress={() => setScreen('intro')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GameplayContainer
      key={`${gameId}-${difficulty}`}
      gameId={gameId}
      difficulty={difficulty}
      ageGroupId={activeProfile?.ageGroupId}
      profileId={activeProfile?.id ?? null}
      addXp={addXp}
      recordGameSession={recordGameSession}
      logSession={logSession}
      awardBadge={awardBadge}
      unlockNextLevel={unlockNextLevel}
      hasDifficulty={hasDifficulty}
      topPad={topPad}
      onExit={exit}
      onFinished={(stars, xp) => {
        router.replace({
          pathname: '/(main)/game-result',
          params: { gameId, stars: String(stars), xp: String(xp) },
        });
      }}
    />
  );
}

interface GameplayProps {
  gameId: string;
  difficulty: DifficultyLevel;
  ageGroupId?: AgeGroupId;
  profileId: string | null;
  addXp: (profileId: string, amount: number) => void;
  recordGameSession: (profileId: string, gameId: string, score: number, difficulty: number) => void;
  logSession: (profileId: string, log: SessionLog) => void;
  awardBadge: (profileId: string, badgeId: string) => void;
  unlockNextLevel: (profileId: string, gameId: string, currentLevel: DifficultyLevel) => void;
  hasDifficulty: boolean;
  topPad: number;
  onExit: () => void;
  onFinished: (stars: 1 | 2 | 3, xp: number) => void;
}

function GameplayContainer({
  gameId,
  difficulty,
  ageGroupId,
  profileId,
  addXp,
  recordGameSession,
  logSession,
  awardBadge,
  unlockNextLevel,
  hasDifficulty,
  topPad,
  onExit,
  onFinished,
}: GameplayProps) {
  const session = useGameSession(gameId, difficulty, ageGroupId);
  const game = getGame(gameId)!;
  const Renderer = game.Renderer;

  const [confirmExit, setConfirmExit] = useState(false);
  const committedRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    // auto-start playing (skip intro inside useGameSession — we already had intro screen)
    if (session.phase === 'intro') {
      session.start();
    }
  }, [session.phase, session.start]);

  useEffect(() => {
    if (session.phase === 'finished' && !committedRef.current) {
      committedRef.current = true;
      if (profileId) {
        const stars = session.stars as 1 | 2 | 3;
        recordGameSession(profileId, gameId, stars, difficulty);
        addXp(profileId, session.xpEarned);
        logSession(profileId, {
          gameId,
          islandId: game.islandId,
          difficulty,
          stars,
          xpEarned: session.xpEarned,
          mistakes: session.mistakes,
          totalTasks: session.totalTasks,
          durationMs: Date.now() - startedAtRef.current,
          finishedAt: Date.now(),
        });
        if (hasDifficulty && stars >= 1) {
          unlockNextLevel(profileId, gameId, difficulty);
        }
        const state = useProgressStore.getState();
        const newly = evaluateBadges(state, profileId);
        for (const id of newly) awardBadge(profileId, id);
      }
      onFinished(session.stars as 1 | 2 | 3, session.xpEarned);
    }
  }, [session.phase, session.stars, session.xpEarned, session.mistakes, session.totalTasks, profileId, gameId, difficulty, hasDifficulty, addXp, recordGameSession, logSession, awardBadge, unlockNextLevel, onFinished, game.islandId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (session.phase === 'playing') {
        setConfirmExit(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [session.phase]);

  const handleBack = useCallback(() => {
    setConfirmExit(true);
  }, []);

  if (session.phase === 'intro') {
    // transient — starts immediately via effect
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.playWrap, { paddingTop: topPad }]}>
        <GameHeader
          taskIndex={session.taskIndex}
          totalTasks={session.totalTasks}
          onBack={handleBack}
        />
        {session.currentTask?.timeLimitSec && session.taskStartedAt ? (
          <TimerBar
            startedAt={session.taskStartedAt}
            durationSec={session.currentTask.timeLimitSec}
            active={session.phase === 'playing'}
          />
        ) : null}

        <View style={styles.playfield}>
          {session.currentTask ? (
            <Renderer
              task={session.currentTask}
              onAnswer={session.submit}
              disabled={session.phase !== 'playing'}
            />
          ) : null}
        </View>

        <FeedbackOverlay
          visible={session.phase === 'feedback-correct' || session.phase === 'feedback-wrong'}
          kind={session.phase === 'feedback-correct' ? 'correct' : 'wrong'}
          messageCorrect={t('game.correct')}
          messageWrong={t('game.tryAgain')}
        />
      </View>

      <ConfirmModal
        visible={confirmExit}
        title={t('game.exitConfirm')}
        message={t('game.exitConfirmMsg')}
        confirmLabel={t('common.continue')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={() => {
          setConfirmExit(false);
          onExit();
        }}
        onCancel={() => setConfirmExit(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  intro: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  mascot: { fontSize: 96 },
  introTitle: { textAlign: 'center' },
  introTagline: { textAlign: 'center', fontSize: 18, paddingHorizontal: spacing.md },
  introHint: { textAlign: 'center' },
  playWrap: {
    flex: 1,
  },
  playfield: {
    flex: 1,
    ...shadows.card,
    borderRadius: radius.xl,
  },
  levelList: {
    width: '100%',
    gap: spacing.md,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  levelCardLocked: {
    opacity: 0.45,
  },
});
