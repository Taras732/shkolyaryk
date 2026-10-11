import type { ClassLevel, Difficulty, GradeBand, LevelData, ProfileLevel, Round } from '../types';
import { gradeBandFor } from '../types';
import { randInt, shuffle } from '../shared/ui';
import { UNITS, OBJECTS, unitByKey, baseValue, type ObjectFact, type MeasureCategory } from './data';

export interface ComparePayload {
  mode: 'compare';
  left: ObjectFact;
  right: ObjectFact;
}

export interface UnitPayload {
  mode: 'unit';
  obj: ObjectFact;
  options: string[];
}

export interface ConvertPayload {
  mode: 'convert';
  fromKey: string;
  toKey: string;
  value: number;
  result: number;
}

export interface MultistepPayload {
  mode: 'multistep';
  category: 'length' | 'mass' | 'volume';
  smallKey: string;
  bigKey: string;
  a: number;
  b: number;
  result: number;
}

export type Payload = ComparePayload | UnitPayload | ConvertPayload | MultistepPayload;
export type RoundMode = Payload['mode'];

export const BASE_CATEGORIES: MeasureCategory[] = ['length', 'mass', 'volume'];

/** Прості пари одиниць для перетворень (Medium): сусідні одиниці, множник ≤1000. */
export const CONVERT_PAIRS_MEDIUM: { big: string; small: string }[] = [
  { big: 'm', small: 'cm' },
  { big: 'dm', small: 'cm' },
  { big: 'cm', small: 'mm' },
  { big: 'kg', small: 'g' },
  { big: 'l', small: 'ml' },
];

/** Hard додає км/т і дозволяє обидва напрямки перетворення. */
export const CONVERT_PAIRS_HARD: { big: string; small: string }[] = [
  ...CONVERT_PAIRS_MEDIUM,
  { big: 'km', small: 'm' },
  { big: 't', small: 'kg' },
];

/** Пари для багатокрокових задач: сума двох величин + переведення в більшу одиницю. */
export const MULTISTEP_PAIRS: { big: string; small: string; category: 'length' | 'mass' | 'volume' }[] = [
  { big: 'm', small: 'cm', category: 'length' },
  { big: 'kg', small: 'g', category: 'mass' },
  { big: 'l', small: 'ml', category: 'volume' },
];

export interface BandConfig {
  /** Які одиниці "в грі" для обʼєктів (важчі одиниці — лише на старших бендах). */
  unitKeys: string[];
  /** Категорії, з яких обираються обʼєкти для compare (температура — лише L4). */
  categories: MeasureCategory[];
  /** Пари одиниць, доступні для convert. */
  convertPairs: { big: string; small: string }[];
  /** Чи дозволено зворотне перетворення (менша→більша одиниця) у convert. */
  allowReverseConvert: boolean;
  /** Пул режимів раунду (5 елементів = ROUNDS); generate() перемішує його заново щоразу. */
  modes: RoundMode[];
}

/**
 * Набір одиниць/категорій/пар для перетворень + режими раунду за узгодженою
 * шкалою L0-L4 (D5). Гра доступна лише профілю 'L3' (школярі, `levels:
 * ['L3']`), тож реально задіяні лише L2-L4 (Easy/Medium/Hard, значення точно
 * як у попередній difficulty-таблиці); L0-L1 — про запас на майбутнє
 * розширення `levels` (менше одиниць/категорій, лише unit/compare — без
 * convert/multistep/температури).
 */
export const CONFIG_BY_BAND: Record<GradeBand, BandConfig> = {
  L0: {
    unitKeys: ['cm', 'm', 'g', 'kg'],
    categories: ['length', 'mass'],
    convertPairs: [],
    allowReverseConvert: false,
    modes: ['unit', 'unit', 'unit', 'compare', 'compare'],
  },
  L1: {
    unitKeys: ['cm', 'm', 'g', 'kg', 'ml'],
    categories: ['length', 'mass', 'volume'],
    convertPairs: [],
    allowReverseConvert: false,
    modes: ['unit', 'unit', 'unit', 'compare', 'compare'],
  },
  L2: {
    unitKeys: ['cm', 'm', 'g', 'kg', 'ml', 'l'],
    categories: BASE_CATEGORIES,
    convertPairs: CONVERT_PAIRS_MEDIUM,
    allowReverseConvert: false,
    modes: ['unit', 'unit', 'unit', 'compare', 'compare'],
  },
  L3: {
    unitKeys: ['mm', 'cm', 'm', 'g', 'kg', 'ml', 'l'],
    categories: BASE_CATEGORIES,
    convertPairs: CONVERT_PAIRS_MEDIUM,
    allowReverseConvert: false,
    modes: ['unit', 'unit', 'compare', 'convert', 'convert'],
  },
  L4: {
    unitKeys: UNITS.map((u) => u.key),
    categories: [...BASE_CATEGORIES, 'temp'],
    convertPairs: CONVERT_PAIRS_HARD,
    allowReverseConvert: true,
    modes: ['unit', 'compare', 'convert', 'multistep', 'multistep'],
  },
};

