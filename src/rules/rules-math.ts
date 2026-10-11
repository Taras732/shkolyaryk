// Банк правил математики — еталонний зріз під движок RL1 (повний банк — RL3).
//
// Обманки тут НЕ випадкові числа поруч із правильним: кожна — результат
// конкретної хибної стратегії, яку діти реально застосовують («порахував зліва
// направо», «доповнив до 10 і забув, що частину вже витратив»). Тільки так
// можливий consequence-replay: щоб програти хід дитини, треба заздалегідь знати,
// який хід привів до цієї відповіді.
//
// Кандидати-обманки даються З ЗАПАСОМ і проходять dedupeDistractors: якщо якась
// збіглася з правильною відповіддю (напр. 5×5+2×2: «прочитав × як +» дає теж 29)
// або з іншою — вона відсіюється, і береться наступна змістовна. Завдання в блоці
// набираються через uniqueTasks — тож перше й третє не вийдуть однакові.
//
// Прив'язка до реальних вузлів skill-graph (A2), не до вигаданих id.

import type { GradeBand } from '@/games/types';
import { dedupeDistractors, uniqueTasks } from './rule-core';
import type { Distractor, RuleBlock, RuleLessonDef, RuleTask, Rng } from './rule-core';

const ri = (rng: Rng, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));

/** Скільки завдань на блок: найменшим — коротше. */
const taskCount = (band: GradeBand): number => (band === 'L0' || band === 'L1' ? 2 : 3);

// ============================================================
// Порядок дій (3–4 клас) — math.ops.l3.order-of-operations
// ============================================================

/** a + b × c: класична пастка «рахую зліва направо, як читаю». */
function orderTask(id: string, a: number, b: number, c: number): RuleTask {
  const correct = a + b * c;
  const leftToRight = (a + b) * c;

  const candidates: Distractor[] = [
    {
      value: String(leftToRight),
      misconception: 'порахував зліва направо, як читають текст',
      explain: {
        kind: 'consequence-replay',
        steps: [
          { text: `Ти почав з ${a} + ${b} = ${a + b}`, ok: false },
          { text: `Потім ${a + b} × ${c} = ${leftToRight}`, ok: false },
        ],
        correctTail: [
          `Але спочатку множення: ${b} × ${c} = ${b * c}`,
          `Аж тоді додавання: ${a} + ${b * c} = ${correct}`,
        ],
      },
    },
    {
      value: String(b * c),
      misconception: 'зробив множення і на цьому зупинився',
      explain: {
        kind: 'consequence-replay',
        steps: [
          { text: `Множення ти зробив правильно: ${b} × ${c} = ${b * c}`, ok: true },
          { text: 'А далі зупинився', ok: false },
        ],
        correctTail: [`Лишилось додати ${a}: ${a} + ${b * c} = ${correct}`],
      },
    },
    {
      value: String(a + b + c),
      misconception: 'додав усі числа, множення не помітив',
      explain: {
        kind: 'rule-recall',
        text: 'Спочатку множимо, і тільки потім додаємо.',
      },
    },
  ];

  return {
    id,
    prompt: `${a} + ${b} × ${c}`,
    correct: String(correct),
    correctSteps: [`Спочатку множення: ${b} × ${c} = ${b * c}`, `Потім додавання: ${a} + ${b * c} = ${correct}`],
    distractors: dedupeDistractors(String(correct), candidates),
  };
}

/** a × b + c × d — два множення. Тут видно, де саме хід розійшовся з правилом. */
function twoMultTask(id: string, a: number, b: number, c: number, d: number): RuleTask {
  const correct = a * b + c * d;
  const leftToRight = (a * b + c) * d;

  const candidates: Distractor[] = [
    {
      value: String(leftToRight),
      misconception: 'перше множення зробив, далі пішов зліва направо',
      explain: {
        kind: 'consequence-replay',
        steps: [
          { text: `Перше множення — правильно: ${a} × ${b} = ${a * b}`, ok: true },
          { text: `Але потім ${a * b} + ${c} = ${a * b + c}`, ok: false },
          { text: `І ${a * b + c} × ${d} = ${leftToRight}`, ok: false },
        ],
        correctTail: [
          `Друге множення теж іде спочатку: ${c} × ${d} = ${c * d}`,
          `Аж тоді ${a * b} + ${c * d} = ${correct}`,
        ],
      },
    },
    {
      value: String(a * b + c + d),
      misconception: 'друге множення прочитав як додавання',
      explain: {
        kind: 'visual-proof',
        note: 'Подивись на знак між останніми числами — там ×, а не +.',
        visual: { kind: 'steps', steps: [`${c} × ${d} = ${c * d}`, `${a * b} + ${c * d} = ${correct}`] },
      },
    },
    {
      value: String(a * b + c),
      misconception: 'зробив перше множення, друге забув',
      explain: {
        kind: 'rule-recall',
        text: 'Обидва множення — спочатку, аж тоді додаємо.',
      },
    },
  ];

  return {
    id,
    prompt: `${a} × ${b} + ${c} × ${d}`,
    correct: String(correct),
    correctSteps: [
      `Обидва множення спочатку: ${a} × ${b} = ${a * b} і ${c} × ${d} = ${c * d}`,
      `Тоді додавання: ${a * b} + ${c * d} = ${correct}`,
    ],
    distractors: dedupeDistractors(String(correct), candidates),
  };
}

