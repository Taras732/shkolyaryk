import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Іменник і прикметник змінюються» (11.10.2026) — 4 клас, програма Савченко:
 *  d1 — змінювання іменника за питаннями (з ким? кого? кому? що? про кого?);
 *  d2 — орудний відмінок (з ким? чим?) і чергування г, к, х → з, ц, с;
 *  d3 — прикметник змінюється разом з іменником.
 * Назви відмінків — лише в поясненні, у дужках; у завданнях — питання.
 */

export interface FormItem {
  /** Речення з пропуском ___ */
  s: string;
  /** Питання до слова (d1, d2) або початкова форма прикметника (d3) */
  nq: string;
  /** Початкова форма слова в дужках */
  w: string;
  right: string;
  wrong: [string, string, string];
  /** Відмінок або примітка для пояснення */
  note: string;
  /** Для d3 — питання до іменника в реченні */
  nounQ?: string;
}

/** d1: питання → форма іменника */
export const NOUNS: FormItem[] = [
  { s: 'Розмовляю з ___.', nq: 'з ким?', w: 'сестра', right: 'сестрою', wrong: ['сестри', 'сестру', 'сестрі'], note: 'орудний відмінок' },
  { s: 'Немає ___.', nq: 'кого?', w: 'брат', right: 'брата', wrong: ['брату', 'братом', 'брат'], note: 'родовий відмінок' },
  { s: 'Дарую квіти ___.', nq: 'кому?', w: 'бабуся', right: 'бабусі', wrong: ['бабусю', 'бабусею', 'бабусь'], note: 'давальний відмінок' },
  { s: 'Люблю ___.', nq: 'кого?', w: 'мама', right: 'маму', wrong: ['мами', 'мамі', 'мамою'], note: 'знахідний відмінок' },
  { s: 'Пишу ___.', nq: 'чим?', w: 'ручка', right: 'ручкою', wrong: ['ручки', 'ручці', 'ручку'], note: 'орудний відмінок' },
  { s: 'Розповідаю про ___.', nq: 'про кого?', w: 'друг', right: 'друга', wrong: ['другові', 'другом', 'другу'], note: 'знахідний відмінок' },
  { s: 'Сидимо на ___.', nq: 'на чому?', w: 'стілець', right: 'стільці', wrong: ['стільця', 'стільцю', 'стільцем'], note: 'місцевий відмінок' },
  { s: 'Живу в ___.', nq: 'у чому?', w: 'село', right: 'селі', wrong: ['села', 'селу', 'селом'], note: 'місцевий відмінок' },
  { s: 'Гуляю з ___.', nq: 'з ким?', w: 'собака', right: 'собакою', wrong: ['собаки', 'собаці', 'собаку'], note: 'орудний відмінок' },
  { s: 'Читаю ___.', nq: 'що?', w: 'книжка', right: 'книжку', wrong: ['книжки', 'книжці', 'книжкою'], note: 'знахідний відмінок' },
];

/** d2: орудний відмінок */
export const INSTR: FormItem[] = [
  { s: 'Малюю ___.', nq: 'чим?', w: 'олівець', right: 'олівцем', wrong: ['олівця', 'олівцю', 'олівці'], note: 'орудний відмінок' },
  { s: 'Іду до школи з ___.', nq: 'з ким?', w: 'мама', right: 'мамою', wrong: ['маму', 'мамі', 'мами'], note: 'орудний відмінок' },
  { s: 'Дружу з ___.', nq: 'з ким?', w: 'кінь', right: 'конем', wrong: ['коня', 'коневі', 'коні'], note: 'орудний відмінок' },
  { s: 'Ріжу хліб ___.', nq: 'чим?', w: 'ніж', right: 'ножем', wrong: ['ножа', 'ножу', 'ніж'], note: 'орудний відмінок' },
  { s: 'Мию руки ___.', nq: 'чим?', w: 'мило', right: 'милом', wrong: ['мила', 'милу', 'мило'], note: 'орудний відмінок' },
  { s: 'Ходжу на рибалку з ___.', nq: 'з ким?', w: 'тато', right: 'татом', wrong: ['тата', 'татові', 'тато'], note: 'орудний відмінок' },
];
/** d2: чергування г, к, х → з, ц, с */
export const ALT: FormItem[] = [
  { s: 'У мене синець на ___.', nq: 'на чому?', w: 'нога', right: 'нозі', wrong: ['ногу', 'ногою', 'ноги'], note: 'г → з: нога — на нозі' },
  { s: 'Тримаю мʼяч у ___.', nq: 'у чому?', w: 'рука', right: 'руці', wrong: ['рукою', 'рука', 'рукам'], note: 'к → ц: рука — у руці' },
  { s: 'Горобець сидить на ___.', nq: 'на чому?', w: 'гілка', right: 'гілці', wrong: ['гілку', 'гілкою', 'гілки'], note: 'к → ц: гілка — на гілці' },
  { s: 'Сніг лежить на ___.', nq: 'на чому?', w: 'дорога', right: 'дорозі', wrong: ['дорогу', 'дорогою', 'дороги'], note: 'г → з: дорога — на дорозі' },
  { s: 'Зошит лежить у ___.', nq: 'у чому?', w: 'сумка', right: 'сумці', wrong: ['сумку', 'сумкою', 'сумки'], note: 'к → ц: сумка — у сумці' },
];

