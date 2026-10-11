// RL2 — банк правил української мови під движок RL1.
//
// ⚠️ Свідомо взято лише БЕЗСУМНІВНІ правила початкової школи (велика літера у
// власних назвах; після Ч, Щ пишемо А). Жодного «правила з пам'яті» й жодних
// калькованих з російської методики формулювань — хибне правило тут = пряма
// педагогічна шкода.
//
// skillIds порожні: skill-граф української ще не заseedено (задача L1). Урок
// працює й без графа — просто поки не оновлює mastery (як не-math ігри).
//
// Українська має ПРОЗОРУ орфографію (як фінська) — правила короткі й регулярні,
// протези англійської (sight words, фази) не потрібні.

import type { GradeBand } from '@/games/types';
import { dedupeDistractors, uniqueTasks } from './rule-core';
import type { Distractor, RuleBlock, RuleLessonDef, RuleTask, Rng } from './rule-core';

const pick = <T,>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)];

const taskCount = (band: GradeBand): number => (band === 'L0' || band === 'L1' ? 2 : 3);

// ============================================================
// Велика літера у власних назвах (1–2 клас)
// ============================================================

const NAMES = ['Марійка', 'Данилко', 'Соломійка', 'Емілія', 'Андрійко', 'Оленка'] as const;
const PETS = ['Мурчик', 'Рекс', 'Сірко', 'Пушок', 'Барсик'] as const;
const CITIES = ['Львів', 'Київ', 'Одеса', 'Харків', 'Полтава'] as const;
const RIVERS = ['Дніпро', 'Дністер', 'Десна', 'Буг'] as const;
const COUNTRIES = ['Україна', 'Польща', 'Італія', 'Канада'] as const;

/** Слово з великої проти того самого з малої. */
function capitalTask(id: string, word: string, frame: string, what: string): RuleTask {
  const lower = word.charAt(0).toLowerCase() + word.slice(1);
  const candidates: Distractor[] = [
    {
      value: lower,
      misconception: `написати ${what} з маленької літери`,
      explain: {
        kind: 'visual-proof',
        note: `${what} — це власна назва, тому завжди з великої літери.`,
        visual: { kind: 'steps', steps: [`${lower} ✗`, `${word} ✓`] },
      },
    },
    {
      value: word.toUpperCase(),
      misconception: 'написати все слово великими літерами',
      explain: {
        kind: 'rule-recall',
        text: 'З великої літери — тільки ПЕРША літера, решта маленькі.',
      },
    },
  ];
  return {
    id,
    prompt: frame.replace('{}', '…'),
    correct: word,
    correctSteps: [`${what} — власна назва`, `Пишемо з великої: ${word}`],
    distractors: dedupeDistractors(word, candidates),
  };
}

const CAPITAL_LETTER: RuleLessonDef = {
  id: 'language.capital-letter',
  title: 'Велика літера',
  subject: 'language',
  // Вузли графа мови (L1): імена/клички → доповнення географічними назвами.
  skillIds: ['language.orth.l1.capital-names', 'language.orth.l2.capital-geo-names'],
  bands: ['L1', 'L2', 'L3'],
  build: (band, rng) => {
    const n = taskCount(band);

    const first: RuleBlock = {
      statement: {
        text: 'Імена людей і клички тварин пишемо з великої літери.',
        visual: { kind: 'steps', steps: ['марійка ✗', 'Марійка ✓'] },
      },
      worked: {
        prompt: 'мій друг данилко',
        steps: ['«Данилко» — це імʼя людини', 'Імена — власні назви', 'Тому з великої: Данилко'],
        answer: 'Данилко',
      },
      tasks: uniqueTasks(n, (i) =>
        i % 2 === 0
          ? capitalTask(`cap-n${i}`, pick(NAMES, rng), 'Мою сестричку звати {}', 'Імʼя людини')
          : capitalTask(`cap-p${i}`, pick(PETS, rng), 'Нашого котика звати {}', 'Кличка тварини'),
      ),
    };

    const second: RuleBlock = {
      changeNote: 'А тепер правило доповнюється.',
      statement: {
        text: 'Назви міст, річок і країн — теж з великої літери.',
        visual: { kind: 'steps', steps: ['львів ✗', 'Львів ✓'] },
      },
      worked: {
        prompt: 'ми живемо у місті львів',
        steps: ['«Львів» — назва міста', 'Назви міст — власні назви', 'Тому з великої: Львів'],
        answer: 'Львів',
      },
      tasks: uniqueTasks(n, (i) =>
        i % 3 === 0
          ? capitalTask(`cap-c${i}`, pick(CITIES, rng), 'Ми поїхали у місто {}', 'Назва міста')
          : i % 3 === 1
            ? capitalTask(`cap-r${i}`, pick(RIVERS, rng), 'Ми купалися в річці {}', 'Назва річки')
            : capitalTask(`cap-k${i}`, pick(COUNTRIES, rng), 'Наша країна — {}', 'Назва країни'),
      ),
    };

    return [first, second];
  },
};

