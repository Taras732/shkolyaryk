import type { ClassLevel } from '@/games/types';
import { generate as mathGen } from '@/games/math-examples/generate';
import { generate as spellGen } from '@/games/uk-spelling/generate';
import { WORDS } from '@/games/english-words/words';
import { LETTERS } from '@/games/uk-letters/letters';
import { numberDecoys, shuffle } from '@/games/shared/ui';

/**
 * Перевірка місяця: короткий замір по областях класу — без підказок і пояснень
 * (це вимір, а не урок). Результат зберігається помісячно, батьки бачать динаміку,
 * а слабкі області підказують розумному плану, що тренувати.
 */
export type Area = 'arith' | 'tables' | 'spelling' | 'words' | 'letters' | 'counting';

export const AREA_TITLE: Record<Area, string> = {
  arith: 'Приклади',
  tables: 'Таблиця множення',
  spelling: 'Правопис',
  words: 'Англійські слова',
  letters: 'Букви',
  counting: 'Лічба',
};

/** Гра, яка тренує область: слабка область → ця гра піднімається в розумному плані. */
export const AREA_GAME: Record<Area, string> = {
  arith: 'math-examples',
  tables: 'times-tables',
  spelling: 'uk-spelling',
  words: 'english-words',
  letters: 'uk-letters',
  counting: 'counting',
};

export interface CheckQuestion {
  area: Area;
  prompt: string;
  /** Велике зображення над питанням (емодзі), якщо є. */
  big?: string;
  options: string[];
  answer: string;
}

const AREAS: Record<ClassLevel, Partial<Record<Area, number>>> = {
  preschool: { letters: 5, counting: 5 },
  grade1: { arith: 6, letters: 4, words: 4 },
  grade2: { arith: 5, tables: 5, spelling: 4, words: 4 },
  grade3: { arith: 5, tables: 6, spelling: 5, words: 4 },
  grade4: { arith: 5, tables: 6, spelling: 5, words: 4 },
};

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

function make(area: Area, cl: ClassLevel): CheckQuestion {
  switch (area) {
    case 'arith': {
      const r = mathGen(2, 'L3', cl).rounds[0];
      const ans = r.answer;
      return { area, prompt: `${r.payload.a} ${r.payload.op} ${r.payload.b} = ?`, options: numberDecoys(ans, 4, Math.max(4, Math.round(ans * 0.1)), 0).map(String), answer: String(ans) };
    }
    case 'tables': {
      const max = cl === 'grade2' ? 5 : 9;
      const a = 2 + Math.floor(Math.random() * (max - 1));
      const b = 2 + Math.floor(Math.random() * 8);
      return { area, prompt: `${a} × ${b} = ?`, options: numberDecoys(a * b, 4, Math.max(a, b), 0).map(String), answer: String(a * b) };
    }
    case 'spelling': {
      const r = spellGen(cl === 'grade2' ? 2 : 3, 'L3', cl).rounds[0];
      return { area, prompt: 'Як правильно?', options: r.payload.options, answer: r.answer };
    }
    case 'words': {
      const w = pick(WORDS);
      const others = shuffle(WORDS.filter((x) => x.en !== w.en && x.ua !== w.ua)).slice(0, 3);
      return { area, prompt: `Що означає «${w.en}»?`, big: '🇬🇧', options: shuffle([w, ...others]).map((x) => x.ua), answer: w.ua };
    }
    case 'letters': {
      const l = pick(LETTERS.filter((x) => x.initial));
      const others = shuffle(LETTERS.filter((x) => x.initial && x.ch !== l.ch)).slice(0, 2);
      return { area, prompt: `З якої букви починається «${l.word}»?`, big: l.emoji, options: shuffle([l, ...others]).map((x) => x.ch), answer: l.ch };
    }
    case 'counting': {
      const n = 3 + Math.floor(Math.random() * 7);
      return { area, prompt: 'Скільки?', big: pick(['🍎', '⭐', '🐟', '🌸']).repeat(n), options: numberDecoys(n, 3, 2, 1).map(String), answer: String(n) };
    }
  }
}

export function buildCheck(cl: ClassLevel): CheckQuestion[] {
  const out: CheckQuestion[] = [];
  for (const [area, n] of Object.entries(AREAS[cl]) as [Area, number][]) {
    const seen = new Set<string>();
    for (let k = 0, guard = 0; k < n && guard < 40; guard++) {
      const q = make(area, cl);
      if (seen.has(q.prompt + q.answer)) continue;
      seen.add(q.prompt + q.answer);
      out.push(q);
      k++;
    }
  }
  return out; // області підряд: дитині легше, ніж стрибати між предметами
}

export type CheckScores = Partial<Record<Area, { c: number; t: number }>>;

export interface CheckResult {
  month: string;
  at: number;
  scores: CheckScores;
}

export const monthOf = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function score(questions: CheckQuestion[], answers: string[]): CheckScores {
  const s: CheckScores = {};
  questions.forEach((q, i) => {
    const cur = s[q.area] ?? { c: 0, t: 0 };
    cur.t++;
    if (answers[i] === q.answer) cur.c++;
    s[q.area] = cur;
  });
  return s;
}

const keyFor = (id: string) => `shk.check.v1.${id}`;

export function loadChecks(id: string): CheckResult[] {
  try {
    const v = JSON.parse(localStorage.getItem(keyFor(id)) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Один результат на місяць: повторна перевірка того ж місяця замінює попередню. */
export function saveCheck(id: string, r: CheckResult): void {
  const all = loadChecks(id).filter((x) => x.month !== r.month);
  all.push(r);
  all.sort((a, b) => a.at - b.at);
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(all.slice(-24)));
  } catch {
    // без пам'яті — результат лишиться лише на екрані
  }
}

/** Перевірка цього місяця ще не пройдена. */
export const checkDue = (id: string, now: number) => !loadChecks(id).some((r) => r.month === monthOf(now));

/** Слабкі області останньої перевірки (менше 60%). */
export function weakAreas(id: string): Area[] {
  const all = loadChecks(id);
  const last = all[all.length - 1];
  if (!last) return [];
  return (Object.entries(last.scores) as [Area, { c: number; t: number }][]).filter(([, v]) => v.t > 0 && v.c / v.t < 0.6).map(([a]) => a);
}