/** (a + b) × c — дужки б'ють множення. */
function bracketTask(id: string, a: number, b: number, c: number): RuleTask {
  const correct = (a + b) * c;
  const ignoredBrackets = a + b * c;

  const candidates: Distractor[] = [
    {
      value: String(ignoredBrackets),
      misconception: 'не побачив дужок, помножив за старим правилом',
      explain: {
        kind: 'consequence-replay',
        steps: [
          { text: `Ти помножив спершу: ${b} × ${c} = ${b * c}`, ok: false },
          { text: `Потім ${a} + ${b * c} = ${ignoredBrackets}`, ok: false },
        ],
        correctTail: [
          `Але дужки — найперші: ${a} + ${b} = ${a + b}`,
          `Аж тоді ${a + b} × ${c} = ${correct}`,
        ],
      },
    },
    {
      value: String(a + b + c),
      misconception: 'усе додав, множення не помітив',
      explain: {
        kind: 'visual-proof',
        note: 'Дужки порахували правильно — але за ними стоїть ×.',
        visual: { kind: 'steps', steps: [`(${a} + ${b}) = ${a + b}`, `${a + b} × ${c} = ${correct}`] },
      },
    },
    {
      value: String(a + b),
      misconception: 'порахував дужку і забув помножити',
      explain: {
        kind: 'rule-recall',
        text: 'Після дужок не забувай про множення.',
      },
    },
  ];

  return {
    id,
    prompt: `(${a} + ${b}) × ${c}`,
    correct: String(correct),
    correctSteps: [`Спочатку дужки: ${a} + ${b} = ${a + b}`, `Потім множення: ${a + b} × ${c} = ${correct}`],
    distractors: dedupeDistractors(String(correct), candidates),
  };
}

const ORDER_OF_OPERATIONS: RuleLessonDef = {
  id: 'math.order-of-operations',
  title: 'Порядок дій',
  subject: 'math',
  skillIds: ['math.ops.l2.order-of-operations'],
  bands: ['L3', 'L4'],
  build: (band, rng) => {
    const n = taskCount(band);
    const top = band === 'L4' ? 9 : 6;

    // Числа першого завдання переживають блок — щоб у блоці 2 дужки стали
    // на ТІ САМІ числа. Дитина бачить: 2 + 5 × 3 = 17, але (2 + 5) × 3 = 21.
    const a = ri(rng, 2, top);
    const b = ri(rng, 2, top);
    const c = ri(rng, 2, 5);

    const firstTask = orderTask('ord-1', a, b, c);
    // решта завдань блоку — унікальні за формулюванням і різні від першого
    const restFirst = uniqueTasks(
      n - 1,
      (i) =>
        i === 0 && n > 2
          ? twoMultTask('ord-m', ri(rng, 2, 5), ri(rng, 2, 5), ri(rng, 2, 5), ri(rng, 2, 5))
          : orderTask(`ord-${i + 2}`, ri(rng, 2, top), ri(rng, 2, top), ri(rng, 2, 5)),
      [firstTask.prompt],
    );

    const first: RuleBlock = {
      statement: {
        text: 'Спочатку множимо і ділимо. Аж потім додаємо і віднімаємо.',
        visual: { kind: 'steps', steps: ['× ÷ — спочатку', '+ − — потім'] },
      },
      worked: {
        prompt: '3 × 4 + 2',
        steps: ['Дивимось на знаки: тут є × і +.', 'Правило: спочатку множення → 3 × 4 = 12', 'Тепер додаємо: 12 + 2 = 14'],
        answer: '14',
      },
      tasks: [firstTask, ...restFirst],
    };

    const bracketFirst = bracketTask('brk-1', a, b, c);
    const restSecond = uniqueTasks(
      (n > 2 ? 2 : 1) - 1,
      (i) => bracketTask(`brk-${i + 2}`, ri(rng, 2, top), ri(rng, 2, top), ri(rng, 2, 5)),
      [bracketFirst.prompt],
    );

    const second: RuleBlock = {
      changeNote: 'А тепер правило доповнюється.',
      statement: {
        text: 'Те, що в дужках, рахуємо найперше — навіть раніше за множення.',
        visual: {
          kind: 'steps',
          steps: [
            `${a} + ${b} × ${c} = ${a + b * c}`,
            `(${a} + ${b}) × ${c} = ${(a + b) * c}`,
            'Ті самі числа — а дужки все міняють!',
          ],
        },
      },
      worked: {
        prompt: '(2 + 5) × 3',
        steps: ['Спочатку дужки: 2 + 5 = 7', 'Тепер множення: 7 × 3 = 21'],
        answer: '21',
      },
      // перше завдання — дзеркало на тих самих a,b,c, далі унікальні
      tasks: [bracketFirst, ...restSecond],
    };

    return [first, second];
  },
};

