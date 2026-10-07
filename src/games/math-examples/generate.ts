import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { randInt, shuffle } from '../shared/ui';

type Op = '+' | '−' | '×' | '÷';

export interface Payload {
  a: number;
  b: number;
  op: Op;
  correct: number;
}

const ROUNDS_PER_LEVEL = 5;

interface BandConfig {
  ops: Op[];
  /** Верхня межа операндів (для + / −; × і ÷ завжди в межах таблиці 1-10). */
  max: number;
}

/**
 * Гра спільна для профілю 'L0' (дошкільнята) і 'L3' (школярі), тож L0-L4
 * покриває ОБИДВА треки (D5): 'L0'-профіль → GradeBand L0-L2, 'L3'-профіль →
 * GradeBand L2-L4 (стик на L2 — найскладніший дошкільний рівень і найлегший
 * шкільний). Значення точно відтворюють попередню (level, difficulty)-логіку;
 * записи поза власним треком гри (L3-L4 у L0-треку, L0-L1 у L3-треку) — про
 * запас на майбутнє розширення `levels`, зараз не викликаються.
 *
 * FALLBACK-шлях (G2b): використовується, коли `classLevel` не передано.
 */
const TRACK_BY_LEVEL: Record<ProfileLevel, Record<GradeBand, BandConfig>> = {
  L0: {
    L0: { ops: ['+'], max: 10 },
    L1: { ops: ['+', '−'], max: 10 },
    L2: { ops: ['+', '−'], max: 10 },
    L3: { ops: ['+', '−'], max: 15 },
    L4: { ops: ['+', '−', '×'], max: 20 },
  },
  L3: {
    L0: { ops: ['+'], max: 10 },
    L1: { ops: ['+', '−'], max: 10 },
    L2: { ops: ['×', '+', '−'], max: 100 },
    L3: { ops: ['×', '÷', '+', '−'], max: 100 },
    L4: { ops: ['+', '−', '×'], max: 100 },
  },
};

export function bandConfigFor(level: ProfileLevel, difficulty: Difficulty): BandConfig {
  return TRACK_BY_LEVEL[level][gradeBandFor(level, difficulty)];
}

interface ClassBandConfig extends BandConfig {
  /**
   * Нижня межа доданків/зменшуваного для +/− (QA-фікс дисонансу: без floor
   * генератор дозволяв "3 + 5" поруч із "482 + 317" в одному class-band —
   * тепер + і − завжди в межах, які відповідають заявленому "розряду" класу).
   */
  min: number;
  /** Верхня межа множників для ×/÷ (множник завжди від MULT_MIN_FACTOR, див. нижче). */
  tableMax: number;
  /**
   * Крок округлення для +/− (аудит 07.10): тризначні «742 − 389» усно через
   * клавіатуру — це задача на стовпчик, а не на усний рахунок; третьокласницю
   * така гра зрізала на першому ж рівні. Усно в 3 класі — круглі сотні й десятки,
   * повні тризначні лишаються грі «Стовпчик». Відсутнє = 1 (будь-які числа).
   */
  roundTo?: number;
}

/**
 * Клас-параметри (G2b, двовісна складність): «математичний обрій» додавання/
 * віднімання перенесено з попередньої Expo-версії (`git show
 * main:src/games/math-expressions/index.ts`, `paramsFor`: grade1→20,
 * grade2→100, grade3→1000, grade4→1000). Стара гра мала лише +/−; у поточній
 * math-examples вже є ×/÷ (успадковано з D5 TRACK_BY_LEVEL) — набір дій за
 * класом підібраний за програмою НУШ (множення з'являється в 2 класі),
 * difficulty в межах класу вводить дії поступово (мікропрогресія).
 *
 * grade4 «складніші» (той самий max=1000, що й grade3, орієнтир з ТЗ):
 * з першої ж складності всі 4 дії одразу (grade3 стартує без ÷), і ширша
 * таблиця множення/ділення — власне рішення поверх старих даних, щоб 4 клас
 * відчутно відрізнявся від 3-го при однаковому max.
 *
 * QA-фікс дисонансу (жива скарга з телефона: "× на 1" поруч із "3-цифрові
 * +/−" в одному рівні): корінь був подвійний — (1) `genMultiplication`
 * дозволяв множник=1 (тривіально), і (2) `tableMax` був майже пласким (10,
 * зрідка 12) для grade2..grade4, тоді як `max` для +/− стрибав 100→1000, а
 * нижньої межі (`min`) для +/− не було взагалі (могло випасти "3+5" в класі,
 * де очікується "3-цифрові числа"). Тепер (а) множник ніколи не 1
 * (MULT_MIN_FACTOR=2, як у сусідній times-tables/generate.ts), (б) `tableMax`
 * зростає з класом/difficulty за тією ж шкалою, що й `MAX_BY_CLASS` у
 * times-tables (навмисно ті самі числа — узгодженість між іграми одного
 * класу), (в) `min` прив'язує +/− до розрядності класу (grade2 ⇒ завжди
 * 2-значні 10-99, grade3/grade4 ⇒ завжди 3-значні 100-999), тож жодна дія
 * всередині одного band не випадає ані в "трivial", ані в "надскладне" на тлі
 * сусідніх раундів.
 */
