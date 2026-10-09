import { useEffect, useMemo, useReducer, useCallback, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { recordActivity } from '@/utils/activity';
import { logGame } from '@/school/game-log';
import { sendGameEvent } from '@/school/report-sync';
import { scheduleFamilySync } from '@/school/family-sync-run';
import { recordGameResult } from '@/school/mastery';
import { fetchPrereqHint, type PrereqHint } from '@/school/hint';
import { isWeakResult, buildPrereqHintMessage } from '@/school/hint-core';
import { encouragementFor } from './shared/encouragement';
import { CloseButton, FiveStars, PreschoolProvider, SKY, SkyScene } from './shared/preschool';
import {
  type GameDefinition,
  type ProfileLevel,
  type ClassLevel,
  type Difficulty,
  type AnswerState,
  type LevelData,
  BOARD_DONE,
  computeStars,
  unlockedAfter,
  DIFFICULTY_LABEL,
  type GameExplain,
} from './types';

const FEEDBACK_CORRECT_MS = 850;
const FEEDBACK_WRONG_MS = 1100;

interface ShellState {
  levelData: LevelData;
  difficulty: Difficulty;
  roundIndex: number;
  mistakes: number;
  answerState: AnswerState;
  finished: boolean;
  stars: 0 | 1 | 2 | 3;
}

type Action =
  | { type: 'CORRECT' }
  | { type: 'WRONG' }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'MISTAKE' }
  | { type: 'ADVANCE' }
  | { type: 'FINISH' }
  | { type: 'RESET'; levelData: LevelData; difficulty: Difficulty };

function reducer(state: ShellState, action: Action): ShellState {
  switch (action.type) {
    case 'CORRECT':
      if (state.answerState !== 'idle') return state;
      return { ...state, answerState: 'correct' };
    case 'WRONG':
      if (state.answerState !== 'idle') return state;
      return { ...state, answerState: 'incorrect', mistakes: state.mistakes + 1 };
    case 'CLEAR_FEEDBACK':
      if (state.answerState !== 'incorrect') return state;
      return { ...state, answerState: 'idle' };
    case 'MISTAKE':
      return { ...state, mistakes: state.mistakes + 1 };
    case 'ADVANCE': {
      const next = state.roundIndex + 1;
      if (next >= state.levelData.rounds.length) {
        const stars = computeStars(state.mistakes, state.levelData.rounds.length);
        return { ...state, finished: true, stars, answerState: 'idle' };
      }
      return { ...state, roundIndex: next, answerState: 'idle' };
    }
    case 'FINISH': {
      const stars = computeStars(state.mistakes, state.levelData.rounds.length);
      return { ...state, finished: true, stars, answerState: 'idle' };
    }
    case 'RESET':
      return {
        levelData: action.levelData,
        difficulty: action.difficulty,
        roundIndex: 0,
        mistakes: 0,
        answerState: 'idle',
        finished: false,
        stars: 0,
      };
    default:
      return state;
  }
}

interface GameShellProps {
  game: GameDefinition;
  level: ProfileLevel;
  /** Навчальний клас дитини (G2) — для двовісних генераторів. */
  classLevel: ClassLevel;
  profileId: string;
  onExit: () => void;
  /** Дошкілля: «Далі» — наступна гра в місці (якщо є). */
  onNext?: () => void;
}