// ============================================================
// Через десяток (1–2 клас) — math.ops.l1.add-sub-carry-20
// ============================================================

/** a + b через десяток. Пастка: доповнив до 10 і забув, що частину вже витратив. */
function carryAddTask(id: string, a: number, b: number): RuleTask {
  const correct = a + b;
  const toTen = 10 - a;
  const rest = b - toTen;

  const candidates: Distractor[] = [
    {
      value: String(10 + b),
      misconception: `доповнив ${a} до 10, але потім додав усі ${b}, хоч ${toTen} уже витратив`,
      explain: {
        kind: 'consequence-replay',
        steps: [
          { text: `До 10 ти дійшов правильно: ${a} + ${toTen} = 10`, ok: true },
          { text: `Але далі додав усі ${b}: 10 + ${b} = ${10 + b}`, ok: false },
        ],
        correctTail: [
          `${toTen} з ${b} вже пішло на десяток`,
          `Лишилось тільки ${rest}: 10 + ${rest} = ${correct}`,
        ],
      },
    },
    {
      value: String(correct - 1),
      misconception: 'лічив по одному і збився на одиницю',
      explain: {
        kind: 'visual-proof',
        note: 'Порахуймо разом, десятком:',
        visual: { kind: 'steps', steps: [`${a} + ${toTen} = 10`, `10 + ${rest} = ${correct}`] },
      },
    },
    {
      value: String(correct + 1),
      misconception: 'перелічив на одиницю',
      explain: { kind: 'rule-recall', text: 'Доповни до 10, а решту додай зверху.' },
    },
  ];

  return {
    id,
    prompt: `${a} + ${b}`,
    correct: String(correct),
    correctSteps: [
      `${a} доповнюємо до 10 — треба ще ${toTen}`,
      `${b} — це ${toTen} і ще ${rest}`,
      `10 + ${rest} = ${correct}`,
    ],
    distractors: dedupeDistractors(String(correct), candidates),
  };
}

/** m − n через десяток. Пастка: дійшов до 10 і відняв усі одиниці ще раз. */
function carrySubTask(id: string, m: number, n: number): RuleTask {
  const correct = m - n;
  const toTen = m - 10;
  const rest = n - toTen;

  const candidates: Distractor[] = [
    {
      value: String(10 - n),
      misconception: `дійшов до 10, а тоді відняв усі ${n} ще раз`,
      explain: {
        kind: 'consequence-replay',
        steps: [
          { text: `До 10 ти дійшов правильно: ${m} − ${toTen} = 10`, ok: true },
          { text: `Але далі відняв усі ${n}: 10 − ${n} = ${10 - n}`, ok: false },
        ],
        correctTail: [
          `${toTen} з ${n} вже відняли`,
          `Лишилось тільки ${rest}: 10 − ${rest} = ${correct}`,
        ],
      },
    },
    {
      value: String(correct + 1),
      misconception: 'лічив назад по одному і збився на одиницю',
      explain: {
        kind: 'visual-proof',
        note: 'Порахуймо разом, від десятка:',
        visual: { kind: 'steps', steps: [`${m} − ${toTen} = 10`, `10 − ${rest} = ${correct}`] },
      },
    },
    {
      value: String(correct - 1),
      misconception: 'перелічив назад на одиницю',
      explain: { kind: 'rule-recall', text: 'Дійди до 10, а решту відніми від нього.' },
    },
  ];

  return {
    id,
    prompt: `${m} − ${n}`,
    correct: String(correct),
    correctSteps: [
      `${m} зменшуємо до 10 — це ${toTen}`,
      `${n} — це ${toTen} і ще ${rest}`,
      `10 − ${rest} = ${correct}`,
    ],
    distractors: dedupeDistractors(String(correct), candidates),
  };
}

