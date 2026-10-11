import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { TEXTS } from '../text-2';

/**
 * «Читання 2» (11.10.2026) — 2 клас, програма Савченко [2 МОВ 2.1, 2.2, 2.6, 4.1]:
 *  d1 — жанр за уривком (казка, вірш, оповідання, пізнавальний текст);
 *  d2 — частини книжки; пряме й переносне значення;
 *  d3 — дані з таблиці в тексті; порядок подій (крок до переказу).
 * Уривки й тексти — власні.
 */

const GENRES = ['казка', 'вірш', 'оповідання', 'пізнавальний текст'] as const;
export const EXCERPTS: { t: string; g: (typeof GENRES)[number] }[] = [
  { t: 'Жили-були дід та баба. Була в них курочка, яка вміла говорити.', g: 'казка' },
  { t: 'Колись давно в лісі жив хитрий Лис. Він умів перетворюватися на пеньок.', g: 'казка' },
  { t: 'Сонце встало над горою,\nПівник крикнув: «Кукуріку!»', g: 'вірш' },
  { t: 'Падає сніжок пухкий,\nБілий-білий, легенький.', g: 'вірш' },
  { t: 'Марійка прийшла зі школи й розповіла мамі про новий урок. Мама усміхнулась і обійняла її.', g: 'оповідання' },
  { t: 'Петрик загубив рукавичку. Увечері сусідка принесла її, і хлопчик щиро подякував.', g: 'оповідання' },
  { t: 'Їжаки взимку сплять у норах під листям. Навесні вони прокидаються дуже голодні.', g: 'пізнавальний текст' },
  { t: 'Бджоли збирають нектар із квітів і роблять із нього мед.', g: 'пізнавальний текст' },
];
export const BOOK: { q: string; a: string }[] = [
  { q: 'Де в книжці знайти, на якій сторінці потрібна казка?', a: 'зміст' },
  { q: 'Де на книжці зовні написано її назву й автора?', a: 'обкладинка' },
  { q: 'Як називається перша сторінка всередині, з назвою, автором і видавництвом?', a: 'титульна сторінка' },
];
const BOOK_PARTS = ['зміст', 'обкладинка', 'титульна сторінка', 'малюнок'];
export const MEANING: { phrase: string; right: string; wrong: [string, string] }[] = [
  { phrase: '«У мами золоті руки».', right: 'Мама все вміє гарно робити.', wrong: ['У мами руки із золота.', 'Мама носить золоті персні.'] },
  { phrase: '«Петрик ніби язика проковтнув».', right: 'Петрик мовчить.', wrong: ['Петрик зʼїв язик.', 'У Петрика болить горло.'] },
  { phrase: '«Сонечко усміхається».', right: 'Сонце яскраво й лагідно світить.', wrong: ['У сонця є рот.', 'Сонце сміється вголос.'] },
  { phrase: '«Оля бігла як вітер».', right: 'Оля бігла дуже швидко.', wrong: ['Оля дмухала, як вітер.', 'Оля бігла проти вітру.'] },
];
export const TABLE = { title: 'Гуртки в школі', rows: [['понеділок', 'малювання'], ['середа', 'плавання'], ['пʼятниця', 'шахи']] as [string, string][] };

type Payload =
  | { mode: 'genre'; t: string; options: string[] }
  | { mode: 'book' | 'meaning' | 'table' | 'events'; q: string; text?: string; options: string[] };
type Answer = string;

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (const e of shuffle(EXCERPTS).slice(0, 5)) items.push({ payload: { mode: 'genre', t: e.t, options: [...GENRES] }, answer: e.g });
  } else if (difficulty === 2) {
    for (const b of shuffle(BOOK).slice(0, 2)) items.push({ payload: { mode: 'book', q: b.q, options: shuffle([b.a, ...shuffle(BOOK_PARTS.filter((x) => x !== b.a)).slice(0, 2)]) }, answer: b.a });
    for (const m of shuffle(MEANING).slice(0, 3)) items.push({ payload: { mode: 'meaning', q: `Що означає ${m.phrase}`, options: shuffle([m.right, ...m.wrong]) }, answer: m.right });
  } else {
    for (const [day, club] of shuffle(TABLE.rows).slice(0, 2)) items.push({ payload: { mode: 'table', q: `Коли гурток «${club}»?`, options: TABLE.rows.map((r) => r[0]) }, answer: day });
    for (const t of shuffle(TEXTS.filter((x) => x.type === 'розповідь')).slice(0, 3)) {
      const ask = Math.random() < 0.5 ? 0 : 2;
      items.push({ payload: { mode: 'events', q: ask === 0 ? 'Що сталося спочатку?' : 'Чим усе закінчилось?', text: t.s.join(' '), options: shuffle([...t.s]) }, answer: t.s[ask] });
    }
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

function Table() {
  return (
    <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: 16 }}>
      <caption style={{ fontWeight: 800, marginBottom: 6 }}>{TABLE.title}</caption>
      <tbody>
        {TABLE.rows.map(([d, c]) => (
          <tr key={d}><td style={{ border: '1px solid #CBD5E1', padding: '4px 10px' }}>{d}</td><td style={{ border: '1px solid #CBD5E1', padding: '4px 10px', fontWeight: 700 }}>{c}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

const PHRASES = {
  genre: { key: 'p_r2_genre', text: 'Що це: казка, вірш, оповідання чи пізнавальний текст?' },
  book: { key: 'p_r2_book', text: 'Книжка' },
  meaning: { key: 'p_r2_meaning', text: 'Що означає цей вислів?' },
  table: { key: 'p_r2_table', text: 'Прочитай таблицю.' },
  events: { key: 'p_r2_events', text: 'Прочитай текст.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const text = { fontSize: 17, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' as const };
  return (
    <>
      <PromptCard question={p.mode === 'genre' ? 'Що це?' : p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'genre' && <div style={text}>{p.t}</div>}
        {p.mode === 'table' && <Table />}
        {p.mode === 'events' && <div style={text}>{p.text}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 16, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.mode === 'genre' ? 2 : 1} />
    </>
  );
}

const reading2: GameDefinition<Payload, Answer> = {
  id: 'reading-2',
  title: 'Читання 2',
  subject: 'language',
  levels: ['L3'],
  icon: '📖',
  description: 'Жанри, частини книжки, переносне значення, таблиця в тексті, порядок подій.',
  accent: '#FFE4E6',
  skillsFor: (d) => (d === 1 ? ['language.reading.l2.genres'] : d === 2 ? ['language.reading.l2.book-parts', 'language.reading.l2.word-meaning'] : ['language.reading.l2.graphic-info', 'language.reading.l2.retell-text']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'genre') {
      const why = { казка: 'Чарівне, чого не буває: тварини говорять, дива.', вірш: 'Рядки короткі, кінці римуються.', оповідання: 'Про звичайних людей і справжні події.', 'пізнавальний текст': 'Розповідає справжні знання про світ.' } as Record<string, string>;
      return { steps: [`Це ${round.answer}.`, why[String(round.answer)]] };
    }
    if (p.mode === 'meaning') return { steps: [String(round.answer), 'Слова тут ужиті в переносному значенні — не буквально.'] };
    if (p.mode === 'table') return { steps: [`У таблиці: ${round.answer}.`, 'Знайди рядок з потрібним гуртком і прочитай день поруч.'] };
    if (p.mode === 'events') return { steps: [String(round.answer), 'Події в розповіді йдуть по черзі: початок, що сталося, кінець.'] };
    return { steps: [`Це ${round.answer}.`] };
  },
  generate,
  Component,
};

export default reading2;