/**
 * Клас → набір допустимих одиниць (G2b, перенесено 1:1 зі старого
 * `allowedUnitsFor` у main). На відміну від `CONFIG_BY_BAND` (band-вісь:
 * дошкільний/шкільний трек × difficulty), ця вісь масштабує складність за
 * НАВЧАЛЬНИМ КЛАСОМ: 1 клас — лише [cm, m, kg], 4 клас — повний набір з
 * кілометрами й тонами. `preschool` не мав окремої гілки у старому коді
 * (measures був недоступний дошкільнятам) — тут узято найменший (grade1) набір
 * як безпечний дефолт.
 */
export const CLASS_UNIT_KEYS: Record<ClassLevel, string[]> = {
  preschool: ['cm', 'm', 'kg'],
  // 11.10: програма 1 класу — см, дм, м, кг, л (Савченко [1 МАО 4.7])
  grade1: ['cm', 'dm', 'm', 'kg', 'l'],
  // 11.10: програма 2 класу додає міліметр
  grade2: ['mm', 'cm', 'dm', 'm', 'g', 'kg', 'l'],
  grade3: ['mm', 'cm', 'dm', 'm', 'km', 'g', 'kg', 'ml', 'l'],
  grade4: ['mm', 'cm', 'dm', 'm', 'km', 'g', 'kg', 't', 'ml', 'l'],
};

/** Difficulty → режим раунду для клас-осі (перенесено зі старого paramsFor: <=1→unit, ===2→convert, ===3→compare). */
function modeForClass(difficulty: Difficulty, unitKeys: string[]): RoundMode {
  if (difficulty <= 1) return 'unit';
  if (difficulty === 2) {
    const hasConvertPair = CONVERT_PAIRS_HARD.some((p) => unitKeys.includes(p.big) && unitKeys.includes(p.small));
    return hasConvertPair ? 'convert' : 'unit';
  }
  return 'compare';
}

export function genCompare(pool: ObjectFact[], categories: MeasureCategory[]): ComparePayload {
  let cat = categories[randInt(0, categories.length - 1)];
  let inCat = pool.filter((o) => o.category === cat);
  let guard = 0;
  while (inCat.length < 2 && guard < 10) {
    cat = categories[randInt(0, categories.length - 1)];
    inCat = pool.filter((o) => o.category === cat);
    guard++;
  }
  if (inCat.length < 2) inCat = OBJECTS.filter((o) => o.category === cat);

  const shuffled = shuffle(inCat);
  const left = shuffled[0];
  let right = shuffled[1];
  guard = 0;
  while (baseValue(left) === baseValue(right) && guard < 10) {
    right = shuffled[randInt(0, shuffled.length - 1)];
    guard++;
  }
  return { mode: 'compare', left, right };
}

/**
 * Дистрактори для 'unit' раунду: ЛИШЕ одиниці тієї самої величини (категорії),
 * що й правильна одиниця — тонна ніколи не стане дистрактором для мілілітрів
 * (раніше `otherCategory` домішувала будь-яку одиницю з іншої величини, звідси
 * баг «т» як варіант для чайної ложки 5 мл).
 *
 * З-поміж одиниць тієї самої категорії беремо до 2 НАЙБЛИЖЧИХ за порядком
 * величини (сусідні одиниці за позицією в `UNITS`, який задекларований по
 * зростанню `inBase` в межах кожної категорії): для 5 мл коректний дистрактор —
 * «л», а не щось довільне з 5 одиниць довжини.
 *
 * Якщо в категорії замало одиниць для 2 дистракторів (об'єм має лише 2
 * одиниці — буде 1 дистрактор; температура має лише 1 — спершу пробуємо
 * підібрати інший обʼєкт з пулу, а якщо не вдалось — краще менше варіантів,
 * ніж абсурдний дистрактор з іншої величини).
 */