const THROUGH_TEN: RuleLessonDef = {
  id: 'math.through-ten',
  title: 'Через десяток',
  subject: 'math',
  skillIds: ['math.ops.l2.add-sub-carry-20'],
  bands: ['L1', 'L2'],
  build: (band, rng) => {
    const n = taskCount(band);

    /** a+b обов'язково через десяток: a 6–9, сума 11–18. */
    const addPair = (): [number, number] => {
      const a = ri(rng, 6, 9);
      return [a, ri(rng, 11 - a, Math.min(9, 18 - a))];
    };
    /** m−n обов'язково через десяток: m 11–18, різниця < 10. */
    const subPair = (): [number, number] => {
      const m = ri(rng, 11, 18);
      return [m, ri(rng, m - 9, 9)];
    };

    const first: RuleBlock = {
      statement: {
        text: 'Щоб додати через десяток — спочатку доповни до 10, а решту додай зверху.',
        visual: { kind: 'emoji', emoji: '🔟', caption: 'Десяток — наш друг' },
      },
      worked: {
        prompt: '8 + 5',
        steps: ['8 треба доповнити до 10 — це ще 2', '5 — це 2 і ще 3', '8 + 2 = 10, а 10 + 3 = 13'],
        answer: '13',
      },
      tasks: uniqueTasks(n, (i) => carryAddTask(`add-${i}`, ...addPair())),
    };

    const second: RuleBlock = {
      changeNote: 'А тепер те саме правило — тільки навпаки.',
      statement: {
        text: 'Щоб відняти через десяток — спочатку дійди до 10, а решту відніми від нього.',
        visual: { kind: 'emoji', emoji: '🔟', caption: 'Знову через десяток' },
      },
      worked: {
        prompt: '13 − 5',
        steps: ['13 зменшуємо до 10 — це 3', '5 — це 3 і ще 2', '13 − 3 = 10, а 10 − 2 = 8'],
        answer: '8',
      },
      tasks: uniqueTasks(n, (i) => carrySubTask(`sub-${i}`, ...subPair())),
    };

    return [first, second];
  },
};

// ============================================================

// ============================================================
// Прикидка — округлення й оцінка результату (3–4 клас)
// ============================================================
//
// Парадигма Ballpark зі SkyTest: обери НАЙБЛИЖЧЕ, а не точне. У програмі НУШ
// округлення є, а в нашому skill-графі відповідної навички ще немає — тож урок
// поки без skillIds (працює, просто не живить mastery), як уроки мови до L1.
// TODO: додати навичку «Округлення» у skills-math.ts разом із seed у prod.

/** Округлення до найближчої сотні. */
const round100 = (n: number): number => Math.round(n / 100) * 100;
/** Округлення до найближчого десятка. */
const round10 = (n: number): number => Math.round(n / 10) * 10;

/**
 * a + b, де обидва доданки близькі до сотень (похибка ≤ 20).
 * Це не косметика, а МАТЕМАТИЧНА ГАРАНТІЯ: |da| + |db| ≤ 40 < 50, тож
 * округлення доданків завжди дає саме найближчу сотню до точної суми.
 * Інакше урок вчив би хибного: 249+249 → «200+200=400», хоча найближча сотня 500.
 */
function estimateAddTask(id: string, a: number, b: number): RuleTask {
  const estimate = round100(a) + round100(b);
  const candidates: Distractor[] = [
    {
      value: String(estimate - 100),
      misconception: 'округлив числа вниз, хоч вони ближчі до більшої сотні',
      explain: {
        kind: 'visual-proof',
        note: 'Дивись, до якої сотні число БЛИЖЧЕ:',
        visual: { kind: 'steps', steps: [`${a} ≈ ${round100(a)}`, `${b} ≈ ${round100(b)}`, `${round100(a)} + ${round100(b)} = ${estimate}`] },
      },
    },
    {
      value: String(estimate + 100),
      misconception: 'округлив числа вгору, хоч вони ближчі до меншої сотні',
      explain: {
        kind: 'rule-recall',
        text: 'Округлюй до тієї сотні, до якої число ближче — а не завжди вгору.',
      },
    },
  ];
  return {
    id,
    prompt: `${a} + ${b}`,
    correct: String(estimate),
    correctSteps: [`${a} ≈ ${round100(a)}`, `${b} ≈ ${round100(b)}`, `${round100(a)} + ${round100(b)} = ${estimate}`],
    distractors: dedupeDistractors(String(estimate), candidates),
  };
}

