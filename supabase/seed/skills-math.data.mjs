// AUTO-DERIVED 1:1 from src/school/skills-math.ts (same array, no TS types) —
// so this ESM file stays dependency-free for the Node seeder (no ts-node/tsx needed).
// Regenerate whenever skills-math.ts changes: see scratchpad gen-skills-data.mjs
// (or just hand-sync — the array literal is plain JS, only the surrounding
// export/type lines differ between the two files).

export const MATH_SKILLS = [
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
  { id: 'math.count.l1.forward-back-1-10', subject: 'math', strand: 'Числа й лічба', topic: 'Лічба', title: 'Пряма й зворотна лічба в межах 10', grade_band: 'L1', prerequisites: ['math.count.l0.forward-1-5'], sort: 110 },
  { id: 'math.count.l1.numeral-writing', subject: 'math', strand: 'Числа й лічба', topic: 'Цифри', title: 'Написання цифр 0–9', grade_band: 'L1', prerequisites: ['math.count.l0.digits-1-5'], sort: 120 },
  { id: 'math.count.l1.ordinal-1-10', subject: 'math', strand: 'Числа й лічба', topic: 'Лічба', title: 'Порядкова лічба (перший–десятий)', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], sort: 130 },
  { id: 'math.count.l1.compose-10', subject: 'math', strand: 'Числа й лічба', topic: 'Склад числа', title: 'Склад числа 10', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], sort: 140 },
  { id: 'math.count.l1.neighbors', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Сусідні числа (попереднє/наступне)', grade_band: 'L1', prerequisites: ['math.count.l1.forward-back-1-10'], sort: 150 },
  { id: 'math.count.l1.numbers-11-20', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Нумерація 11–20, розряди (десяток і одиниці)', grade_band: 'L1', prerequisites: ['math.count.l1.compose-10'], sort: 160 },
  { id: 'math.count.l1.compare-numbers-20', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння чисел у межах 20', grade_band: 'L1', prerequisites: ['math.count.l1.numbers-11-20'], sort: 170 },
  { id: 'math.ops.l1.add-sub-objects-10', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання в межах 10 на предметах', grade_band: 'L1', prerequisites: ['math.count.l1.compose-10'], sort: 180 },
  { id: 'math.ops.l1.compose-decompose-20', subject: 'math', strand: 'Дії з числами', topic: 'Склад числа', title: 'Склад чисел другого десятка (10+n)', grade_band: 'L1', prerequisites: ['math.count.l1.numbers-11-20'], sort: 190 },
  { id: 'math.ops.l1.add-sub-no-carry-20', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання без переходу через розряд (межа 20)', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-objects-10', 'math.count.l1.numbers-11-20'], sort: 200 },
  { id: 'math.ops.l2.add-sub-carry-20', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання з переходом через розряд (межа 20)', grade_band: 'L1', prerequisites: ['math.ops.l1.add-sub-no-carry-20'], sort: 210 },
  { id: 'math.ops.l1.word-problems-simple', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Прості текстові задачі (на +/- у межах 20)', grade_band: 'L1', prerequisites: ['math.ops.l2.add-sub-carry-20'], sort: 220 },
  { id: 'math.measure.l1.length-compare', subject: 'math', strand: 'Величини', topic: 'Довжина', title: 'Порівняння довжини накладанням і на око', grade_band: 'L1', prerequisites: ['math.measure.l0.long-short'], sort: 230 },
  { id: 'math.measure.l1.space-time', subject: 'math', strand: 'Величини', topic: 'Час і простір', title: 'Просторові й часові поняття (зверху/знизу, вчора/сьогодні/завтра)', grade_band: 'L1', prerequisites: [], sort: 240 },
  { id: 'math.measure.l1.measure-intro', subject: 'math', strand: 'Величини', topic: 'Вимірювання', title: 'Ознайомлення з одиницями вимірювання (см, кг, хв)', grade_band: 'L1', prerequisites: ['math.measure.l1.length-compare'], sort: 250 },
  { id: 'math.geom.l1.flat-shapes', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Плоскі фігури: круг, квадрат, трикутник, прямокутник, овал', grade_band: 'L1', prerequisites: ['math.geom.l0.shapes-basic'], sort: 260 },
  { id: 'math.geom.l1.spatial-shapes', subject: 'math', strand: 'Геометрія', topic: 'Просторові фігури', title: 'Просторові фігури: куля, куб, циліндр (ознайомлення)', grade_band: 'L1', prerequisites: ['math.geom.l0.shapes-basic'], sort: 270 },
  { id: 'math.geom.l1.shape-properties', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Властивості фігур: кути і сторони (ознайомлення)', grade_band: 'L1', prerequisites: ['math.geom.l1.flat-shapes'], sort: 280 },
  { id: 'math.data.l1.simple-charts', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Прості таблиці й піктограми (читання)', grade_band: 'L1', prerequisites: ['math.count.l1.compare-numbers-20'], sort: 290 },

  // ============================================================
  // L2 — 2 клас (14 skills)
  // ============================================================
  { id: 'math.count.l1.numbers-100', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Нумерація в межах 100, розряди (десятки й одиниці)', grade_band: 'L2', prerequisites: ['math.count.l1.numbers-11-20'], sort: 300 },
  { id: 'math.count.l1.compare-100', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння й впорядкування чисел до 100', grade_band: 'L2', prerequisites: ['math.count.l1.numbers-100'], sort: 310 },
  { id: 'math.ops.l2.add-sub-no-carry-100', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання без переходу через розряд до 100', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-20', 'math.count.l1.numbers-100'], sort: 320 },
  { id: 'math.ops.l2.add-sub-carry-100', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Додавання/віднімання з переходом через розряд до 100', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-no-carry-100'], sort: 330 },
  { id: 'math.ops.l2.mult-table-2-3', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Таблиця множення 2, 3, 4, 5', grade_band: 'L2', prerequisites: ['math.ops.l2.add-sub-carry-100'], sort: 340 },
  { id: 'math.ops.l3.mult-table-4-9', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Таблиця множення 6, 7, 8, 9', grade_band: 'L2', prerequisites: ['math.ops.l2.mult-table-2-3'], sort: 350 },
  { id: 'math.ops.l2.division-table', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Табличне ділення (у межах вивченої таблиці множення)', grade_band: 'L2', prerequisites: ['math.ops.l3.mult-table-4-9'], sort: 360 },
  { id: 'math.ops.l2.word-problems-100', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Текстові задачі на 4 дії в межах 100', grade_band: 'L2', prerequisites: ['math.ops.l2.division-table'], sort: 370 },
  { id: 'math.measure.l1.length-units', subject: 'math', strand: 'Величини', topic: 'Довжина', title: 'Довжина: сантиметр, дециметр, метр — вимірювання', grade_band: 'L2', prerequisites: ['math.measure.l1.measure-intro'], sort: 380 },
  { id: 'math.measure.l1.mass-units', subject: 'math', strand: 'Величини', topic: 'Маса', title: 'Маса: кілограм — вимірювання', grade_band: 'L2', prerequisites: ['math.measure.l1.measure-intro'], sort: 390 },
  { id: 'math.measure.l2.time-units', subject: 'math', strand: 'Величини', topic: 'Час', title: 'Час: години, хвилини, доба, тиждень', grade_band: 'L2', prerequisites: ['math.measure.l1.space-time'], sort: 400 },
  { id: 'math.measure.l2.perimeter', subject: 'math', strand: 'Величини', topic: 'Периметр і площа', title: 'Периметр многокутника', grade_band: 'L2', prerequisites: ['math.geom.l1.flat-shapes', 'math.ops.l2.add-sub-carry-100'], sort: 410 },
  { id: 'math.geom.l2.polygon-classify', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Класифікація многокутників за кількістю сторін', grade_band: 'L2', prerequisites: ['math.geom.l1.shape-properties'], sort: 420 },
  { id: 'math.data.l2.charts', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Стовпчикові діаграми (читання і побудова)', grade_band: 'L2', prerequisites: ['math.data.l1.simple-charts'], sort: 430 },

  // ============================================================
  // L3 — 3 клас (14 skills)
  // ============================================================
  { id: 'math.count.l3.numbers-1000', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Нумерація в межах 1000, розряди (сотні/десятки/одиниці)', grade_band: 'L3', prerequisites: ['math.count.l1.numbers-100'], sort: 440 },
  { id: 'math.count.l3.compare-1000', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння й впорядкування чисел до 1000', grade_band: 'L3', prerequisites: ['math.count.l3.numbers-1000'], sort: 450 },
  { id: 'math.ops.l3.add-sub-1000', subject: 'math', strand: 'Дії з числами', topic: 'Додавання і віднімання', title: 'Письмове додавання/віднімання в межах 1000', grade_band: 'L3', prerequisites: ['math.ops.l2.add-sub-carry-100', 'math.count.l3.numbers-1000'], sort: 460 },
  { id: 'math.ops.l3.mult-div-multidigit', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Множення/ділення багатоцифрових чисел на одноцифрове', grade_band: 'L3', prerequisites: ['math.ops.l2.division-table', 'math.ops.l3.add-sub-1000'], sort: 470 },
  { id: 'math.ops.l3.equations-simple', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Рівняння з одним невідомим (на +/-, ×/÷)', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-div-multidigit'], sort: 480 },
  { id: 'math.ops.l3.fractions-part-whole', subject: 'math', strand: 'Дії з числами', topic: 'Дроби', title: 'Дроби: частина від цілого (ознайомлення)', grade_band: 'L3', prerequisites: ['math.ops.l3.mult-div-multidigit'], sort: 490 },
  { id: 'math.ops.l2.order-of-operations', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Порядок дій у виразах з дужками', grade_band: 'L3', prerequisites: ['math.ops.l3.add-sub-1000'], sort: 500 },
  { id: 'math.ops.l3.word-problems-1000', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Текстові задачі на 2–3 дії в межах 1000', grade_band: 'L3', prerequisites: ['math.ops.l3.equations-simple'], sort: 510 },
  { id: 'math.measure.l3.area', subject: 'math', strand: 'Величини', topic: 'Периметр і площа', title: 'Площа прямокутника (у квадратних одиницях)', grade_band: 'L3', prerequisites: ['math.measure.l2.perimeter'], sort: 520 },
  { id: 'math.measure.l3.named-numbers-convert', subject: 'math', strand: 'Величини', topic: 'Вимірювання', title: 'Перетворення іменованих чисел (довжина/маса/час)', grade_band: 'L3', prerequisites: ['math.measure.l1.length-units', 'math.measure.l1.mass-units', 'math.measure.l2.time-units'], sort: 530 },
  { id: 'math.measure.l3.money', subject: 'math', strand: 'Величини', topic: 'Гроші', title: 'Гроші: гривні й копійки, дії з грошима', grade_band: 'L3', prerequisites: ['math.ops.l3.add-sub-1000'], sort: 540 },
  { id: 'math.geom.l3.angles', subject: 'math', strand: 'Геометрія', topic: 'Кути', title: 'Кути: прямий, гострий, тупий (розпізнавання)', grade_band: 'L3', prerequisites: ['math.geom.l2.polygon-classify'], sort: 550 },
  { id: 'math.geom.l3.symmetry', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Симетрія фігур', grade_band: 'L3', prerequisites: ['math.geom.l1.flat-shapes'], sort: 560 },
  { id: 'math.data.l3.line-charts', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Лінійні діаграми і аналіз таблиць даних', grade_band: 'L3', prerequisites: ['math.data.l2.charts'], sort: 570 },

  // ============================================================
  // L4 — 4 клас (12 skills)
  // ============================================================
  { id: 'math.count.l4.numbers-beyond-1000', subject: 'math', strand: 'Числа й лічба', topic: 'Нумерація', title: 'Розряди понад 1000 (десятки й сотні тисяч)', grade_band: 'L4', prerequisites: ['math.count.l3.numbers-1000'], sort: 580 },
  { id: 'math.count.l4.compare-large', subject: 'math', strand: 'Числа й лічба', topic: 'Порівняння', title: 'Порівняння багатоцифрових чисел', grade_band: 'L4', prerequisites: ['math.count.l4.numbers-beyond-1000'], sort: 590 },
  { id: 'math.ops.l4.written-mult-2digit', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Письмове множення на двоцифрове число', grade_band: 'L4', prerequisites: ['math.ops.l3.mult-div-multidigit', 'math.count.l4.numbers-beyond-1000'], sort: 600 },
  { id: 'math.ops.l4.written-div-2digit', subject: 'math', strand: 'Дії з числами', topic: 'Множення і ділення', title: 'Письмове ділення на двоцифрове число', grade_band: 'L4', prerequisites: ['math.ops.l4.written-mult-2digit'], sort: 610 },
  { id: 'math.ops.l4.fractions-operations', subject: 'math', strand: 'Дії з числами', topic: 'Дроби', title: 'Дроби: порівняння, додавання й віднімання з однаковим знаменником', grade_band: 'L4', prerequisites: ['math.ops.l3.fractions-part-whole'], sort: 620 },
  { id: 'math.ops.l4.combined-expressions', subject: 'math', strand: 'Дії з числами', topic: 'Вирази', title: 'Комбіновані вирази (кілька дій, дужки, дроби)', grade_band: 'L4', prerequisites: ['math.ops.l2.order-of-operations', 'math.ops.l4.written-div-2digit'], sort: 630 },
  { id: 'math.ops.l4.equations-advanced', subject: 'math', strand: 'Дії з числами', topic: 'Рівняння', title: 'Рівняння з кількома діями', grade_band: 'L4', prerequisites: ['math.ops.l3.equations-simple', 'math.ops.l4.combined-expressions'], sort: 640 },
  { id: 'math.ops.l4.word-problems-advanced', subject: 'math', strand: 'Дії з числами', topic: 'Текстові задачі', title: 'Текстові задачі підвищеної складності (рух, робота, вартість)', grade_band: 'L4', prerequisites: ['math.ops.l4.combined-expressions'], sort: 650 },
  { id: 'math.geom.l4.coordinate-plane', subject: 'math', strand: 'Геометрія', topic: 'Координатна площина', title: 'Координатна площина (пропедевтика)', grade_band: 'L4', prerequisites: ['math.geom.l3.angles'], sort: 660 },
  { id: 'math.geom.l4.shape-construction', subject: 'math', strand: 'Геометрія', topic: 'Плоскі фігури', title: 'Побудова фігур за заданими розмірами (лінійка, косинець)', grade_band: 'L4', prerequisites: ['math.geom.l3.symmetry'], sort: 670 },
  { id: 'math.data.l4.data-analysis', subject: 'math', strand: 'Робота з даними', topic: 'Таблиці і діаграми', title: 'Аналіз даних: середнє значення, порівняння наборів', grade_band: 'L4', prerequisites: ['math.data.l3.line-charts'], sort: 680 },
  { id: 'math.measure.l4.speed-time-distance', subject: 'math', strand: 'Величини', topic: 'Швидкість і рух', title: 'Величини руху: швидкість, час, відстань', grade_band: 'L4', prerequisites: ['math.measure.l3.named-numbers-convert', 'math.ops.l4.written-mult-2digit'], sort: 690 },
];