export default function GameShell({ game, level, classLevel, profileId, onExit, onNext }: GameShellProps) {
  const { user } = useAuthStore();
  const { progress, updateProgress, profiles } = useProfileStore();

  // Найвища відкрита складність для цієї гри в цього профілю (з level gate).
  const prevUnlocked = useMemo<Difficulty>(() => {
    const saved = progress[profileId]?.[game.id]?.level;
    return (saved === 2 || saved === 3 ? saved : 1) as Difficulty;
    // навмисно тільки при монтуванні — не рестартувати гру при апдейті прогресу
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, dispatch] = useReducer(reducer, undefined, (): ShellState => {
    const levelData = game.generate(prevUnlocked, level, classLevel);
    return {
      levelData,
      difficulty: prevUnlocked,
      roundIndex: 0,
      mistakes: 0,
      answerState: 'idle',
      finished: false,
      stars: 0,
    };
  });

  // EP12: підказка про непокриту передумову (skill-graph A2 + mastery A4), коли
  // результат слабкий. null поки не завантажено/не застосовно — екран результату
  // рендериться без неї (не блокує).
  const [prereqHint, setPrereqHint] = useState<PrereqHint | null>(null);

  // EP1: пояснення «чому» для поточної помилки (null — гра його не дає).
  const [explain, setExplain] = useState<GameExplain | null>(null);
  const [boardFilled, setBoardFilled] = useState(0);

  const round = state.levelData.rounds[Math.min(state.roundIndex, state.levelData.rounds.length - 1)];
  const total = state.levelData.rounds.length;

  const checkCorrect = useCallback(
    (answer: unknown) =>
      game.isCorrect ? game.isCorrect(round, answer) : answer === round.answer,
    [game, round],
  );

  const handleAnswer = useCallback(
    (answer: unknown) => {
      if (state.answerState !== 'idle' || state.finished) return;

      // Board-based ігри шлють сентінел завершення поля.
      if (answer === BOARD_DONE) {
        dispatch({ type: 'FINISH' });
        return;
      }

      if (checkCorrect(answer)) {
        dispatch({ type: 'CORRECT' });
        confetti({ particleCount: 45, spread: 42, origin: { y: 0.65 }, disableForReducedMotion: true });
        window.setTimeout(() => dispatch({ type: 'ADVANCE' }), FEEDBACK_CORRECT_MS);
      } else {
        dispatch({ type: 'WRONG' });

        // EP1: якщо гра вміє пояснити ЧОМУ — показуємо пояснення і НЕ прибираємо
        // фідбек за таймером: 1.1 с не вистачить, щоб його прочитати. Далі веде
        // дитина кнопкою. Гра без explain поводиться точно як раніше.
        const why = game.explain?.(round, answer) ?? null;
        if (why) setExplain(why);
        else window.setTimeout(() => dispatch({ type: 'CLEAR_FEEDBACK' }), FEEDBACK_WRONG_MS);
      }
    },
    [state.answerState, state.finished, checkCorrect, game, round],
  );

  /** «Зрозуміло» після пояснення — повертає до тієї ж задачі, ще спроба. */
  const dismissExplain = useCallback(() => {
    setExplain(null);
    dispatch({ type: 'CLEAR_FEEDBACK' });
  }, []);

  const handleMistake = useCallback(() => dispatch({ type: 'MISTAKE' }), []);

  // Зберегти прогрес при завершенні.
  useEffect(() => {
    if (!state.finished) return;
    const newUnlocked = unlockedAfter(state.difficulty, state.stars, prevUnlocked);
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
    recordActivity(profileId);
    logGame(profileId, { at: Date.now(), gameId: game.id, difficulty: state.difficulty, mistakes: state.mistakes, stars: state.stars });
    const kid = profiles.find((p) => p.id === profileId);
    if (kid) sendGameEvent(kid, game, state.difficulty, state.mistakes);
    scheduleFamilySync();
    updateProgress(
      profileId,
      game.id,
      newUnlocked,
      state.stars,
      { at: new Date().toISOString(), difficulty: state.difficulty, mistakes: state.mistakes },
      user?.id,
    );

    // A4: mastery-движок. Пишемо attempt + перераховуємо frontier лише для
    // ігор зі skillIds на цій складності і для синхронізованих профілів
    // (гість не має рядка profiles у БД → attempt впав би на FK). Fire-and-forget:
    // не блокує екран результату й не ламає гру, якщо офлайн.
    // Пишемо результат гри у навчальне ядро для аналітики кабінету — для ВСІХ
    // ігор (не лише math зі skillIds) і для будь-якого синхронізованого профілю
    // (гість = анонім-сесія теж має user.id). recordGameResult сам вирішує:
    // mastery оновлюється лише де є skillIds, інакше — загальний attempt.
    if (user?.id) {
      recordGameResult({
        profileId,
        skillIds: game.skillIds?.[state.difficulty] ?? [],
        gameId: game.id,
        difficulty: state.difficulty,
        correct: Math.max(0, total - state.mistakes),
        total,
      }).catch((e) => console.warn('[mastery] запис пропущено:', e));
    }

    // EP12: підказка про непокриту передумову. Скидаємо попередню одразу (щоб
    // не лишити з минулого проходження на цьому ж екрані фінішу), тоді, якщо
    // умови виконано, тягнемо нову fire-and-forget — так само не блокує екран
    // результату й гейтиться на user.id, як recordGameResult (гість не має
    // рядка в БД).
    setPrereqHint(null);
    const skillIds = game.skillIds?.[state.difficulty] ?? [];
    if (user?.id && skillIds.length > 0 && isWeakResult(state.stars)) {
      fetchPrereqHint(profileId, skillIds)
        .then(setPrereqHint)
        .catch((e) => console.warn('[hint] підказку пропущено:', e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished]);

  const GameComponent = game.Component;
  const preschool = classLevel === 'preschool';
  /** Дев-стенд або localhost — показуємо інструменти перевірки (перемикач рівня). */
  const DEV_HOST = import.meta.env.DEV || /^(localhost|127\.0\.0\.1|shkolyaryk-dev\.)/.test(window.location.hostname);

  if (!state.finished && preschool) {
    const isBoard = round.answer === BOARD_DONE;
    const carrots = isBoard ? boardFilled : Math.round((state.roundIndex / total) * 5);
    return (
      <div style={{ position: 'relative', width: '100%', height: '100dvh', background: SKY, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SkyScene />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 520, margin: '0 auto', padding: '12px 16px 8px' }}>
          {/* угорі лише ← (у місце) і 5 зірочок прогресу */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CloseButton onClick={onExit} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <FiveStars filled={carrots} size={26} />
            </div>
            {/* для перевірки: перемикач рівня — лише на дев-стенді й localhost, на проді немає */}
            {DEV_HOST ? (
              <div style={{ display: 'flex', gap: 3 }}>
                {([1, 2, 3] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => dispatch({ type: 'RESET', levelData: game.generate(d, level, classLevel), difficulty: d })}
                    title={`Рівень ${d}`}
                    style={{ width: 22, height: 26, borderRadius: 8, border: 0, fontSize: 12, fontWeight: 900, cursor: 'pointer', background: state.difficulty === d ? '#F08A24' : '#fff', color: state.difficulty === d ? '#fff' : '#B07A3C', boxShadow: '0 2px 0 #F1E3CF' }}>
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ width: 42 }} />
            )}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, paddingBottom: 12 }}>
            <PreschoolProvider onBoardProgress={setBoardFilled}>
              <GameComponent
                key={round.id}
                round={round}
                roundIndex={state.roundIndex}
                totalRounds={total}
                disabled={state.answerState !== 'idle'}
                answerState={state.answerState}
                onAnswer={handleAnswer}
                onMistake={handleMistake}
              />
            </PreschoolProvider>
            {explain && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', animation: 'fadeInUp .3s ease both' }}>
                <div style={{ background: '#fff', borderRadius: 18, padding: '12px 16px', boxShadow: 'var(--c-shadow)', fontWeight: 900, fontSize: 16, color: 'var(--c-ok-ink)', textAlign: 'center' }}>
                  {explain.steps.join(' · ')}
                </div>
                <button className="g-btn primary" onClick={dismissExplain} style={{ maxWidth: 260 }}>Ще раз →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!state.finished) {
    return (
      <div className="g-screen">
       <div className="play-col">
        <div className="g-topbar">
          <button
            className="g-iconbtn"
            aria-label="Вийти"
            onClick={() => {
              if (window.confirm('Вийти з гри? Прогрес цієї спроби не збережеться.')) onExit();
            }}
          >
            ✕
          </button>
          {/* board-ігри ведуть власний лічильник — оболончиний «1/N» там не рухається */}
          {round.answer === BOARD_DONE ? (
            <div style={{ flex: 1 }} />
          ) : (
            <>
              <div className="g-progress">
                <span style={{ width: `${(state.roundIndex / total) * 100}%` }} />
              </div>
              <div className="g-count">
                {state.roundIndex + 1}/{total}
              </div>
            </>
          )}
          <div className="g-diffbadge">{DIFFICULTY_LABEL[state.difficulty]}</div>
        </div>

        <div className="g-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <GameComponent
            key={round.id}
            round={round}
            roundIndex={state.roundIndex}
            totalRounds={total}
            disabled={state.answerState !== 'idle'}
            answerState={state.answerState}
            onAnswer={handleAnswer}
            onMistake={handleMistake}
          />

          {/* EP1 — «чому», а не лише «правильна відповідь: X». Акцент перевернутий:
              головне зелене «як правильно», причина помилки — дрібним і нейтрально. */}
          {explain && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeInUp .3s ease both' }}>
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 14.5, color: 'var(--c-primary)' }}>
                {encouragementFor(state.mistakes)}
              </div>

              <div style={{ background: 'var(--c-ok-bg)', border: '1px solid var(--c-ok-line)', borderRadius: 'var(--c-r-sm)', padding: '14px 16px' }}>
                <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--c-ok-ink)', marginBottom: 8 }}>
                  Ось як правильно 👇
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {explain.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, fontWeight: 800, fontSize: 15, color: 'var(--c-ok-ink)' }}>
                      <span style={{ flexShrink: 0 }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {explain.why && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-mut)', textAlign: 'center', lineHeight: 1.4 }}>
                  💡 {explain.why}
                </div>
              )}

              <button className="g-btn primary" onClick={dismissExplain}>
                Спробувати ще раз →
              </button>
            </div>
          )}
        </div>
       </div>
      </div>
    );
  }

  // ---- Екран результату ----
  const newUnlocked = unlockedAfter(state.difficulty, state.stars, prevUnlocked);
  const unlockedNext = newUnlocked > state.difficulty;
  const canPlayHarder = state.difficulty < 3 && newUnlocked > state.difficulty;
  const again = () => dispatch({ type: 'RESET', levelData: game.generate(state.difficulty, level, classLevel), difficulty: state.difficulty });

  if (preschool) {
    // ті самі 5 зірочок, що вгорі гри: 3 → 5, 2 → 4, 1 → 3
    const five = state.stars === 3 ? 5 : state.stars === 2 ? 4 : 3;
    // ▶: спершу рівні складності цієї гри (6 → 9 → 12 картинок тощо), потім — наступна гра місця
    const next = canPlayHarder
      ? () => { const d = (state.difficulty + 1) as Difficulty; dispatch({ type: 'RESET', levelData: game.generate(d, level, classLevel), difficulty: d }); }
      : onNext ?? again;
    const icon = { height: 84, borderRadius: 24, border: 0, background: '#fff', boxShadow: 'var(--c-shadow)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 34, cursor: 'pointer', fontFamily: 'var(--font-round)', fontWeight: 900 };
    return (
      <div style={{ position: 'relative', width: '100%', height: '100dvh', background: SKY, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <SkyScene />
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 520, margin: '0 auto', padding: '16px 16px 28px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <FiveStars filled={five} size={36} />
            <img src="/creatures/zodiac_rabbit_wood.png" alt="" 
              style={{ width: 180, animation: 'pk-float 1.6s ease-in-out infinite' }} />
            <div style={{ fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 32, color: 'var(--c-ink)' }}>Молодець!</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <button onClick={again} aria-label="Ще раз" style={icon}>↻<small style={{ fontSize: 11, color: 'var(--c-mut)' }}>ще раз</small></button>
            <button onClick={next} aria-label="Далі" style={{ ...icon, background: 'var(--c-primary)', color: '#fff' }}>▶<small style={{ fontSize: 11, opacity: 0.85 }}>далі</small></button>
            <button onClick={onExit} aria-label="Назад у місце" style={icon}>🏝<small style={{ fontSize: 11, color: 'var(--c-mut)' }}>назад</small></button>
          </div>
        </div>
      </div>
    );
  }

  const message =
    state.mistakes === 0
      ? 'Ідеально! Жодної помилки 🎯'
      : state.stars === 2
        ? 'Чудова робота! 👏'
        : 'Молодець, що не здаєшся! 💪';

  return (
    <div className="g-screen">
     <div className="play-col">
      <div className="g-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
        <div style={{ fontSize: 72, animation: 'starPop .5s ease both' }}>🏆</div>
        <h2 className="g-title" style={{ fontSize: 24 }}>{message}</h2>

        <div style={{ display: 'flex', gap: 14 }}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              style={{
                fontSize: 46,
                animation: s <= state.stars ? `starPop .5s ease both ${s * 0.12}s` : 'none',
                filter: s <= state.stars ? 'none' : 'grayscale(100%) opacity(22%)',
              }}
            >
              ⭐
            </span>
          ))}
        </div>

        <div style={{ color: 'var(--c-mut)', fontWeight: 700, fontSize: 14 }}>
          Гра: {game.title} · {DIFFICULTY_LABEL[state.difficulty]}
        </div>

        {unlockedNext && (
          <div
            style={{
              background: 'var(--c-primary-soft)',
              color: 'var(--c-primary)',
              fontWeight: 800,
              padding: '10px 18px',
              borderRadius: 999,
              fontSize: 13,
              animation: 'fadeInUp .4s ease both',
            }}
          >
            🔓 Відкрито складність: {DIFFICULTY_LABEL[newUnlocked]}!
          </div>
        )}

        {prereqHint && (
          <div
            style={{
              background: 'rgba(59, 158, 240, 0.12)',
              color: 'var(--c-blue)',
              fontWeight: 700,
              padding: '12px 18px',
              borderRadius: 16,
              fontSize: 14,
              lineHeight: 1.4,
              maxWidth: 300,
              textAlign: 'center',
              animation: 'fadeInUp .4s ease both',
            }}
          >
            💡 {buildPrereqHintMessage(prereqHint.title)}
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          {canPlayHarder && (
            <button
              className="g-btn primary"
              onClick={() => {
                const nextDiff = (state.difficulty + 1) as Difficulty;
                dispatch({ type: 'RESET', levelData: game.generate(nextDiff, level, classLevel), difficulty: nextDiff });
              }}
            >
              Далі складніше ⬆️
            </button>
          )}
          <button
            className="g-btn soft"
            onClick={() =>
              dispatch({ type: 'RESET', levelData: game.generate(state.difficulty, level, classLevel), difficulty: state.difficulty })
            }
          >
            Зіграти ще раз 🔁
          </button>
          <button className="g-btn ghost" onClick={onExit}>
            До ігор 🏠
          </button>
        </div>
      </div>
     </div>
    </div>
  );
}
