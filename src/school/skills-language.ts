// Seed skill-graph: українська мова L0–L4 (задача L1, гілка feat/mvp-redesign-roles).
// Grade bands: L0=дошкілля 3–4 · L1=дошкілля 5–6 + 1 клас · L2=2 клас · L3=3 клас · L4=4 клас.
// prerequisites — строгий DAG (skill залежить від prerequisite; prerequisite завжди
// того самого або раннішого grade_band). Перевіряється тестом skills-language.test.ts
// (topo-sort, та сама логіка, що в supabase/seed/seed-skills.mjs для математики).
//
// Педагогічна основа: мовно-літературна галузь (МОВ) НУШ початкової школи.
// Українська орфографія трактується як прозора (фонематична) — без запозичень зі
// структур англомовних програм читання (sight words, фонологічні фази тощо).
// ⚠️ Атрибуція конкретній типовій програмі свідомо НЕ вказана: посилання на автора
// програми не верифіковано першоджерелом. Порядок тем звірити з чинною типовою
// освітньою програмою ПЕРЕД seed у prod (разом із заповненням orn_refs).
//
// НУШ-атрибути: galuzey='МОВ' для всіх; cycle: null (L0) · 1 (L1–L2) · 2 (L3–L4).
// orn_refs свідомо НЕ заповнено — точні коди ОРН ще не витягнуті з держстандарту,
// вигадувати їх заборонено (заповнить окрема задача мапінгу).
//
// ⚠️ Дзеркало для сидера (supabase/seed/skills-language.data.mjs) — окрема задача,
// цей файл її не створює.

import type { GradeBand, NushGaluz } from './types';

export interface SeedSkill {
  id: string;
  subject: 'language';
  strand: string;
  topic: string;
  title: string;
  grade_band: GradeBand;
  prerequisites: string[];
  mastery_threshold?: number;
  review_interval_days?: number;
  /** Коди очікуваних результатів МОН (програма Савченко), напр. '1 МОВ 4.1'. */
  orn?: string[];
  sort?: number;
  galuzey: NushGaluz;
  cycle: 1 | 2 | null;
}

