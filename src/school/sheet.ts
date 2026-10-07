import type { ClassLevel, Difficulty } from '@/games/types';
import { generate as mathGen } from '@/games/math-examples/generate';
import { generate as columnGen } from '@/games/column-arithmetic/generate';
import { generate as wordGen } from '@/games/word-problems/generate';
import { generate as spellGen } from '@/games/uk-spelling/generate';
import { weakFacts, type FactStats } from '@/games/times-tables/core';
import { allWords, statusOf, type Dict } from '@/games/english-words/core';
import { LETTERS } from '@/games/uk-letters/letters';
import type { LetterProgress } from '@/games/uk-letters/core';

/**
 * Друкований аркуш на завтра: те саме, що дитина плутає в застосунку, але на папері.
 * Кожен розділ — список рядків «завдання / відповідь»; відповіді йдуть окремою
 * сторінкою для батьків.
 */
export interface SheetItem {
  task: string;
  answer: string;
}

export interface SheetSection {
  title: string;
  hint?: string;
  items: SheetItem[];
  /** Великі букви для обведення (дошкілля). */
  trace?: string[];
}

export interface SheetInput {
  cl: ClassLevel;
  difficulty: Difficulty;
  facts: FactStats;
  dict: Dict;
  letters: LetterProgress;
}

const isSchool = (cl: ClassLevel) => cl !== 'preschool';

export function buildSheet(i: SheetInput): SheetSection[] {
  const out: SheetSection[] = [];

  if (!isSchool(i.cl)) {
    const open = LETTERS.filter((l) => i.letters[l.ch]).slice(-4);
    const toTrace = (open.length ? open : LETTERS.slice(0, 3)).map((l) => l.ch);
    out.push({ title: 'Обведи букви', hint: 'Обведи кожну букву пальчиком, потім олівцем.', items: [], trace: toTrace });
    out.push({
      title: 'Порахуй і запиши',
      items: Array.from({ length: 4 }, (_, k) => {
        const n = 2 + ((k * 3) % 7);
        const em = ['🍎', '⭐', '🐟', '🌸'][k];
        return { task: `${em.repeat(n)}  = ____`, answer: String(n) };
      }),
    });
    return out;
  }

  // 1. Таблиця множення: факти, які плутає (кожен двічі, у різному порядку множників)
  const weak = weakFacts(i.facts).slice(0, 6);
  if (weak.length) {
    out.push({
      title: 'Таблиця множення — те, що плутаєш',
      items: weak.flatMap((k) => {
        const [a, b] = k.split('x').map(Number);
        return [
          { task: `${a} × ${b} = ____`, answer: String(a * b) },
          { task: `${b} × ${a} = ____`, answer: String(a * b) },
        ];
      }),
    });
  }

  // 2. Приклади класу
  // 8 різних прикладів (генератор дає по 5 — беремо з кількох наборів без повторів)
  const ex = new Map<string, string>();
  for (let k = 0; k < 6 && ex.size < 8; k++)
    for (const r of mathGen(i.difficulty, 'L3', i.cl).rounds) if (ex.size < 8) ex.set(`${r.payload.a} ${r.payload.op} ${r.payload.b} = ____`, String(r.answer));
  out.push({ title: 'Приклади', items: [...ex].map(([task, answer]) => ({ task, answer })) });

  // 3. Стовпчиком (з 2 класу)
  if (i.cl !== 'grade1') {
    const col = columnGen(i.difficulty, 'L3', i.cl).rounds.slice(0, 3);
    out.push({ title: 'Обчисли стовпчиком', hint: 'Запиши в зошит стовпчиком.', items: col.map((r) => ({ task: `${r.payload.a} ${r.payload.op} ${r.payload.b}`, answer: String(r.answer) })) });
  }

  // 4. Задача
  const wp = wordGen(i.difficulty, 'L3', i.cl).rounds[0];
  out.push({
    title: 'Задача',
    hint: 'Спершу напиши, яка тут дія, потім розв’яжи.',
    items: [{ task: wp.payload.text, answer: `${wp.payload.solution.join('; ')} → ${wp.answer}` }],
  });

  // 5. Правопис: підкресли правильне (з 2 класу)
  if (i.cl !== 'grade1') {
    const sp = spellGen(i.difficulty, 'L3', i.cl).rounds.slice(0, 4);
    out.push({ title: 'Підкресли, як правильно', items: sp.map((r) => ({ task: r.payload.options.join('   /   '), answer: r.answer })) });
  }

  // 6. Англійські слова, які вчить
  const learning = allWords(i.dict).filter((w) => statusOf(i.dict.words[w.en]) === 'learning').slice(0, 6);
  if (learning.length) {
    out.push({ title: 'English: напиши переклад', items: learning.map((w) => ({ task: `${w.en} — ____________`, answer: w.ua })) });
  }

  return out;
}