export function genUnit(pool: ObjectFact[]): UnitPayload {
  let obj = pool[randInt(0, pool.length - 1)];
  let correctUnit = unitByKey(obj.unitKey);
  let categoryUnits = UNITS.filter((u) => u.category === correctUnit.category);
  let guard = 0;
  while (categoryUnits.length < 2 && guard < 10) {
    obj = pool[randInt(0, pool.length - 1)];
    correctUnit = unitByKey(obj.unitKey);
    categoryUnits = UNITS.filter((u) => u.category === correctUnit.category);
    guard++;
  }

  const correctIdx = categoryUnits.findIndex((u) => u.key === correctUnit.key);
  const decoys = categoryUnits
    .filter((u) => u.key !== correctUnit.key)
    .sort((a, b) => {
      const da = Math.abs(categoryUnits.findIndex((u) => u.key === a.key) - correctIdx);
      const db = Math.abs(categoryUnits.findIndex((u) => u.key === b.key) - correctIdx);
      return da - db;
    })
    .slice(0, 2);

  const options = shuffle([correctUnit.label, ...decoys.map((u) => u.label)]);
  return { mode: 'unit', obj, options };
}

export function genConvert(pairs: { big: string; small: string }[], allowReverse: boolean): ConvertPayload {
  const pair = pairs[randInt(0, pairs.length - 1)];
  const bigUnit = unitByKey(pair.big);
  const smallUnit = unitByKey(pair.small);
  const ratio = bigUnit.inBase / smallUnit.inBase;
  const reverse = allowReverse && Math.random() < 0.5;
  if (!reverse) {
    const value = randInt(1, 9);
    return { mode: 'convert', fromKey: pair.big, toKey: pair.small, value, result: value * ratio };
  }
  const mult = randInt(1, 9);
  const value = mult * ratio;
  return { mode: 'convert', fromKey: pair.small, toKey: pair.big, value, result: mult };
}

export function genMultistep(): MultistepPayload {
  const item = MULTISTEP_PAIRS[randInt(0, MULTISTEP_PAIRS.length - 1)];
  const bigUnit = unitByKey(item.big);
  const smallUnit = unitByKey(item.small);
  const ratio = bigUnit.inBase / smallUnit.inBase;
  const mult = randInt(2, 6);
  const total = mult * ratio;
  const a = randInt(1, total - 1);
  const b = total - a;
  return { mode: 'multistep', category: item.category, smallKey: item.small, bigKey: item.big, a, b, result: mult };
}

export function correctFor(payload: Payload): string {
  if (payload.mode === 'unit') return unitByKey(payload.obj.unitKey).label;
  if (payload.mode === 'compare') return baseValue(payload.left) >= baseValue(payload.right) ? payload.left.name : payload.right.name;
  return String(payload.result);
}

export function generate(
  difficulty: Difficulty,
  level: ProfileLevel = 'L3',
  classLevel?: ClassLevel,
): LevelData<Payload, string> {
  if (classLevel) {
    const unitKeys = CLASS_UNIT_KEYS[classLevel];
    const filtered = OBJECTS.filter((o) => unitKeys.includes(o.unitKey));
    const pool = filtered.length > 0 ? filtered : OBJECTS;
    const categoriesInPool = BASE_CATEGORIES.filter((cat) => pool.some((o) => o.category === cat));
    const categories = categoriesInPool.length > 0 ? categoriesInPool : BASE_CATEGORIES;
    const mode = modeForClass(difficulty, unitKeys);
    const pairs = CONVERT_PAIRS_HARD.filter((p) => unitKeys.includes(p.big) && unitKeys.includes(p.small));

    const rounds: Round<Payload, string>[] = Array.from({ length: 5 }, (_, i) => {
      let payload: Payload;
      if (mode === 'unit') payload = genUnit(pool);
      else if (mode === 'compare') payload = genCompare(pool, categories);
      else payload = genConvert(pairs, false);
      return { id: `r${i}`, payload, answer: correctFor(payload) };
    });
    return { difficulty, rounds };
  }

  const config = CONFIG_BY_BAND[gradeBandFor(level, difficulty)];
  const filtered = OBJECTS.filter((o) => config.unitKeys.includes(o.unitKey));
  const pool = filtered.length > 0 ? filtered : OBJECTS;
  const modes = shuffle(config.modes);

  const rounds: Round<Payload, string>[] = modes.map((mode, i) => {
    let payload: Payload;
    if (mode === 'unit') payload = genUnit(pool);
    else if (mode === 'compare') payload = genCompare(pool, config.categories);
    else if (mode === 'convert') payload = genConvert(config.convertPairs, config.allowReverseConvert);
    else payload = genMultistep();
    return { id: `r${i}`, payload, answer: correctFor(payload) };
  });
  return { difficulty, rounds };
}