export const LANGUAGE_SKILLS: SeedSkill[] = [
  // ============================================================
  // L0 — дошкілля 3–4 (9 skills)
  // ============================================================
  { id: 'language.sounds.l0.rhyme-awareness', subject: 'language', strand: 'Звуки і букви', topic: 'Фонематичний слух', title: 'Розпізнавання рими на слух', grade_band: 'L0', prerequisites: [], galuzey: 'МОВ', cycle: null, sort: 10 },
  { id: 'language.sounds.l0.syllable-clap', subject: 'language', strand: 'Звуки і букви', topic: 'Склад', title: 'Поділ слова на склади оплесками (на слух)', grade_band: 'L0', prerequisites: [], galuzey: 'МОВ', cycle: null, sort: 20 },
  { id: 'language.sounds.l0.first-sound', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки', title: 'Виділення першого звука в слові (на слух)', grade_band: 'L0', prerequisites: ['language.sounds.l0.syllable-clap'], galuzey: 'МОВ', cycle: null, sort: 30 },
  { id: 'language.word.l0.vocabulary-objects', subject: 'language', strand: 'Слово', topic: 'Словник', title: 'Називання предметів і дій (розширення активного словника)', grade_band: 'L0', prerequisites: [], galuzey: 'МОВ', cycle: null, sort: 40 },
  { id: 'language.word.l0.generalize-words', subject: 'language', strand: 'Слово', topic: 'Словник', title: 'Узагальнювальні слова (посуд, одяг, іграшки, тварини)', grade_band: 'L0', prerequisites: ['language.word.l0.vocabulary-objects'], galuzey: 'МОВ', cycle: null, sort: 50 },
  { id: 'language.text.l0.full-sentence-answer', subject: 'language', strand: 'Речення і текст', topic: 'Усне мовлення', title: 'Відповідь повним реченням на запитання дорослого', grade_band: 'L0', prerequisites: [], galuzey: 'МОВ', cycle: null, sort: 60 },
  { id: 'language.text.l0.retell-picture', subject: 'language', strand: 'Речення і текст', topic: 'Усне мовлення', title: 'Переказ за картинкою (2–3 речення)', grade_band: 'L0', prerequisites: ['language.text.l0.full-sentence-answer'], galuzey: 'МОВ', cycle: null, sort: 70 },
  { id: 'language.reading.l0.listen-comprehend', subject: 'language', strand: 'Читання', topic: 'Слухання', title: 'Розуміння прослуханої казки чи оповідання', grade_band: 'L0', prerequisites: [], galuzey: 'МОВ', cycle: null, sort: 80 },
  { id: 'language.reading.l0.book-orientation', subject: 'language', strand: 'Читання', topic: 'Робота з книгою', title: 'Орієнтація в книзі (обкладинка, сторінки, ілюстрації)', grade_band: 'L0', prerequisites: [], galuzey: 'МОВ', cycle: null, sort: 90 },

  // ============================================================
  // L1 — дошкілля 5–6 + 1 клас (15 skills)
  // ============================================================
  { id: 'language.sounds.l1.vowels-consonants', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки мовлення', title: 'Голосні і приголосні звуки (розрізнення)', grade_band: 'L1', prerequisites: ['language.sounds.l0.first-sound'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 100 },
  { id: 'language.sounds.l1.hard-soft-consonants', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки мовлення', title: 'Тверді і мʼякі приголосні звуки', grade_band: 'L1', prerequisites: ['language.sounds.l1.vowels-consonants'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 110 },
  { id: 'language.sounds.l1.letter-sound-match', subject: 'language', strand: 'Звуки і букви', topic: 'Букви', title: 'Відповідність звука і букви (позначення звуків буквами)', grade_band: 'L1', prerequisites: ['language.sounds.l1.vowels-consonants'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 120 },
  { id: 'language.sounds.l1.alphabet', subject: 'language', strand: 'Звуки і букви', topic: 'Алфавіт', title: 'Алфавітні назви букв', grade_band: 'L1', prerequisites: ['language.sounds.l1.letter-sound-match'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 130 },
  { id: 'language.sounds.l1.syllable-division', subject: 'language', strand: 'Звуки і букви', topic: 'Склад', title: 'Поділ слова на склади за голосними буквами', grade_band: 'L1', prerequisites: ['language.sounds.l0.syllable-clap', 'language.sounds.l1.vowels-consonants'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 140 },
  { id: 'language.sounds.l1.stress', subject: 'language', strand: 'Звуки і букви', topic: 'Наголос', title: 'Наголос у слові (визначення наголошеного складу)', grade_band: 'L1', prerequisites: ['language.sounds.l1.syllable-division'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 150 },
  { id: 'language.reading.l1.syllable-reading', subject: 'language', strand: 'Читання', topic: 'Техніка читання', title: 'Читання складів', grade_band: 'L1', prerequisites: ['language.sounds.l1.letter-sound-match'], galuzey: 'МОВ', cycle: 1, sort: 160 },
  { id: 'language.reading.l1.word-reading', subject: 'language', strand: 'Читання', topic: 'Техніка читання', title: 'Читання слів', grade_band: 'L1', prerequisites: ['language.reading.l1.syllable-reading'], galuzey: 'МОВ', cycle: 1, sort: 170 },
  { id: 'language.reading.l1.sentence-reading', subject: 'language', strand: 'Читання', topic: 'Техніка читання', title: 'Читання речень і коротких текстів', grade_band: 'L1', prerequisites: ['language.reading.l1.word-reading'], galuzey: 'МОВ', cycle: 1, sort: 180 },
  { id: 'language.reading.l1.comprehension-simple', subject: 'language', strand: 'Читання', topic: 'Розуміння прочитаного', title: 'Відповіді на запитання за простим текстом', grade_band: 'L1', prerequisites: ['language.reading.l1.sentence-reading'], galuzey: 'МОВ', cycle: 1, sort: 190 },
  { id: 'language.word.l1.word-vs-sentence', subject: 'language', strand: 'Слово', topic: 'Слово і речення', title: 'Розрізнення слова і речення', grade_band: 'L1', prerequisites: ['language.word.l0.vocabulary-objects'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 200 },
  { id: 'language.text.l1.simple-sentence', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Складання простого речення зі слів', grade_band: 'L1', prerequisites: ['language.word.l1.word-vs-sentence'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 210 },
  { id: 'language.orth.l1.capital-sentence-start', subject: 'language', strand: 'Орфографія', topic: 'Велика літера', title: 'Велика літера на початку речення', grade_band: 'L1', prerequisites: ['language.text.l1.simple-sentence'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 220 },
  { id: 'language.orth.l1.end-punctuation', subject: 'language', strand: 'Орфографія', topic: 'Розділові знаки', title: 'Розповідні, питальні, окличні речення: інтонація і знак у кінці', grade_band: 'L1', prerequisites: ['language.text.l1.simple-sentence'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 230 },
  { id: 'language.orth.l1.capital-names', subject: 'language', strand: 'Орфографія', topic: 'Велика літера', title: 'Велика літера в іменах людей і кличках тварин', grade_band: 'L1', prerequisites: ['language.orth.l1.capital-sentence-start'], galuzey: 'МОВ', cycle: 1, sort: 240 },

  // нові навички 1 класу за програмою Савченко (11.10.2026)
  { id: 'language.sounds.l1.sound-change-word', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки', title: 'Заміна одного звука змінює слово (кіт — кит)', grade_band: 'L1', prerequisites: ['language.sounds.l1.vowels-consonants'], orn: ['1 МОВ 4.1', '1 МОВ 4.2'], sort: 251, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l1.word-questions', subject: 'language', strand: 'Слово', topic: 'Слова-назви', title: 'Слова-назви предметів, ознак, дій, чисел: хто? що? який? що робить? скільки?', grade_band: 'L1', prerequisites: ['language.word.l1.word-vs-sentence'], orn: ['1 МОВ 4.1'], sort: 252, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.text.l1.words-in-sentence', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Кількість слів у реченні (1–4); доповнити речення словом', grade_band: 'L1', prerequisites: ['language.text.l1.simple-sentence'], orn: ['1 МОВ 4.1'], sort: 253, galuzey: 'МОВ', cycle: 1 },

  // ============================================================
  // L2 — 2 клас (15 skills)
  // ============================================================
  { id: 'language.sounds.l1.voiced-voiceless', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки мовлення', title: 'Дзвінкі й глухі приголосні: розрізнення і вимова', grade_band: 'L1', prerequisites: ['language.sounds.l1.hard-soft-consonants'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 250 },
  { id: 'language.sounds.l3.stress-unstressed-vowels-intro', subject: 'language', strand: 'Звуки і букви', topic: 'Наголос', title: 'Наголошені й ненаголошені голосні звуки (ознайомлення)', grade_band: 'L3', prerequisites: ['language.sounds.l1.stress'], galuzey: 'МОВ', cycle: 2, sort: 260 },
  { id: 'language.orth.l2.after-sibilants', subject: 'language', strand: 'Орфографія', topic: 'Буквосполучення', title: 'Букви а, у після шиплячих (ча, ща, чу, щу)', grade_band: 'L2', prerequisites: ['language.sounds.l1.letter-sound-match'], galuzey: 'МОВ', cycle: 1, sort: 270 },
  { id: 'language.orth.l2.soft-sign', subject: 'language', strand: 'Орфографія', topic: 'Мʼякий знак', title: 'Мʼякий знак для позначення мʼякості приголосних', grade_band: 'L2', prerequisites: ['language.sounds.l1.hard-soft-consonants'], galuzey: 'МОВ', cycle: 1, sort: 280 },
  { id: 'language.orth.l2.capital-geo-names', subject: 'language', strand: 'Орфографія', topic: 'Велика літера', title: 'Велика літера в географічних назвах (міста, села, річки, країни)', grade_band: 'L2', prerequisites: ['language.orth.l1.capital-names'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1'], sort: 290 },
  { id: 'language.word.l1.synonyms-antonyms', subject: 'language', strand: 'Слово', topic: 'Лексика', title: 'Близькі й протилежні за значенням слова', grade_band: 'L1', prerequisites: ['language.word.l1.word-vs-sentence'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1'], sort: 300 },
  { id: 'language.word.l1.multiple-meaning', subject: 'language', strand: 'Слово', topic: 'Лексика', title: 'Слова, що мають кілька значень', grade_band: 'L1', prerequisites: ['language.word.l1.synonyms-antonyms'], galuzey: 'МОВ', cycle: 1, orn: ['1 МОВ 4.1', '1 МОВ 4.2'], sort: 310 },
  { id: 'language.word.l3.related-words-root', subject: 'language', strand: 'Слово', topic: 'Будова слова', title: 'Споріднені (однокореневі) слова та корінь слова (ознайомлення)', grade_band: 'L3', prerequisites: ['language.word.l1.word-vs-sentence'], galuzey: 'МОВ', cycle: 2, sort: 320 },
  { id: 'language.word.l2.noun-intro', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Іменник: назва предмета (ознайомлення)', grade_band: 'L2', prerequisites: ['language.word.l1.word-vs-sentence'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1'], sort: 330 },
  { id: 'language.word.l2.adjective-intro', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Прикметник: ознака предмета (ознайомлення)', grade_band: 'L2', prerequisites: ['language.word.l2.noun-intro'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1'], sort: 340 },
  { id: 'language.word.l2.verb-intro', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Дієслово: дія предмета (ознайомлення)', grade_band: 'L2', prerequisites: ['language.word.l2.noun-intro'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1'], sort: 350 },
  { id: 'language.text.l2.sentence-types-purpose', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Види речень за метою висловлювання: розповідне, питальне, спонукальне', grade_band: 'L2', prerequisites: ['language.text.l1.simple-sentence'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.2'], sort: 360 },
  { id: 'language.text.l2.title-topic', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'Текст: заголовок і тема', grade_band: 'L2', prerequisites: ['language.reading.l1.comprehension-simple'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1', '2 МОВ 4.2'], sort: 370 },
  { id: 'language.reading.l2.fluent-reading', subject: 'language', strand: 'Читання', topic: 'Техніка читання', title: 'Свідоме й правильне читання вголос', grade_band: 'L2', prerequisites: ['language.reading.l1.comprehension-simple'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 2.1'], sort: 380 },
  { id: 'language.reading.l2.retell-text', subject: 'language', strand: 'Читання', topic: 'Розуміння прочитаного', title: 'Переказ прочитаного тексту за питаннями', grade_band: 'L2', prerequisites: ['language.reading.l2.fluent-reading'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 1.2', '2 МОВ 2.2'], sort: 390 },

  // нові навички 2 класу за програмою Савченко (11.10.2026)
  { id: 'language.sounds.l2.voiced-final', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки', title: 'Дзвінкі приголосні в кінці слова й перед глухим', grade_band: 'L2', prerequisites: ['language.sounds.l1.voiced-voiceless'], orn: ['2 МОВ 4.1'], sort: 351, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.orth.l2.hyphenation', subject: 'language', strand: 'Орфографія', topic: 'Перенос', title: 'Перенос слів складами', grade_band: 'L2', prerequisites: ['language.sounds.l1.syllable-division'], orn: ['2 МОВ 4.1'], sort: 352, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l2.alphabet-order', subject: 'language', strand: 'Слово', topic: 'Алфавіт', title: 'Розташувати 5–6 слів за алфавітом', grade_band: 'L2', prerequisites: ['language.sounds.l1.alphabet'], orn: ['2 МОВ 4.1'], sort: 353, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l2.plural', subject: 'language', strand: 'Слово', topic: 'Число', title: 'Один — багато: змінювання слів за числами', grade_band: 'L2', prerequisites: ['language.word.l1.word-questions'], orn: ['2 МОВ 4.1'], sort: 354, galuzey: 'МОВ', cycle: 1 },

  // нові навички 2 класу за програмою Савченко (11.10.2026, вечір)
  { id: 'language.reading.l2.silent-reading', subject: 'language', strand: 'Читання', topic: 'Читання', title: 'Читання мовчки', grade_band: 'L2', prerequisites: ['language.reading.l2.fluent-reading'], orn: ['2 МОВ 2.1'], sort: 2361, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.reading.l2.word-meaning', subject: 'language', strand: 'Читання', topic: 'Читання', title: 'Пряме й переносне значення; слово з контексту', grade_band: 'L2', prerequisites: ['language.reading.l1.comprehension-simple'], orn: ['2 МОВ 2.1', '2 МОВ 4.1'], sort: 2362, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.reading.l2.genres', subject: 'language', strand: 'Читання', topic: 'Читання', title: 'Казка, вірш, оповідання; художній і нехудожній текст', grade_band: 'L2', prerequisites: ['language.reading.l1.comprehension-simple'], orn: ['2 МОВ 2.1'], sort: 2363, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.reading.l2.book-parts', subject: 'language', strand: 'Читання', topic: 'Читання', title: 'Книжка: обкладинка, титул, зміст', grade_band: 'L2', prerequisites: ['language.reading.l0.book-orientation'], orn: ['2 МОВ 2.1'], sort: 2364, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.reading.l2.characters-events', subject: 'language', strand: 'Читання', topic: 'Читання', title: 'Персонажі, головний герой, порядок подій', grade_band: 'L2', prerequisites: ['language.reading.l1.comprehension-simple'], orn: ['2 МОВ 2.2'], sort: 2365, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.reading.l2.text-parts', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'Зачин, основна частина, кінцівка', grade_band: 'L2', prerequisites: ['language.text.l2.title-topic'], orn: ['2 МОВ 2.2', '2 МОВ 4.1'], sort: 2366, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.reading.l2.graphic-info', subject: 'language', strand: 'Читання', topic: 'Читання', title: 'Таблиця й схема в тексті', grade_band: 'L2', prerequisites: ['language.reading.l2.fluent-reading'], orn: ['2 МОВ 2.2', '2 МОВ 2.6'], sort: 2367, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l2.stress-meaning', subject: 'language', strand: 'Слово', topic: 'Наголос', title: 'Наголос змінює значення (замок — замок)', grade_band: 'L2', prerequisites: ['language.sounds.l1.stress'], orn: ['2 МОВ 4.2'], sort: 2368, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l2.phrases', subject: 'language', strand: 'Слово', topic: 'Словосполучення', title: 'Словосполучення: іменник + прикметник, числівник + іменник', grade_band: 'L2', prerequisites: ['language.word.l2.adjective-intro', 'language.word.l2.numeral-intro'], orn: ['2 МОВ 4.1', '2 МОВ 4.2'], sort: 2369, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l2.word-groups', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Групи слів за значенням і питаннями', grade_band: 'L2', prerequisites: ['language.word.l2.noun-intro', 'language.word.l2.verb-intro'], orn: ['2 МОВ 4.1'], sort: 2370, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.word.l2.function-words', subject: 'language', strand: 'Слово', topic: 'Службові слова', title: 'Службові слова пишемо окремо', grade_band: 'L2', prerequisites: ['language.text.l1.simple-sentence'], orn: ['2 МОВ 4.1'], sort: 2371, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.text.l2.extend-sentence', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Поширити речення; речення за малюнком', grade_band: 'L2', prerequisites: ['language.text.l1.simple-sentence'], orn: ['2 МОВ 4.2'], sort: 2372, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.text.l2.text-types', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'Текст-розповідь і текст-опис', grade_band: 'L2', prerequisites: ['language.text.l2.title-topic'], orn: ['2 МОВ 4.1', '2 МОВ 4.2'], sort: 2373, galuzey: 'МОВ', cycle: 1 },
  { id: 'language.text.l2.compose-text', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'Текст з 3–4 речень: порядок, без повторів', grade_band: 'L2', prerequisites: ['language.text.l2.extend-sentence'], orn: ['2 МОВ 3.1', '2 МОВ 3.3', '2 МОВ 4.2'], sort: 2374, galuzey: 'МОВ', cycle: 1 },
  // ============================================================
  // L3 — 3 клас (15 skills)
  // ============================================================
  { id: 'language.sounds.l3.unstressed-e-y-check', subject: 'language', strand: 'Звуки і букви', topic: 'Наголос', title: 'Ненаголошені [е], [и] в корені слова: перевірка наголосом', grade_band: 'L3', prerequisites: ['language.sounds.l3.stress-unstressed-vowels-intro'], galuzey: 'МОВ', cycle: 2, sort: 400 },
  { id: 'language.sounds.l3.doubled-consonants', subject: 'language', strand: 'Звуки і букви', topic: 'Звуки мовлення', title: 'Подовжені мʼякі приголосні звуки (знання, обличчя, стаття)', grade_band: 'L3', prerequisites: ['language.sounds.l1.voiced-voiceless'], galuzey: 'МОВ', cycle: 2, sort: 410 },
  { id: 'language.orth.l2.apostrophe', subject: 'language', strand: 'Орфографія', topic: 'Апостроф', title: 'Апостроф: вимова і запис', grade_band: 'L2', prerequisites: ['language.orth.l2.soft-sign'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1'], sort: 420 },
  { id: 'language.orth.l3.final-consonant-check', subject: 'language', strand: 'Орфографія', topic: 'Дзвінкі і глухі приголосні', title: 'Перевірка дзвінкого/глухого приголосного в кінці слова зміною форми (дуб — дуба)', grade_band: 'L3', prerequisites: ['language.sounds.l2.voiced-final'], galuzey: 'МОВ', cycle: 2, sort: 430 },
  { id: 'language.word.l3.word-structure', subject: 'language', strand: 'Слово', topic: 'Будова слова', title: 'Будова слова: корінь, префікс, суфікс, закінчення', grade_band: 'L3', prerequisites: ['language.word.l3.related-words-root'], galuzey: 'МОВ', cycle: 2, sort: 440 },
  { id: 'language.orth.l3.prefix-roz-bez', subject: 'language', strand: 'Орфографія', topic: 'Префікси', title: 'Правопис префіксів роз-, без- (незмінне написання)', grade_band: 'L3', prerequisites: ['language.word.l3.word-structure'], galuzey: 'МОВ', cycle: 2, sort: 450 },
  { id: 'language.word.l3.noun-gender-number', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Іменник: рід і число', grade_band: 'L3', prerequisites: ['language.word.l2.noun-intro'], galuzey: 'МОВ', cycle: 2, sort: 460 },
  { id: 'language.word.l3.noun-case-questions', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Іменник: змінювання за питаннями (відмінок, ознайомлення)', grade_band: 'L3', prerequisites: ['language.word.l3.noun-gender-number'], galuzey: 'МОВ', cycle: 2, sort: 470 },
  { id: 'language.word.l3.adjective-agreement', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Прикметник: узгодження з іменником у роді й числі', grade_band: 'L3', prerequisites: ['language.word.l2.adjective-intro', 'language.word.l3.noun-gender-number'], galuzey: 'МОВ', cycle: 2, sort: 480 },
  { id: 'language.word.l3.verb-tense', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Дієслово: час — минулий, теперішній, майбутній', grade_band: 'L3', prerequisites: ['language.word.l2.verb-intro'], galuzey: 'МОВ', cycle: 2, sort: 490 },
  { id: 'language.word.l3.pronoun-intro', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Займенник (ознайомлення)', grade_band: 'L3', prerequisites: ['language.word.l3.noun-gender-number'], galuzey: 'МОВ', cycle: 2, sort: 500 },
  { id: 'language.text.l3.subject-predicate', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Головні члени речення: підмет і присудок', grade_band: 'L3', prerequisites: ['language.text.l2.sentence-types-purpose'], galuzey: 'МОВ', cycle: 2, sort: 510 },
  { id: 'language.text.l3.text-plan', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'План тексту (простий)', grade_band: 'L3', prerequisites: ['language.text.l2.title-topic'], galuzey: 'МОВ', cycle: 2, sort: 520 },
  { id: 'language.reading.l3.expressive-reading', subject: 'language', strand: 'Читання', topic: 'Техніка читання', title: 'Виразне читання з дотриманням інтонації', grade_band: 'L3', prerequisites: ['language.reading.l2.fluent-reading'], galuzey: 'МОВ', cycle: 2, sort: 530 },
  { id: 'language.reading.l3.work-with-text', subject: 'language', strand: 'Читання', topic: 'Розуміння прочитаного', title: 'Робота з текстом: вибіркове читання, відповіді на запитання за змістом', grade_band: 'L3', prerequisites: ['language.reading.l2.retell-text'], galuzey: 'МОВ', cycle: 2, sort: 540 },

  // ============================================================
  // L4 — 4 клас (13 skills)
  // ============================================================
  { id: 'language.word.l4.noun-declension', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Іменник: відмінювання за відмінками (повний перелік відмінків)', grade_band: 'L4', prerequisites: ['language.word.l3.noun-case-questions'], galuzey: 'МОВ', cycle: 2, sort: 550 },
  { id: 'language.word.l4.adjective-declension', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Прикметник: відмінювання за родами, числами й відмінками', grade_band: 'L4', prerequisites: ['language.word.l3.adjective-agreement', 'language.word.l4.noun-declension'], galuzey: 'МОВ', cycle: 2, sort: 560 },
  { id: 'language.word.l4.verb-person-number', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Дієслово: особа і число (дієвідмінювання)', grade_band: 'L4', prerequisites: ['language.word.l3.verb-tense'], galuzey: 'МОВ', cycle: 2, sort: 570 },
  { id: 'language.word.l4.pronoun-person', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Займенник: особові займенники за особами і числами', grade_band: 'L4', prerequisites: ['language.word.l3.pronoun-intro'], galuzey: 'МОВ', cycle: 2, sort: 580 },
  { id: 'language.word.l2.numeral-intro', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Числівник (ознайомлення)', grade_band: 'L2', prerequisites: ['language.word.l2.noun-intro'], galuzey: 'МОВ', cycle: 1, orn: ['2 МОВ 4.1'], sort: 590 },
  { id: 'language.word.l4.adverb-intro', subject: 'language', strand: 'Слово', topic: 'Частини мови', title: 'Прислівник (ознайомлення)', grade_band: 'L4', prerequisites: ['language.word.l3.verb-tense'], galuzey: 'МОВ', cycle: 2, sort: 600 },
  { id: 'language.orth.l4.prefix-z-s', subject: 'language', strand: 'Орфографія', topic: 'Префікси', title: 'Правопис префіксів з- і с- (перед глухими приголосними)', grade_band: 'L4', prerequisites: ['language.orth.l3.prefix-roz-bez'], galuzey: 'МОВ', cycle: 2, sort: 610 },
  { id: 'language.text.l4.homogeneous-members', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Однорідні члени речення та кома між ними', grade_band: 'L4', prerequisites: ['language.text.l3.subject-predicate'], galuzey: 'МОВ', cycle: 2, sort: 620 },
  { id: 'language.text.l4.address-punctuation', subject: 'language', strand: 'Речення і текст', topic: 'Речення', title: 'Звертання і розділові знаки при звертанні', grade_band: 'L4', prerequisites: ['language.text.l3.subject-predicate'], galuzey: 'МОВ', cycle: 2, sort: 630 },
  { id: 'language.text.l4.text-types', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'Типи текстів: розповідь, опис, міркування', grade_band: 'L4', prerequisites: ['language.text.l3.text-plan'], galuzey: 'МОВ', cycle: 2, sort: 640 },
  { id: 'language.text.l4.written-retelling', subject: 'language', strand: 'Речення і текст', topic: 'Текст', title: 'Письмовий переказ тексту за планом', grade_band: 'L4', prerequisites: ['language.text.l4.text-types', 'language.text.l3.text-plan'], galuzey: 'МОВ', cycle: 2, sort: 650 },
  { id: 'language.reading.l4.main-idea', subject: 'language', strand: 'Читання', topic: 'Розуміння прочитаного', title: 'Визначення головної думки тексту', grade_band: 'L4', prerequisites: ['language.reading.l3.work-with-text'], galuzey: 'МОВ', cycle: 2, sort: 660 },
  { id: 'language.reading.l4.text-analysis', subject: 'language', strand: 'Читання', topic: 'Аналіз тексту', title: 'Аналіз художнього тексту: персонажі, послідовність подій', grade_band: 'L4', prerequisites: ['language.reading.l4.main-idea'], galuzey: 'МОВ', cycle: 2, sort: 670 },
];
