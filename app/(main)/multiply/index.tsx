import { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { useChildProfilesStore } from '@/src/stores/childProfilesStore';
import { useProgressStore } from '@/src/stores/progressStore';
import { computeStars, computeXp } from '@/src/games/types';
import { colors, radius, spacing, shadows } from '@/src/constants/theme';
import { t } from '@/src/i18n';

type Phase = 'picker' | 'study' | 'quiz' | 'result';

const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const QUESTIONS_PER_ROUND = 10;
const MASTERY_THRESHOLD = 8;
// Стабільний референс — інакше Zustand-селектор повертає новий [] щоразу
// і useSyncExternalStore зациклює рендер (білий екран).
const EMPTY_MASTERY: number[] = [];

interface Question {
  a: number;
  b: number;
  correct: number;
  choices: number[];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(correct: number): number[] {
  const pool = new Set<number>([correct]);
  const candidates = [correct + 1, correct - 1, correct + 2, correct - 2, correct + 3, correct + 5, correct - 5];
  for (const c of candidates) {
    if (c > 0 && !pool.has(c)) pool.add(c);
    if (pool.size >= 4) break;
  }
  let fill = 1;
  while (pool.size < 4) {
    if (fill !== correct) pool.add(fill);
    fill++;
  }
  return shuffle(Array.from(pool).slice(0, 4));
}

function buildQuestions(multiplier: number | null): Question[] {
  if (multiplier !== null) {
    // одна цифра — усі b=1..10 у рандомному порядку
    return shuffle(MULTIPLIERS).map((b) => {
      const correct = multiplier * b;
      return { a: multiplier, b, correct, choices: makeChoices(correct) };
    });
  }
  // мікс — рандомні пари з усієї таблиці
  return Array.from({ length: QUESTIONS_PER_ROUND }, () => {
    const a = randInt(1, 10);
    const b = randInt(1, 10);
    const correct = a * b;
    return { a, b, correct, choices: makeChoices(correct) };
  });
}

export default function MultiplyTrainerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 50);

  const profile = useChildProfilesStore((s) => s.getActiveProfile());
  const profileId = profile?.id ?? null;
  const mastery = useProgressStore((s) =>
    profileId ? s.multiplyMasteryByProfile[profileId] ?? EMPTY_MASTERY : EMPTY_MASTERY,
  );
  const markMastered = useProgressStore((s) => s.markMultiplyMastered);
  const logSession = useProgressStore((s) => s.logSession);
  const addXp = useProgressStore((s) => s.addXp);

  const [phase, setPhase] = useState<Phase>('picker');
  const [selected, setSelected] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const committedRef = useRef(false);

  const startStudy = (multiplier: number | null) => {
    setSelected(multiplier);
    setPhase(multiplier === null ? 'quiz' : 'study');
    if (multiplier === null) startQuiz(null);
  };

  const startQuiz = (multiplier: number | null) => {
    setQuestions(buildQuestions(multiplier));
    setQIndex(0);
    setCorrectCount(0);
    setPicked(null);
    committedRef.current = false;
    startedAtRef.current = Date.now();
    setPhase('quiz');
  };

  const answer = (value: number) => {
    if (picked !== null) return;
    setPicked(value);
    const isRight = value === questions[qIndex].correct;
    const nextCorrect = correctCount + (isRight ? 1 : 0);
    if (isRight) setCorrectCount(nextCorrect);

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        finishRound(nextCorrect);
      } else {
        setQIndex((i) => i + 1);
        setPicked(null);
      }
    }, 850);
  };

  const finishRound = (finalCorrect: number) => {
    if (!committedRef.current && profileId) {
      committedRef.current = true;
      const mistakes = questions.length - finalCorrect;
      const stars = computeStars(mistakes);
      const xp = computeXp(stars);
      logSession(profileId, {
        gameId: 'times-tables',
        islandId: 'math',
        difficulty: 1,
        stars,
        xpEarned: xp,
        mistakes,
        totalTasks: questions.length,
        durationMs: Date.now() - startedAtRef.current,
        finishedAt: Date.now(),
      });
      addXp(profileId, xp);
      if (selected !== null && finalCorrect >= MASTERY_THRESHOLD) {
        markMastered(profileId, selected);
      }
    }
    setCorrectCount(finalCorrect);
    setPhase('result');
  };

  // ── Вибір множника ───────────────────────────────────────
  if (phase === 'picker') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}>
          <AppText variant="display" style={styles.icon}>✖️</AppText>
          <AppText variant="h1" style={styles.center}>{t('trainer.title')}</AppText>
          <AppText variant="body" color={colors.textMuted} style={styles.center}>
            {t('trainer.pickPrompt')}
          </AppText>

          <AppText variant="caption" color={colors.textMuted} style={styles.center}>
            {t('trainer.progressLabel', { done: mastery.length, total: 10 })}
          </AppText>

          <View style={styles.grid}>
            {MULTIPLIERS.map((n) => {
              const done = mastery.includes(n);
              return (
                <Pressable
                  key={n}
                  style={[styles.numCard, done && styles.numCardDone]}
                  onPress={() => startStudy(n)}
                >
                  <AppText variant="display" style={[styles.numText, done && { color: '#fff' }]}>×{n}</AppText>
                  {done ? <AppText style={styles.numBadge}>🟢</AppText> : null}
                </Pressable>
              );
            })}
          </View>

          <AppButton title={t('trainer.mix')} tone="outline" size="xl" onPress={() => startStudy(null)} />
          <AppButton title={t('common.back')} tone="ghost" onPress={() => router.back()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Перегляд таблиці ─────────────────────────────────────
  if (phase === 'study' && selected !== null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}>
          <AppText variant="h1" style={styles.center}>{t('trainer.studyTitle', { n: selected })}</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.center}>
            {t('trainer.studyHint')}
          </AppText>
          <View style={styles.table}>
            {MULTIPLIERS.map((b) => (
              <View key={b} style={styles.tableRow}>
                <AppText variant="h2" color={colors.text}>{selected} × {b}</AppText>
                <AppText variant="h2" color={colors.primary} style={{ fontWeight: '800' }}>
                  = {selected * b}
                </AppText>
              </View>
            ))}
          </View>
          <AppButton title={t('trainer.ready')} tone="primary" size="xl" onPress={() => startQuiz(selected)} />
          <AppButton title={t('common.back')} tone="ghost" onPress={() => setPhase('picker')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Тести ────────────────────────────────────────────────
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[qIndex];
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={[styles.quizWrap, { paddingTop: topPad }]}>
          <AppText variant="caption" color={colors.textMuted}>
            {qIndex + 1} / {questions.length}
          </AppText>

          <View style={styles.questionCard}>
            <AppText variant="display" style={styles.questionText}>
              {q.a} × {q.b}
            </AppText>
            <AppText variant="h1" color={colors.textMuted}>= ?</AppText>
          </View>

          <View style={styles.choices}>
            {q.choices.map((c) => {
              const answered = picked !== null;
              const isCorrect = c === q.correct;
              const isPicked = c === picked;
              return (
                <Pressable
                  key={c}
                  disabled={answered}
                  onPress={() => answer(c)}
                  style={[
                    styles.choice,
                    answered && isCorrect && styles.choiceCorrect,
                    answered && isPicked && !isCorrect && styles.choiceWrong,
                  ]}
                >
                  <AppText variant="display" style={styles.choiceText}>{c}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Результат ────────────────────────────────────────────
  const passed = selected !== null && correctCount >= MASTERY_THRESHOLD;
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.resultWrap, { paddingTop: topPad }]}>
        <AppText variant="display" style={{ fontSize: 88 }}>{passed ? '🟢' : '💪'}</AppText>
        <AppText variant="h1" style={styles.center}>
          {t('trainer.correctOf', { correct: correctCount, total: questions.length })}
        </AppText>
        <AppText variant="body" color={colors.textMuted} style={styles.center}>
          {selected === null
            ? t('trainer.mixDone')
            : passed
              ? t('trainer.masteredNow', { n: selected })
              : t('trainer.almostThere')}
        </AppText>

        <View style={{ height: spacing.md }} />

        {selected !== null && passed && selected < 10 ? (
          <AppButton
            title={t('trainer.nextNumber')}
            tone="primary"
            size="xl"
            onPress={() => startStudy(selected + 1)}
          />
        ) : null}
        <AppButton
          title={t('trainer.tryAgain')}
          tone={passed ? 'outline' : 'primary'}
          size="xl"
          onPress={() => startQuiz(selected)}
        />
        <AppButton title={t('trainer.toPicker')} tone="ghost" onPress={() => setPhase('picker')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { textAlign: 'center' },
  icon: { fontSize: 72, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  numCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  numCardDone: {
    backgroundColor: colors.success,
  },
  numText: { fontSize: 36, fontWeight: '800', color: colors.text },
  numBadge: { position: 'absolute', top: 6, right: 8, fontSize: 14 },
  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quizWrap: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  questionCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.card,
  },
  questionText: { fontSize: 56, fontWeight: '800', color: colors.text },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    width: '100%',
  },
  choice: {
    width: '47%',
    aspectRatio: 1.6,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choiceCorrect: { borderColor: colors.success, backgroundColor: '#E8FBF0' },
  choiceWrong: { borderColor: colors.danger, backgroundColor: '#FDECEC' },
  choiceText: { fontSize: 40, fontWeight: '800', color: colors.text },
  resultWrap: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