// ============================================================
// ЧА, ЩА — пишемо А (1–2 клас)
// ============================================================

/** Слова, де після Ч/Щ стоїть саме А (безсумнівні). */
const CHA_WORDS = ['чашка', 'чайка', 'часто', 'чарівний'] as const;
const SHCHA_WORDS = ['щастя', 'площа', 'щавель', 'щасливий'] as const;

/** Правильне написання проти «Я після Ч/Щ». */
function chaTask(id: string, word: string, letter: 'ч' | 'щ'): RuleTask {
  const wrong = word.replace(letter + 'а', letter + 'я');
  const upper = letter.toUpperCase();
  const candidates: Distractor[] = [
    {
      value: wrong,
      misconception: `написати Я після ${upper}`,
      explain: {
        kind: 'visual-proof',
        note: `Після ${upper} чуємо мʼякий звук — та пишемо все одно А.`,
        visual: { kind: 'steps', steps: [`${wrong} ✗`, `${word} ✓`] },
      },
    },
    {
      value: word.replace(letter + 'а', letter + 'о'),
      misconception: `написати О після ${upper}`,
      explain: { kind: 'rule-recall', text: `Після ${upper} у цих словах пишемо А.` },
    },
  ];
  return {
    id,
    prompt: word.replace(letter + 'а', `${letter}_`),
    correct: word,
    correctSteps: [`Після ${upper} пишемо А`, word],
    distractors: dedupeDistractors(word, candidates),
  };
}

const CHA_SHCHA: RuleLessonDef = {
  id: 'language.cha-shcha',
  title: 'ЧА і ЩА',
  subject: 'language',
  skillIds: ['language.orth.l2.after-sibilants'],
  bands: ['L1', 'L2'],
  build: (band, rng) => {
    const n = taskCount(band);

    const first: RuleBlock = {
      statement: {
        text: 'У складі ЧА пишемо букву А.',
        visual: { kind: 'steps', steps: ['чяшка ✗', 'чашка ✓'] },
      },
      worked: {
        prompt: 'ч_шка',
        steps: ['Чуємо мʼякий звук після Ч', 'Але правило каже: після Ч пишемо А', 'Отже: чашка'],
        answer: 'чашка',
      },
      tasks: uniqueTasks(n, (i) => chaTask(`cha-${i}`, pick(CHA_WORDS, rng), 'ч')),
    };

    const second: RuleBlock = {
      changeNote: 'Те саме правило — і для Щ.',
      statement: {
        text: 'У складі ЩА теж пишемо букву А.',
        visual: { kind: 'steps', steps: ['щястя ✗', 'щастя ✓'] },
      },
      worked: {
        prompt: 'щ_стя',
        steps: ['Після Щ чуємо мʼякий звук', 'Правило те саме: пишемо А', 'Отже: щастя'],
        answer: 'щастя',
      },
      tasks: uniqueTasks(n, (i) => chaTask(`shcha-${i}`, pick(SHCHA_WORDS, rng), 'щ')),
    };

    return [first, second];
  },
};

// ============================================================

export const LANGUAGE_RULE_LESSONS: RuleLessonDef[] = [CAPITAL_LETTER, CHA_SHCHA];
