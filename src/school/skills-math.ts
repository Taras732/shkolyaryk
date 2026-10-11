// Seed skill-graph: математика L0–L4 (BRIEF SHK-A2).
// Джерело істини по програмі: Shkolyaryk_Pedagogy_SkillGraph_2026-07.html (розділ 1–2).
// Grade bands: L0=дошкілля 3–4 · L1=дошкілля 5–6 + 1 клас · L2=2 клас · L3=3 клас · L4=4 клас.
// prerequisites — строгий DAG (skill залежить від prerequisite; prerequisite завжди
// того самого або раннішого grade_band). Перевіряється сидером (topo-sort, --check).
//
// ⚠️ Дані тут дублюються 1:1 у supabase/seed/skills-math.data.mjs (той самий масив,
// без типів — щоб сидер лишався чистим ESM без TS-компіляції). Якщо змінюєш цей файл —
// онови й .data.mjs (або перегенеруй його з цього файлу).

import type { GradeBand } from './types';

export interface SeedSkill {
  id: string;
  subject: 'math';
  strand: string;
  topic: string;
  title: string;
  grade_band: GradeBand;
  prerequisites: string[];
  mastery_threshold?: number;
  review_interval_days?: number;
  /** Коди очікуваних результатів МОН (програма Савченко), напр. '1 МАО 4.3'. */
  orn?: string[];
  sort?: number;
}