/** d3: прикметник узгоджується з іменником */
export const ADJS: FormItem[] = [
  { s: 'Бачу ___ дерево.', nq: 'високий', w: 'високий', right: 'високе', wrong: ['високий', 'висока', 'високі'], note: 'дерево — середній рід', nounQ: 'бачу що?' },
  { s: 'Ми живемо в ___ лісі.', nq: 'зелений', w: 'зелений', right: 'зеленому', wrong: ['зелений', 'зеленим', 'зеленого'], note: 'у лісі — на питання «у чому?»', nounQ: 'у чому?' },
  { s: 'Читаю ___ книжку.', nq: 'цікавий', w: 'цікавий', right: 'цікаву', wrong: ['цікава', 'цікавої', 'цікавій'], note: 'книжку — жіночий рід', nounQ: 'читаю що?' },
  { s: 'Пʼю ___ воду.', nq: 'холодний', w: 'холодний', right: 'холодну', wrong: ['холодна', 'холодної', 'холодній'], note: 'воду — жіночий рід', nounQ: 'пʼю що?' },
  { s: 'Іду з ___ другом.', nq: 'новий', w: 'новий', right: 'новим', wrong: ['новому', 'новий', 'нового'], note: 'з другом — на питання «з ким?»', nounQ: 'з ким?' },
  { s: 'Даю яблуко ___ дівчинці.', nq: 'маленький', w: 'маленька', right: 'маленькій', wrong: ['маленька', 'маленьку', 'маленької'], note: 'дівчинці — на питання «кому?»', nounQ: 'кому?' },
  { s: 'Ми зупинилися біля ___ озера.', nq: 'глибокий', w: 'глибоке', right: 'глибокого', wrong: ['глибоке', 'глибокому', 'глибоким'], note: 'біля озера — на питання «біля чого?»', nounQ: 'біля чого?' },
  { s: 'Розмовляю з ___ бабусею.', nq: 'добрий', w: 'добра', right: 'доброю', wrong: ['добра', 'добру', 'добрій'], note: 'з бабусею — на питання «з ким?»', nounQ: 'з ким?' },
  { s: 'Ворона сидить на ___ гілці.', nq: 'сухий', w: 'суха', right: 'сухій', wrong: ['суха', 'суху', 'сухої'], note: 'на гілці — на питання «на чому?»', nounQ: 'на чому?' },
];

type Payload = { mode: 'noun' | 'instr' | 'alt' | 'adj'; s: string; hint: string; options: string[]; item: FormItem };
type Answer = string;

const mk = (mode: Payload['mode'], it: FormItem): Omit<Round<Payload, Answer>, 'id'> => ({
  payload: { mode, s: it.s, hint: mode === 'adj' ? `(${it.w})` : `(${it.nq} ${it.w})`, options: shuffle([it.right, ...it.wrong]), item: it },
  answer: it.right,
});

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let items: Omit<Round<Payload, Answer>, 'id'>[];
  if (difficulty === 1) items = shuffle(NOUNS).slice(0, 5).map((i) => mk('noun', i));
  else if (difficulty === 2) {
    const n = Math.random() < 0.5 ? 2 : 3;
    items = [...shuffle(INSTR).slice(0, n).map((i) => mk('instr', i)), ...shuffle(ALT).slice(0, 5 - n).map((i) => mk('alt', i))];
  } else items = shuffle(ADJS).slice(0, 5).map((i) => mk('adj', i));
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES = {
  noun: { key: 'p_c4_noun', text: 'Постав слово в потрібну форму за питанням.' },
  instr: { key: 'p_c4_instr', text: 'Постав слово в потрібну форму: з ким? чим?' },
  alt: { key: 'p_c4_alt', text: 'Постав слово в потрібну форму.' },
  adj: { key: 'p_c4_adj', text: 'Узгодь прикметник з іменником.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4 }}>{p.s}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#64748B', marginTop: 6 }}>{p.hint}</div>
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 19, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const cases4: GameDefinition<Payload, Answer> = {
  id: 'cases-4',
  title: 'Іменник і прикметник змінюються',
  subject: 'language',
  levels: ['L3'],
  icon: '🔤',
  description: 'Форми слова за питаннями, орудний відмінок, чергування г, к, х і прикметник разом з іменником.',
  accent: '#FEF3C7',
  skillsFor: (d) => (d === 1 ? ['language.word.l4.noun-case-questions'] : d === 2 ? ['language.word.l4.noun-declension'] : ['language.word.l4.adjective-declension']),
  explain: (round) => {
    const p = round.payload;
    const it = p.item;
    const full = p.s.replace('___', String(round.answer));
    if (p.mode === 'adj') {
      return { steps: [`Спершу знайди іменник: ${it.note}.`, `Прикметник стає такого ж роду, числа й відмінка: ${full}`] };
    }
    if (p.mode === 'alt') return { steps: [`Питання «${it.nq}» — ${full}`, `Чергування: ${it.note}. Букви г, к, х змінюються на з, ц, с.`] };
    return { steps: [`Постав питання «${it.nq}» — слово змінюється: ${full}`, `(${it.note})`] };
  },
  generate,
  Component,
};

export default cases4;
