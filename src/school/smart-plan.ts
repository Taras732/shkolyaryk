import type { ClassLevel } from '@/games/types';
import type { LogEntry } from './game-log';
import { localDay } from './game-log';

/**
 * Розумний план «Після школи»: щодня по одному кроку з кожного предмета —
 * той, де дитина найбільше помиляється, давно не повторювала або де «назріло»
 * (є факти множення, які плутає; слова, яким час повтору).
 *
 * План фіксується на день (кеш у localStorage): після першої гри він не
 * перестрибує — дитина бачить ті самі кроки до вечора.
 */

export type Subject = 'math' | 'language' | 'english' | 'fun';

/** Пули кандидатів за класом: предмет → ігри, з яких обираємо одну на день. */
export const POOLS: Record<ClassLevel, Partial<Record<Subject, string[]>>> = {
  preschool: {
    language: ['uk-letters', 'uk-syllables'],
    math: ['counting', 'addition', 'compare', 'pz-share'],
    fun: ['find-same', 'find-shadow', 'pic-puzzle', 'pz-maze', 'memory-pairs', 'pz-sort'],
  },
  grade1: {
    math: ['math-examples', 'word-problems', 'column-arithmetic', 'math-compare', 'clock-time'],
    language: ['uk-letters', 'uk-reading'],
    english: ['english-words', 'en-reading'],
  },
  grade2: {
    math: ['column-arithmetic', 'word-problems', 'math-examples', 'times-tables', 'clock-time', 'money-basics'],
    language: ['uk-spelling', 'uk-reading', 'grammar-parts'],
    english: ['en-reading', 'english-words'],
  },
  grade3: {
    math: ['times-tables', 'word-problems', 'math-examples', 'column-arithmetic', 'measures', 'perimeter-area', 'fractions-compare'],
    language: ['uk-spelling', 'uk-reading', 'grammar-parts'],
    english: ['english-words', 'en-reading'],
  },
  grade4: {
    math: ['times-tables', 'word-problems', 'math-examples', 'column-arithmetic', 'measures', 'perimeter-area', 'fractions-compare'],
    language: ['uk-spelling', 'uk-reading', 'grammar-parts'],
    english: ['english-words', 'en-reading'],
  },
};

/** Сигнали «назріло» з прогресу ігор: скільки чого чекає. */
export interface Signals {
  /** Факти множення, які дитина плутає. */
  weakFacts: number;
  /** Англійські слова, яким настав час повтору. */
  dueWords: number;
  /** Букви, відкриті, але ще не вивчені (дошкілля). */
  lettersInProgress: number;
  /** Ігри слабких областей з перевірки місяця. */
  checkWeak?: string[];
}

export interface PlannedStep {
  gameId: string;
  subject: Subject;
  reason: string;
}

const DAY = 24 * 60 * 60 * 1000;

/** Детермінований «шум» від дня й гри — щоб за рівних умов план мінявся між днями, а не стояв. */
function jitter(day: string, id: string): number {
  let h = 0;
  for (const ch of day + id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((h >>> 0) % 1000) / 1000;
}

export function scoreGame(id: string, log: LogEntry[], signals: Signals, now: number): { score: number; reason: string } {
  const recent = log.filter((e) => e.gameId === id && now - e.at < 14 * DAY);
  const last = recent.length ? Math.max(...recent.map((e) => e.at)) : 0;
  const daysAgo = last ? Math.floor((now - last) / DAY) : 99;
  // помилки на гру: 0 → 0, 3+ → 1
  const errRate = recent.length ? Math.min(1, recent.reduce((s, e) => s + e.mistakes, 0) / recent.length / 3) : 0.5;
  const stale = Math.min(daysAgo, 7) / 7;

  let bonus = 0;
  let reason = '';
  if (id === 'times-tables' && signals.weakFacts > 0) {
    bonus = 0.6;
    reason = `плутає ${signals.weakFacts} ${signals.weakFacts === 1 ? 'факт' : signals.weakFacts < 5 ? 'факти' : 'фактів'} множення`;
  } else if (id === 'english-words' && signals.dueWords > 0) {
    bonus = 0.6;
    reason = `час повторити слова: ${signals.dueWords}`;
  } else if (id === 'uk-letters' && signals.lettersInProgress > 0) {
    bonus = 0.4;
    reason = 'закріпити нові букви';
  }
  if (!reason && signals.checkWeak?.includes(id)) {
    bonus = 0.35;
    reason = 'перевірка місяця показала: варто підтягнути';
  }
  if (!reason) {
    if (recent.length && errRate >= 0.5) reason = 'тут останнім часом було найбільше помилок';
    else if (daysAgo >= 5 && daysAgo < 99) reason = `давно не повторювали (${daysAgo} дн.)`;
    else if (daysAgo === 99) reason = 'ще не пробували — спробуймо';
    else reason = 'для рівноваги';
  }
  return { score: 0.5 * errRate + 0.3 * stale + bonus, reason };
}

export function smartPlan(cl: ClassLevel, available: Set<string>, log: LogEntry[], signals: Signals, now: number): PlannedStep[] {
  const day = localDay(now);
  const steps: PlannedStep[] = [];
  for (const [subject, ids] of Object.entries(POOLS[cl]) as [Subject, string[]][]) {
    const cands = ids.filter((id) => available.has(id));
    if (!cands.length) continue;
    // учорашню гру предмета ставимо знову лише якщо вона справді «горить»: інакше — різноманітність
    const yesterday = new Set(log.filter((e) => localDay(e.at) === localDay(now - DAY)).map((e) => e.gameId));
    const scored = cands
      .map((id) => {
        const s = scoreGame(id, log, signals, now);
        const repeatPenalty = yesterday.has(id) && s.score < 0.6 ? 0.25 : 0;
        return { id, ...s, final: s.score + 0.15 * jitter(day, id) - repeatPenalty };
      })
      .sort((a, b) => b.final - a.final);
    steps.push({ gameId: scored[0].id, subject, reason: scored[0].reason });
  }
  return steps;
}

/** План на сьогодні з кешем: перший виклик за день рахує, далі повертає те саме. */
export function todaySmartPlan(profileId: string, compute: () => PlannedStep[], now: number): PlannedStep[] {
  const key = `shk.autoplan.v1.${profileId}`;
  const day = localDay(now);
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null') as { day: string; steps: PlannedStep[] } | null;
    if (cached && cached.day === day && cached.steps.length) return cached.steps;
  } catch {
    // битий кеш — перерахуємо
  }
  const steps = compute();
  try {
    localStorage.setItem(key, JSON.stringify({ day, steps }));
  } catch {
    // без кешу план може змінитись за день — не страшно
  }
  return steps;
}