export const MATH_SKILLS: SeedSkill[] = [
  // ============================================================
  // L0 — дошкілля 3–4 (10 skills)
  // ============================================================
  { id: 'math.count.l0.one-to-one', subject: 'math', strand: 'Числа й лічба', topic: 'Лічба', title: 'Лічба один-до-одного (дотик і називання)', grade_band: 'L0', prerequisites: [], sort: 10 },
  { id: 'math.count.l0.forward-1-5', subject: 'math', strand: 'Числа й лічба', topic: 'Лічба', title: 'Лічба вперед у межах 5', grade_band: 'L0', prerequisites: ['math.count.l0.one-to-one'], sort: 20 },
  { id: 'math.count.l0.digits-1-5', subject: 'math', strand: 'Числа й лічба', topic: 'Цифри', title: 'Розпізнавання цифр 1–5', grade_band: 'L0', prerequisites: ['math.count.l0.forward-1-5'], sort: 30 },
  { id: 'math.count.l0.compare-qty', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння кількості (більше/менше/порівну)', grade_band: 'L0', prerequisites: ['math.count.l0.forward-1-5'], sort: 40 },
  { id: 'math.measure.l0.long-short', subject: 'math', strand: 'Величини', topic: 'Довжина', title: 'Довгий/короткий (порівняння на око)', grade_band: 'L0', prerequisites: [], sort: 50 },
  { id: 'math.measure.l0.big-small', subject: 'math', strand: 'Величини', topic: 'Розмір', title: 'Великий/малий (порівняння розміру)', grade_band: 'L0', prerequisites: [], sort: 60 },
  { id: 'math.geom.l0.colors', subject: 'math', strand: 'Геометрія', topic: 'Кольори', title: 'Основні кольори', grade_band: 'L0', prerequisites: [], sort: 70 },
  { id: 'math.geom.l0.shapes-basic', subject: 'math', strand: 'Геометрія', topic: 'Форми', title: 'Форми: круг, квадрат, трикутник', grade_band: 'L0', prerequisites: [], sort: 80 },
  { id: 'math.geom.l0.shape-sort', subject: 'math', strand: 'Геометрія', topic: 'Форми', title: 'Сортування за формою і кольором', grade_band: 'L0', prerequisites: ['math.geom.l0.shapes-basic', 'math.geom.l0.colors'], sort: 90 },
  { id: 'math.data.l0.sort-group', subject: 'math', strand: 'Робота з даними', topic: 'Групування', title: 'Групування предметів за спільною ознакою', grade_band: 'L0', prerequisites: [], sort: 100 },

  // ============================================================
  // L1 — дошкілля 5–6 + 1 клас (19 skills)
  // ============================================================
  { id: 'math.count.l1.forward-back-1-10', subject: 'math', strand: 'Числа й лічба', topic: 'Лічба', title: 'Пряма й зворотна лічба в межах 10', grade_band: 'L1', prerequisites: ['math.count.l0.forward-1-5'], orn: ['1 МАО 4.2'], sort: 110 },
  { id: 'math.count.l1.numeral-writing', subject: 'math', strand: 'Числа й лічба', topic: 'Цифри', title: 'Написання цифр 0–9', grade_band: 'L1', prerequisites: ['math.count.l0.digits-1-5'], orn: ['1 МАО 4.2'], sort: 120 },
  { id: 'math.count.l1.ordinal-1-10', subject: 'math', strand: 'Числа й лічба', topic: 'Лічба', title: 'Порядкова лічба (перший–десятий)', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], orn: ['1 МАО 4.2'], sort: 130 },
  { id: 'math.count.l1.compose-10', subject: 'math', strand: 'Числа й лічба', topic: 'Склад числа', title: 'Склад числа 10', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], orn: ['1 МАО 4.2'], sort: 140 },
  { id: 'math.count.l1.neighbors', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Сусідні числа (попереднє/наступне)', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], orn: ['1 МАО 4.2'], sort: 150 },
  { id: 'math.count.l1.numbers-11-20', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Нумерація 11–20, розряди (десяток і одиниці)', grade_band: 'L1', prerequisites: ['math.count.l1.compose-10'], orn: ['1 МАО 4.1'], sort: 160 },
  { id: 'math.count.l1.compare-numbers-20', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння чисел у межах 20', grade_band: 'L1', prerequisites: ['math.count.l1.numbers-11-20'], orn: ['1 МАО 4.2'], sort: 170 },
  { id: 'math.ops.l1.add-sub-objects-10', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання в межах 10 на предметах', grade_band: 'L1', prerequisites: ['math.count.l1.compose-10'], orn: ['1 МАО 4.1'], sort: 180 },
  { id: 'math.ops.l1.compose-decompose-20', subject: 'math', strand: 'Дії з числами', topic: 'Склад числа', title: 'Склад чисел другого десятка (10+n)', grade_band: 'L1', prerequisites: ['math.count.l1.numbers-11-20'], orn: ['1 МАО 4.3'], sort: 190 },
  { id: 'math.ops.l1.add-sub-no-carry-20', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання на основі нумерації (10 + 3, 15 − 5)', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-objects-10', 'math.count.l1.numbers-11-20'], orn: ['1 МАО 4.3'], sort: 200 },
  { id: 'math.ops.l2.add-sub-carry-20', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання з переходом через десяток (межа 20)', grade_band: 'L2', prerequisites: ['math.ops.l1.add-sub-no-carry-20'], orn: ['2 МАО 4.3'], sort: 210 },
  { id: 'math.ops.l1.word-problems-simple', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Прості сюжетні задачі на + і −', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-10'], orn: ['1 МАО 3.1', '1 МАО 2.2'], sort: 220 },
  { id: 'math.measure.l1.length-compare', subject: 'math', strand: 'Величини', topic: 'Довжина', title: 'Порівняння довжини накладанням і на око', grade_band: 'L1', prerequisites: ['math.measure.l0.long-short'], orn: ['1 МАО 4.7'], sort: 230 },
  { id: 'math.measure.l1.space-time', subject: 'math', strand: 'Величини', topic: 'Час і простір', title: 'Просторові й часові поняття (зверху/знизу, вчора/сьогодні/завтра)', grade_band: 'L1', prerequisites: [], orn: ['1 МАО 4.4'], sort: 240 },
  { id: 'math.measure.l1.measure-intro', subject: 'math', strand: 'Величини', topic: 'Вимірювання', title: 'Ознайомлення з одиницями вимірювання (см, кг, хв)', grade_band: 'L1', prerequisites: ['math.measure.l1.length-compare'], orn: ['1 МАО 1.1', '1 МАО 4.7'], sort: 250 },
  { id: 'math.geom.l1.flat-shapes', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Плоскі фігури: трикутник, чотирикутник, квадрат, круг', grade_band: 'L1', prerequisites: ['math.geom.l0.shapes-basic'], orn: ['1 МАО 4.5'], sort: 260 },
  { id: 'math.geom.l1.spatial-shapes', subject: 'math', strand: 'Геометрія', topic: 'Просторові фігури', title: 'Просторові фігури: куб, куля, циліндр, конус, піраміда', grade_band: 'L1', prerequisites: ['math.geom.l0.shapes-basic'], orn: ['1 МАО 4.5'], sort: 270 },
  { id: 'math.geom.l1.shape-properties', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Властивості фігур: кути і сторони (ознайомлення)', grade_band: 'L1', prerequisites: ['math.geom.l1.flat-shapes'], orn: ['1 МАО 4.5'], sort: 280 },
  { id: 'math.data.l1.simple-charts', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Прості таблиці й піктограми (читання)', grade_band: 'L1', prerequisites: ['math.count.l1.compare-numbers-20'], orn: ['1 МАО 2.1'], sort: 290 },

  // нові навички 1 класу за програмою Савченко (11.10.2026)
  // 11.10: з підручника Гісь/Філяк (план 1 семестру, тиждень 12); у тексті програми окремим результатом не названо — коду немає
  { id: 'math.count.l1.number-line', subject: 'math', strand: 'Числа й лічба', topic: 'Числовий промінь', title: 'Числовий промінь: місце числа, пропущене число', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], sort: 199 },
  { id: 'math.count.l1.even-odd', subject: 'math', strand: 'Числа й лічба', topic: 'Парні й непарні', title: 'Парні й непарні числа (лічба парами)', grade_band: 'L1', prerequisites: ['math.count.l1.compose-10'], sort: 200 },
  { id: 'math.ops.l1.add-sub-10', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання й віднімання одноцифрових чисел у межах 10', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-objects-10'], orn: ['1 МАО 4.3'], sort: 201 },
  { id: 'math.ops.l1.more-less-by', subject: 'math', strand: 'Дії з числами', topic: 'Порівняння', title: 'На скільки більше / менше; збільшити й зменшити на кілька одиниць', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-10'], orn: ['1 МАО 4.3'], sort: 202 },
  { id: 'math.ops.l1.unknown-addend', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Невідомий доданок', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-10'], orn: ['1 МАО 4.8', '1 МАО 4.1'], sort: 203 },
  { id: 'math.ops.l1.expressions', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Вирази на 1–2 дії; рівності й нерівності (<, >, =)', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-10'], orn: ['1 МАО 4.8', '1 МАО 4.3', '1 МАО 4.2'], sort: 204 },
  { id: 'math.ops.l1.compose-problems', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Складає прості сюжетні задачі сам', grade_band: 'L1', prerequisites: ['math.ops.l1.word-problems-simple'], orn: ['1 МАО 1.2'], sort: 205 },
  { id: 'math.measure.l1.capacity-litre', subject: 'math', strand: 'Величини', topic: 'Місткість', title: 'Місткість: літр — л', grade_band: 'L1', prerequisites: ['math.measure.l1.measure-intro'], orn: ['1 МАО 4.7'], sort: 206 },
  { id: 'math.measure.l1.clock-hours', subject: 'math', strand: 'Величини', topic: 'Час', title: 'Годинник у межах цілих годин; календар', grade_band: 'L1', prerequisites: ['math.measure.l1.space-time'], orn: ['1 МАО 4.7'], sort: 207 },
  { id: 'math.measure.l1.money-play', subject: 'math', strand: 'Величини', topic: 'Гроші', title: 'Гроші в грі: гривня (грн), копійка (к.)', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-10'], orn: ['1 МАО 4.3'], sort: 208 },
  { id: 'math.geom.l1.lines', subject: 'math', strand: 'Геометрія', topic: 'Лінії', title: 'Точка, пряма, промінь, відрізок, ламана', grade_band: 'L1', prerequisites: ['math.geom.l1.flat-shapes'], orn: ['1 МАО 4.5'], sort: 209 },
  { id: 'math.geom.l1.segment-measure', subject: 'math', strand: 'Геометрія', topic: 'Лінії', title: 'Вимірює відрізок і креслить відрізок заданої довжини', grade_band: 'L1', prerequisites: ['math.geom.l1.lines', 'math.measure.l1.length-units'], orn: ['1 МАО 4.6', '1 МАО 4.7'], sort: 210 },

  // ============================================================
  // L2 — 2 клас (14 skills)
  // ============================================================
  { id: 'math.count.l1.numbers-100', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Числа 11–100: десятки й одиниці двоцифрового числа', grade_band: 'L1', prerequisites: ['math.count.l1.numbers-11-20'], orn: ['1 МАО 4.1', '1 МАО 4.2'], sort: 300 },
  { id: 'math.count.l1.compare-100', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння чисел у межах 100', grade_band: 'L1', prerequisites: ['math.count.l1.numbers-100'], orn: ['1 МАО 4.2'], sort: 310 },
  { id: 'math.ops.l2.add-sub-no-carry-100', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання без переходу через розряд до 100', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-20', 'math.count.l1.numbers-100'], orn: ['2 МАО 4.3'], sort: 320 },
  { id: 'math.ops.l2.add-sub-carry-100', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання з переходом через розряд до 100', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-no-carry-100'], orn: ['2 МАО 4.3'], sort: 330 },
  { id: 'math.ops.l2.mult-table-2-3', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Сутність множення й ділення; таблиці на 2 і 3', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-100'], orn: ['2 МАО 4.1', '2 МАО 4.3'], sort: 340 },
  { id: 'math.ops.l3.mult-table-4-9', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Табличне множення на 4–9', grade_band: 'L3', prerequisites: ['math.ops.l2.mult-table-2-3'], orn: ['3 МАО 4.3'], sort: 350 },
  { id: 'math.ops.l2.division-table', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Табличне ділення на 2 і 3', grade_band: 'L2', prerequisites: ['math.ops.l2.mult-table-2-3'], orn: ['2 МАО 4.3'], sort: 360 },
  { id: 'math.ops.l2.word-problems-100', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Текстові задачі на 4 дії в межах 100', grade_band: 'L2', prerequisites: ['math.ops.l2.division-table'], orn: ['2 МАО 2.2', '2 МАО 3.1'], sort: 370 },
  { id: 'math.measure.l1.length-units', subject: 'math', strand: 'Величини', topic: 'Довжина', title: 'Довжина: см, дм, м — короткі позначення, вимірювання', grade_band: 'L1', prerequisites: ['math.measure.l1.measure-intro'], orn: ['1 МАО 4.7'], sort: 380 },
  { id: 'math.measure.l1.mass-units', subject: 'math', strand: 'Величини', topic: 'Маса', title: 'Маса: кілограм — кг', grade_band: 'L1', prerequisites: ['math.measure.l1.measure-intro'], orn: ['1 МАО 4.7'], sort: 390 },
  { id: 'math.measure.l2.time-units', subject: 'math', strand: 'Величини', topic: 'Час', title: 'Час: години, хвилини, доба, тиждень', grade_band: 'L2', prerequisites: ['math.measure.l1.space-time'], orn: ['2 МАО 4.7'], sort: 400 },
  { id: 'math.measure.l2.perimeter', subject: 'math', strand: 'Величини', topic: 'Периметр і площа', title: 'Периметр многокутника', grade_band: 'L2', prerequisites: ['math.geom.l1.flat-shapes', 'math.ops.l2.add-sub-carry-100'], orn: ['2 МАО 4.7'], sort: 410 },
  { id: 'math.geom.l2.polygon-classify', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Класифікація многокутників за кількістю сторін', grade_band: 'L2', prerequisites: ['math.geom.l1.shape-properties'], orn: ['2 МАО 4.5'], sort: 420 },
  { id: 'math.data.l2.charts', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Таблиці, схеми, лінійні діаграми (читання)', grade_band: 'L2', prerequisites: ['math.data.l1.simple-charts'], orn: ['2 МАО 2.1'], sort: 430 },

  // нові навички 2 класу за програмою Савченко (11.10.2026)
  { id: 'math.ops.l2.mult-special-0-1', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Множення й ділення з 0 і 1; ділити на 0 не можна', grade_band: 'L2', prerequisites: ['math.ops.l2.mult-table-2-3'], orn: ['2 МАО 4.3'], sort: 421 },
  { id: 'math.ops.l2.times-more-less', subject: 'math', strand: 'Дії з числами', topic: 'Порівняння', title: 'У скільки разів більше / менше', grade_band: 'L2', prerequisites: ['math.ops.l2.mult-table-2-3'], orn: ['2 МАО 4.3'], sort: 422 },

  // нові навички 2 класу за програмою Савченко (11.10.2026, вечір)
  { id: 'math.count.l2.place-value-sum', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Розрядний склад: 47 = 40 + 7', grade_band: 'L2', prerequisites: ['math.count.l1.numbers-100'], orn: ['2 МАО 4.2'], sort: 431 },
  { id: 'math.ops.l2.unknown-component-sub', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Невідомий зменшуваний і відʼємник', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-100'], orn: ['2 МАО 4.3', '2 МАО 4.8'], sort: 432 },
  { id: 'math.ops.l2.unknown-component-mult', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Невідомий множник, ділене, дільник', grade_band: 'L2', prerequisites: ['math.ops.l2.mult-table-2-3', 'math.ops.l2.division-table'], orn: ['2 МАО 4.8'], sort: 433 },
  { id: 'math.ops.l2.mult-laws', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Переставний закон; звʼязок множення й ділення; назви компонентів', grade_band: 'L2', prerequisites: ['math.ops.l2.mult-table-2-3'], orn: ['2 МАО 3.2', '2 МАО 4.8'], sort: 434 },
  { id: 'math.ops.l2.estimate-check', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Прогноз результату й перевірка обчислень', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-100'], orn: ['2 МАО 1.3', '2 МАО 3.3', '2 МАО 3.4'], sort: 435 },
  { id: 'math.ops.l2.letter-expressions', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Буквені вирази; порівняння виразів (<, >, =)', grade_band: 'L2', prerequisites: ['math.ops.l1.expressions'], orn: ['2 МАО 4.2', '2 МАО 4.3', '2 МАО 4.8'], sort: 436 },
  { id: 'math.ops.l2.compound-problems', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Складені задачі: модель, достатність даних', grade_band: 'L2', prerequisites: ['math.ops.l2.word-problems-100'], orn: ['2 МАО 2.1', '2 МАО 2.3', '2 МАО 3.2'], sort: 437 },
  { id: 'math.measure.l2.units-convert', subject: 'math', strand: 'Величини', topic: 'Вимірювання', title: 'Мм, см, дм, м; кг; співвідношення одиниць', grade_band: 'L2', prerequisites: ['math.measure.l1.length-units', 'math.measure.l1.mass-units'], orn: ['2 МАО 4.7'], sort: 438 },
  { id: 'math.measure.l2.polyline-length', subject: 'math', strand: 'Величини', topic: 'Довжина', title: 'Довжина ламаної', grade_band: 'L2', prerequisites: ['math.geom.l1.lines'], orn: ['2 МАО 4.7'], sort: 439 },
  { id: 'math.measure.l2.money-shop', subject: 'math', strand: 'Величини', topic: 'Гроші', title: 'Купівля і решта: грн і к.', grade_band: 'L2', prerequisites: ['math.measure.l1.money-play', 'math.ops.l2.add-sub-carry-100'], orn: ['2 МАО 4.3'], sort: 440 },
  { id: 'math.geom.l2.circle-vs-disc', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Круг і коло', grade_band: 'L2', prerequisites: ['math.geom.l1.flat-shapes'], orn: ['2 МАО 4.5'], sort: 441 },
  { id: 'math.geom.l2.grid-rectangle', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Прямокутник і квадрат у клітинку', grade_band: 'L2', prerequisites: ['math.geom.l1.segment-measure'], orn: ['2 МАО 4.6'], sort: 442 },
  // ============================================================
  // L3 — 3 клас (14 skills)
  // ============================================================
  { id: 'math.count.l3.numbers-1000', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Нумерація в межах 1000, розряди (сотні/десятки/одиниці)', grade_band: 'L3', prerequisites: ['math.count.l1.numbers-100'], orn: ['3 МАО 4.2'], sort: 440 },
  { id: 'math.count.l3.compare-1000', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння й впорядкування чисел до 1000', grade_band: 'L3', prerequisites: ['math.count.l3.numbers-1000'], orn: ['3 МАО 4.2'], sort: 450 },
  { id: 'math.ops.l3.add-sub-1000', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Письмове додавання/віднімання в межах 1000', grade_band: 'L3', prerequisites: ['math.ops.l2.add-sub-carry-100', 'math.count.l3.numbers-1000'], orn: ['3 МАО 4.3', '3 МАО 3.4'], sort: 460 },
  { id: 'math.ops.l4.mult-div-multidigit', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Множення/ділення багатоцифрових чисел на одноцифрове', grade_band: 'L4', prerequisites: ['math.ops.l2.division-table', 'math.ops.l3.add-sub-1000'], sort: 470 },
  { id: 'math.ops.l3.equations-simple', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Рівняння з одним невідомим (на +/-, ×/÷)', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-table-4-9'], orn: ['3 МАО 4.8'], sort: 480 },
  { id: 'math.ops.l3.fractions-part-whole', subject: 'math', strand: 'Дії з числами', topic: 'Дроби', title: 'Дроби: частина від цілого (ознайомлення)', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-table-4-9'], orn: ['3 МАО 4.1', '3 МАО 4.2'], sort: 490 },
  { id: 'math.ops.l2.order-of-operations', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Порядок дій у виразах з дужками', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-100'], orn: ['2 МАО 4.3'], sort: 500 },
  { id: 'math.ops.l3.word-problems-1000', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Текстові задачі на 2–3 дії в межах 1000', grade_band: 'L3', prerequisites: ['math.ops.l3.equations-simple'], orn: ['3 МАО 2.1', '3 МАО 2.2'], sort: 510 },
  { id: 'math.measure.l4.area', subject: 'math', strand: 'Величини', topic: 'Периметр і площа', title: 'Площа прямокутника (у квадратних одиницях)', grade_band: 'L4', prerequisites: ['math.measure.l2.perimeter'], sort: 520 },
  { id: 'math.measure.l3.named-numbers-convert', subject: 'math', strand: 'Величини', topic: 'Вимірювання', title: 'Перетворення іменованих чисел (довжина/маса/час)', grade_band: 'L3', prerequisites: ['math.measure.l1.length-units', 'math.measure.l1.mass-units', 'math.measure.l2.time-units'], orn: ['3 МАО 4.3', '3 МАО 4.7'], sort: 530 },
  { id: 'math.measure.l3.money', subject: 'math', strand: 'Величини', topic: 'Гроші', title: 'Гроші: гривні й копійки, дії з грошима', grade_band: 'L3', prerequisites: ['math.ops.l3.add-sub-1000'], sort: 540 },
  { id: 'math.geom.l4.angles', subject: 'math', strand: 'Геометрія', topic: 'Кути', title: 'Кути: прямий, гострий, тупий (розпізнавання)', grade_band: 'L4', prerequisites: ['math.geom.l2.polygon-classify'], sort: 550 },
  { id: 'math.geom.l4.symmetry', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Симетрія фігур', grade_band: 'L4', prerequisites: ['math.geom.l1.flat-shapes'], sort: 560 },
  { id: 'math.data.l3.line-charts', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Лінійні діаграми і аналіз таблиць даних', grade_band: 'L3', prerequisites: ['math.data.l2.charts'], orn: ['3 МАО 2.1'], sort: 570 },

  // нові навички 3 класу за програмою Савченко 3–4 (11.10.2026; OCR скану — коди звірити з PDF)
  { id: 'math.ops.l3.mult-div-nontable-100', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Позатабличне множення й ділення в межах 100; ×/÷ на 10', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-table-4-9', 'math.ops.l2.division-table'], orn: ['3 МАО 4.3'], sort: 3501 },
  { id: 'math.ops.l3.division-remainder', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Ділення з остачею (остача менша за дільник)', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-table-4-9', 'math.ops.l2.division-table'], orn: ['3 МАО 4.3'], sort: 3502 },
  { id: 'math.ops.l3.fraction-parts', subject: 'math', strand: 'Дії з числами', topic: 'Дроби', title: 'Чисельник і знаменник; частина від числа й число за частиною', grade_band: 'L3', prerequisites: ['math.ops.l3.fractions-part-whole', 'math.ops.l3.mult-table-4-9'], orn: ['3 МАО 4.1', '3 МАО 4.2', '3 МАО 4.3'], sort: 3503 },
  { id: 'math.ops.l3.inequality-variable', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Нерівності зі змінною: підбір розвʼязків', grade_band: 'L3', prerequisites: ['math.ops.l2.letter-expressions', 'math.count.l3.compare-1000'], orn: ['3 МАО 4.8'], sort: 3504 },
  { id: 'math.measure.l3.related-quantities', subject: 'math', strand: 'Величини', topic: 'Величини', title: 'Ціна — кількість — вартість; робота (за двома знайти третю)', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-table-4-9'], orn: ['3 МАО 1.2'], sort: 3505 },
  { id: 'math.measure.l3.time-span', subject: 'math', strand: 'Величини', topic: 'Час', title: 'Час: початок, тривалість, кінець; секунда', grade_band: 'L3', prerequisites: ['math.measure.l2.time-units'], orn: ['3 МАО 4.7'], sort: 3506 },
  { id: 'math.ops.l3.problem-types', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Задачі на зведення до одиниці й четверте пропорційне', grade_band: 'L3', prerequisites: ['math.ops.l3.word-problems-1000', 'math.ops.l2.times-more-less'], orn: ['3 МАО 2.3'], sort: 3507 },
  { id: 'math.geom.l3.compass-circle', subject: 'math', strand: 'Геометрія', topic: 'Коло', title: 'Коло: центр, радіус, діаметр; побудова циркулем', grade_band: 'L3', prerequisites: ['math.geom.l2.circle-vs-disc'], orn: ['3 МАО 4.5', '3 МАО 4.6'], sort: 3508 },
  // ============================================================
  // L4 — 4 клас (12 skills)
  // ============================================================
  { id: 'math.count.l4.numbers-beyond-1000', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Розряди понад 1000 (десятки й сотні тисяч)', grade_band: 'L4', prerequisites: ['math.count.l3.numbers-1000'], sort: 580 },
  { id: 'math.count.l4.compare-large', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння багатоцифрових чисел', grade_band: 'L4', prerequisites: ['math.count.l4.numbers-beyond-1000'], sort: 590 },
  { id: 'math.ops.l4.written-mult-2digit', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Письмове множення на двоцифрове число', grade_band: 'L4', prerequisites: ['math.ops.l4.mult-div-multidigit', 'math.count.l4.numbers-beyond-1000'], sort: 600 },
  { id: 'math.ops.l4.written-div-2digit', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Письмове ділення на двоцифрове число', grade_band: 'L4', prerequisites: ['math.ops.l4.written-mult-2digit'], sort: 610 },
  { id: 'math.ops.l4.fractions-operations', subject: 'math', strand: 'Дії з числами', topic: 'Дроби', title: 'Дроби: порівняння, додавання й віднімання з однаковим знаменником', grade_band: 'L4', prerequisites: ['math.ops.l3.fractions-part-whole'], sort: 620 },
  { id: 'math.ops.l4.combined-expressions', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Комбіновані вирази (кілька дій, дужки, дроби)', grade_band: 'L4', prerequisites: ['math.ops.l2.order-of-operations', 'math.ops.l4.written-div-2digit'], sort: 630 },
  { id: 'math.ops.l4.equations-advanced', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Рівняння з кількома діями', grade_band: 'L4', prerequisites: ['math.ops.l3.equations-simple', 'math.ops.l4.combined-expressions'], sort: 640 },
  { id: 'math.ops.l4.word-problems-advanced', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Текстові задачі підвищеної складності (рух, робота, вартість)', grade_band: 'L4', prerequisites: ['math.ops.l4.combined-expressions'], sort: 650 },
  { id: 'math.geom.l4.coordinate-plane', subject: 'math', strand: 'Геометрія', topic: 'Координатна площина', title: 'Координатна площина (пропедевтика)', grade_band: 'L4', prerequisites: ['math.geom.l4.angles'], sort: 660 },
  { id: 'math.geom.l4.shape-construction', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Побудова фігур за заданими розмірами (лінійка, косинець)', grade_band: 'L4', prerequisites: ['math.geom.l4.symmetry'], sort: 670 },
  { id: 'math.data.l4.data-analysis', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Аналіз даних: середнє значення, порівняння наборів', grade_band: 'L4', prerequisites: ['math.data.l3.line-charts'], sort: 680 },
  { id: 'math.measure.l4.speed-time-distance', subject: 'math', strand: 'Величини', topic: 'Швидкість і рух', title: 'Величини руху: швидкість, час, відстань', grade_band: 'L4', prerequisites: ['math.measure.l3.named-numbers-convert', 'math.ops.l4.written-mult-2digit'], sort: 690 },
];