/** a × b, де обидва множники близькі до десятків (похибка ≤ 2). */
function estimateMultTask(id: string, a: number, b: number): RuleTask {
  const ra = round10(a);
  const rb = round10(b);
  const estimate = ra * rb;
  const candidates: Distractor[] = [
    {
      value: String(ra * b),
      misconception: 'округлив лише перший множник, а другий лишив як є',
      explain: {
        kind: 'visual-proof',
        note: 'Для прикидки округлюють ОБИДВА числа:',
        visual: { kind: 'steps', steps: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`, `${ra} × ${rb} = ${estimate}`] },
      },
    },
    {
      value: String(estimate + ra * 10),
      misconception: 'округлив другий множник на десяток більше, ніж треба',
      explain: { kind: 'rule-recall', text: 'Округлюй до найближчого десятка — до того, який ближче.' },
    },
  ];
  return {
    id,
    prompt: `${a} × ${b}`,
    correct: String(estimate),
    correctSteps: [`${a} ≈ ${ra}`, `${b} ≈ ${rb}`, `${ra} × ${rb} = ${estimate}`],
    distractors: dedupeDistractors(String(estimate), candidates),
  };
}

const ESTIMATION: RuleLessonDef = {
  id: 'math.estimation',
  title: 'Прикидка',
  subject: 'math',
  skillIds: [], // навички «Округлення» у графі ще немає — див. TODO вище
  bands: ['L3', 'L4'],
  build: (band, rng) => {
    const n = taskCount(band);
    /** Знак похибки — щоб число було то трохи менше, то трохи більше за кругле. */
    const sign = (): number => (rng() < 0.5 ? -1 : 1);

    /**
     * Доданок біля сотні: 100k ± (3…20). Похибка НЕНУЛЬОВА (інакше «округлювати»
     * нема чого) і ≤20, тож |da|+|db| ≤ 40 < 50 — округлення доданків гарантовано
     * дає саме найближчу сотню до точної суми.
     */
    const nearHundred = (): number => {
      const k = ri(rng, 1, band === 'L4' ? 8 : 5);
      return k * 100 + sign() * ri(rng, 3, 20);
    };

    /**
     * Множник біля десятка: 10k ± 1 (k ≥ 2). Похибка рівно 1, бо у множенні
     * похибки ПЕРЕМНОЖУЮТЬСЯ: при ±2 прикидка 48×18 дала б 1000 проти точних 864
     * (16%) — дитина побачила б, що прикидка бреше. При ±1 найгірший випадок
     * 19×19 → 400 проти 361 (11%), і класичні приклади 19×21 ≈ 400 (точно 399).
     * Ненульова похибка ще й гарантує, що обманка «округлив лише перший множник»
     * ніколи не збігається з правильною відповіддю.
     */
    const nearTen = (): number => ri(rng, 2, band === 'L4' ? 9 : 6) * 10 + sign();

    const first: RuleBlock = {
      statement: {
        text: 'Щоб швидко прикинути відповідь — округли числа до найближчої сотні, а тоді порахуй.',
        visual: { kind: 'steps', steps: ['297 ≈ 300', '412 ≈ 400', '300 + 400 = 700'] },
      },
      worked: {
        prompt: '297 + 412',
        steps: [
          '297 ближче до 300, ніж до 200 → округлюємо до 300',
          '412 ближче до 400, ніж до 500 → округлюємо до 400',
          '300 + 400 = 700. Точна відповідь 709 — прикидка майже влучила!',
        ],
        answer: '≈ 700',
      },
      tasks: uniqueTasks(n, (i) => estimateAddTask(`est-${i}`, nearHundred(), nearHundred())),
    };

    const second: RuleBlock = {
      changeNote: 'А тепер те саме — з множенням.',
      statement: {
        text: 'Множення прикидають так само: округли обидва числа до найближчого десятка.',
        visual: { kind: 'steps', steps: ['19 ≈ 20', '21 ≈ 20', '20 × 20 = 400'] },
      },
      worked: {
        prompt: '19 × 21',
        steps: ['19 ближче до 20 → округлюємо', '21 теж ближче до 20 → округлюємо', '20 × 20 = 400. Точна відповідь 399!'],
        answer: '≈ 400',
      },
      tasks: uniqueTasks(n, (i) => estimateMultTask(`estm-${i}`, nearTen(), nearTen())),
    };

    return [first, second];
  },
};

// ============================================================

export const MATH_RULE_LESSONS: RuleLessonDef[] = [THROUGH_TEN, ORDER_OF_OPERATIONS, ESTIMATION];