const CLASS_BAND: Record<ClassLevel, Record<Difficulty, ClassBandConfig>> = {
  preschool: {
    1: { ops: ['+'], min: 1, max: 10, tableMax: 10 },
    2: { ops: ['+', '−'], min: 1, max: 10, tableMax: 10 },
    3: { ops: ['+', '−'], min: 1, max: 10, tableMax: 10 },
  },
  grade1: {
    1: { ops: ['+'], min: 1, max: 20, tableMax: 10 },
    2: { ops: ['+', '−'], min: 1, max: 20, tableMax: 10 },
    3: { ops: ['+', '−'], min: 1, max: 20, tableMax: 10 },
  },
  grade2: {
    1: { ops: ['+', '−'], min: 10, max: 100, tableMax: 7 },
    2: { ops: ['×', '+', '−'], min: 10, max: 100, tableMax: 9 },
    3: { ops: ['×', '÷', '+', '−'], min: 10, max: 100, tableMax: 10 },
  },
  grade3: {
    1: { ops: ['×', '+', '−'], min: 100, max: 1000, tableMax: 9, roundTo: 100 },
    2: { ops: ['×', '÷', '+', '−'], min: 100, max: 1000, tableMax: 10, roundTo: 10 },
    3: { ops: ['×', '÷', '+', '−'], min: 100, max: 1000, tableMax: 11, roundTo: 10 },
  },
  grade4: {
    1: { ops: ['×', '÷', '+', '−'], min: 100, max: 1000, tableMax: 9, roundTo: 10 },
    2: { ops: ['×', '÷', '+', '−'], min: 100, max: 1000, tableMax: 12, roundTo: 10 },
    3: { ops: ['×', '÷', '+', '−'], min: 100, max: 1000, tableMax: 12 },
  },
};

export function classBandConfigFor(classLevel: ClassLevel, difficulty: Difficulty): ClassBandConfig {
  return CLASS_BAND[classLevel][difficulty];
}

// --- генерація пар операндів для кожної дії ---

/**
 * Нижня межа множників ×/÷ (QA-фікс: множення на 1 — вироджений приклад, не
 * тренує навичку; той самий поріг, що й `MIN_FACTOR` у сусідній
 * times-tables/generate.ts).
 */
const MULT_MIN_FACTOR = 2;

/** Додавання в межах [min, max], обидва операнди >= min (без тривіальних "0 + x" і без "дрібних" чисел поза розрядом класу). */
function genAddition(min: number, max: number, r = 1): { a: number; b: number } {
  const a = r * randInt(Math.ceil(min / r), Math.floor((max - min) / r));
  const b = r * randInt(Math.ceil(min / r), Math.floor((max - a) / r));
  return { a, b };
}

/** Віднімання в межах [min, max], результат завжди >= 1 (без "x - 0" / "x - x", без чисел поза розрядом класу). */
function genSubtraction(min: number, max: number, r = 1): { a: number; b: number } {
  const a = r * randInt(Math.ceil((min + r) / r), Math.floor(max / r));
  const b = r * randInt(Math.ceil(min / r), Math.floor((a - r) / r));
  return { a, b };
}

/** Таблиця множення MULT_MIN_FACTOR..tableMax × MULT_MIN_FACTOR..tableMax (без тривіального ×1/×0). */
function genMultiplication(tableMax: number): { a: number; b: number } {
  const a = randInt(MULT_MIN_FACTOR, tableMax);
  const b = randInt(MULT_MIN_FACTOR, tableMax);
  return { a, b };
}

/** Ділення націло: дільник і частка обидва MULT_MIN_FACTOR..tableMax (без ÷1 і без тривіального "x÷x=1"). */
function genDivision(tableMax: number): { a: number; b: number } {
  const divisor = randInt(MULT_MIN_FACTOR, tableMax);
  const quotient = randInt(MULT_MIN_FACTOR, tableMax);
  return { a: divisor * quotient, b: divisor };
}

/** Побудувати послідовність операцій на раунд, уникаючи "усі однакові", коли варіантів > 1. */
function buildOpSequence(pool: Op[]): Op[] {
  if (pool.length === 1) return Array(ROUNDS_PER_LEVEL).fill(pool[0]);
  const seq: Op[] = Array.from({ length: ROUNDS_PER_LEVEL }, () => pool[randInt(0, pool.length - 1)]);
  if (new Set(seq).size === 1) {
    const alt = pool.find((o) => o !== seq[0])!;
    seq[randInt(0, seq.length - 1)] = alt;
  }
  return shuffle(seq);
}

function genPair(op: Op, min: number, max: number, tableMax: number, r = 1): { a: number; b: number; correct: number } {
  if (op === '×') {
    const { a, b } = genMultiplication(tableMax);
    return { a, b, correct: a * b };
  }
  if (op === '÷') {
    const { a, b } = genDivision(tableMax);
    return { a, b, correct: a / b };
  }
  if (op === '+') {
    const { a, b } = genAddition(min, max, r);
    return { a, b, correct: a + b };
  }
  const { a, b } = genSubtraction(min, max, r);
  return { a, b, correct: a - b };
}

export function generate(
  difficulty: Difficulty,
  level: ProfileLevel,
  classLevel?: ClassLevel,
): LevelData<Payload, number> {
  // Fallback (без classLevel, G2b): min=1 зберігає стару поведінку профільного
  // TRACK_BY_LEVEL один-в-один — цей шлях мертвий у проді (GameShell завжди
  // передає classLevel), тримається лише заради зворотної сумісності API/тестів.
  const { ops: pool, min, max, tableMax, roundTo } = classLevel
    ? classBandConfigFor(classLevel, difficulty)
    : { ...bandConfigFor(level, difficulty), min: 1, tableMax: 10, roundTo: 1 };
  const sequence = buildOpSequence(pool);
  const rounds: Round<Payload, number>[] = sequence.map((op, i) => {
    const { a, b, correct } = genPair(op, min, max, tableMax, roundTo ?? 1);
    return { id: `r${i}`, payload: { a, b, op, correct }, answer: correct };
  });
  return { difficulty, rounds };
}
