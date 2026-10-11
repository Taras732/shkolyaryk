import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { alphaSort } from '../alpha-hyphen';

/**
 * «Слова 4» (11.10.2026) — 4 клас, програма Савченко:
 *  d1 — фразеологізми: значення;
 *  d2 — 10–12 слів за алфавітом (дивимось і на другу, третю букву);
 *  d3 — числівник кількісний чи порядковий; час доби словами; ступені порівняння прикметника.
 */

export const PHRASES_UK: { p: string; m: string }[] = [
  { p: 'бити байдики', m: 'ледарювати' },
  { p: 'як кіт наплакав', m: 'мало' },
  { p: 'накивати пʼятами', m: 'втекти' },
  { p: 'пекти раків', m: 'червоніти' },
  { p: 'зарубати на носі', m: 'запамʼятати' },
  { p: 'вішати носа', m: 'сумувати' },
  { p: 'піймати облизня', m: 'зазнати невдачі' },
  { p: 'як дві краплі води', m: 'дуже схожі' },
];

/** Набори слів для впорядкування (малі літери, без ь/апострофа в перших позиціях сортування). */
export const WORD_POOLS: string[][] = [
  ['бобер', 'білка', 'борсук', 'вовк', 'віслюк', 'заєць', 'їжак', 'кабан', 'кіт', 'лань', 'лелека', 'лисиця', 'мавпа', 'слон', 'сова', 'сорока', 'тигр', 'тюлень'],
  ['абетка', 'альбом', 'зошит', 'задача', 'зміст', 'кабінет', 'клас', 'книжка', 'лінійка', 'олівець', 'оцінка', 'парта', 'пенал', 'ручка', 'рюкзак', 'сторінка'],
  ['абрикос', 'банан', 'борщ', 'вареники', 'виноград', 'груша', 'диня', 'кавун', 'капуста', 'лимон', 'малина', 'морква', 'огірок', 'персик', 'помідор', 'сир', 'слива'],
  ['гай', 'гора', 'дорога', 'дуб', 'луг', 'ліс', 'озеро', 'поле', 'річка', 'сад', 'ставок', 'степ', 'струмок', 'туман', 'хмара', 'ялина', 'явір'],
  ['актор', 'водій', 'вчитель', 'кравець', 'кухар', 'лікар', 'листоноша', 'пекар', 'пілот', 'співак', 'столяр', 'художник', 'шахтар', 'юрист'],
];

const firstLetterRepeats = (ws: string[]) => new Set(ws.map((w) => w[0])).size < ws.length;
export function pickWords(pool: string[]): string[] {
  for (;;) {
    const n = 10 + Math.floor(Math.random() * 3);
    const ws = shuffle(pool).slice(0, n);
    if (firstLetterRepeats(ws)) return ws;
  }
}

/** Числівники: кількісний (скільки?) чи порядковий (котрий?). */
export const NUMERALS: { s: string; w: string; a: 'кількісний' | 'порядковий' }[] = [
  { s: 'Тарас прочитав сім книжок.', w: 'сім', a: 'кількісний' },
  { s: 'Ірина прийшла сьомою.', w: 'сьомою', a: 'порядковий' },
  { s: 'Ми живемо на третьому поверсі.', w: 'третьому', a: 'порядковий' },
  { s: 'На столі лежить тринадцять яблук.', w: 'тринадцять', a: 'кількісний' },
  { s: 'Це мій перший урок.', w: 'перший', a: 'порядковий' },
  { s: 'У нашому класі двадцять учнів.', w: 'двадцять', a: 'кількісний' },
  { s: 'Оля посіла друге місце.', w: 'друге', a: 'порядковий' },
  { s: 'Тато купив два квитки.', w: 'два', a: 'кількісний' },
];

/** Час словами → цифри; дистрактори — типові помилки (на годину далі, чверть замість пів). */
export const TIMES: { t: string; a: string; wrong: [string, string, string] }[] = [
  { t: 'о пів на третю', a: '2:30', wrong: ['3:30', '2:15', '2:45'] },
  { t: 'за чверть пʼята', a: '4:45', wrong: ['5:15', '4:15', '4:30'] },
  { t: 'пів на шосту', a: '5:30', wrong: ['6:30', '5:15', '5:45'] },
  { t: 'за чверть девʼята', a: '8:45', wrong: ['9:15', '8:15', '8:30'] },
  { t: 'о пів на десяту', a: '9:30', wrong: ['10:30', '9:15', '9:45'] },
];

/** Ступені порівняння: у кожного рядка одна правильна форма; решта — інші ступені або інше слово. */
export const DEGREES: { s: string; a: string; wrong: [string, string, string]; rule: string }[] = [
  { s: 'високий — вищий — ___', a: 'найвищий', wrong: ['найнижчий', 'вищий', 'високий'], rule: 'Найвищий ступінь: додаємо най- до вищого — найвищий.' },
  { s: 'добрий — кращий — ___', a: 'найкращий', wrong: ['кращий', 'добрий', 'найбільший'], rule: 'Від «кращий» — найкращий.' },
  { s: 'швидкий — швидший — ___', a: 'найшвидший', wrong: ['швидкий', 'швидший', 'найповільніший'], rule: 'Додаємо най-: найшвидший.' },
  { s: 'малий — менший — ___', a: 'найменший', wrong: ['малий', 'менший', 'найбільший'], rule: 'Від «менший» — найменший.' },
  { s: 'довгий — довший — ___', a: 'найдовший', wrong: ['довгий', 'довший', 'найкоротший'], rule: 'Додаємо най-: найдовший.' },
  { s: 'низький — нижчий — ___', a: 'найнижчий', wrong: ['низький', 'нижчий', 'найвищий'], rule: 'Додаємо най-: найнижчий.' },
  { s: 'гарний — ___ — найгарніший', a: 'гарніший', wrong: ['гарний', 'найгарніший', 'гірший'], rule: 'Між «гарний» і «найгарніший» стоїть форма з -іш-: гарніший.' },
  { s: 'Мій рюкзак ___ за твій. (легкий)', a: 'легший', wrong: ['найлегший', 'легкий', 'легка'], rule: 'Порівнюємо два предмети («за твій») — легший.' },
  { s: 'Ця річка ___ за ту. (довга)', a: 'довша', wrong: ['найдовша', 'довга', 'довгої'], rule: 'Порівнюємо дві річки («за ту») — довша.' },
];

type Payload =
  | { mode: 'phr'; q: string; options: string[] }
  | { mode: 'alpha'; words: string[] }
  | { mode: 'num'; s: string; w: string; options: string[] }
  | { mode: 'time'; t: string; options: string[] }
  | { mode: 'degree'; s: string; rule: string; options: string[] };
type Answer = string;

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (const x of shuffle(PHRASES_UK).slice(0, 5)) {
      const wrong = shuffle(PHRASES_UK.filter((y) => y.m !== x.m)).slice(0, 3).map((y) => y.m);
      items.push({ payload: { mode: 'phr', q: x.p, options: shuffle([x.m, ...wrong]) }, answer: x.m });
    }
  } else if (difficulty === 2) {
    for (const pool of shuffle(WORD_POOLS).slice(0, 3)) {
      const words = pickWords(pool);
      items.push({ payload: { mode: 'alpha', words: shuffle(words) }, answer: alphaSort(words).join(' ') });
    }
    for (const x of shuffle(PHRASES_UK).slice(0, 2)) {
      const wrong = shuffle(PHRASES_UK.filter((y) => y.m !== x.m)).slice(0, 3).map((y) => y.m);
      items.push({ payload: { mode: 'phr', q: x.p, options: shuffle([x.m, ...wrong]) }, answer: x.m });
    }
  } else {
    for (const x of shuffle(NUMERALS).slice(0, 2)) items.push({ payload: { mode: 'num', s: x.s, w: x.w, options: ['кількісний', 'порядковий'] }, answer: x.a });
    const t = shuffle(TIMES)[0];
    items.push({ payload: { mode: 'time', t: t.t, options: shuffle([t.a, ...t.wrong]) }, answer: t.a });
    for (const x of shuffle(DEGREES).slice(0, 2)) items.push({ payload: { mode: 'degree', s: x.s, rule: x.rule, options: shuffle([x.a, ...x.wrong]) }, answer: x.a });
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

/** Тап по словах у алфавітному порядку; не те — хитається. */
function AlphaBoard({ words, answer, disabled, onDone }: { words: string[]; answer: string; disabled: boolean; onDone: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const sorted = answer.split(' ');
  const tap = (w: string) => {
    if (disabled || picked.includes(w)) return;
    if (w !== sorted[picked.length]) { setShake(w); window.setTimeout(() => setShake(null), 400); return; }
    const nx = [...picked, w];
    setPicked(nx);
    if (nx.length === words.length) window.setTimeout(() => onDone(nx.join(' ')), 300);
  };
  const chip = { borderRadius: 12, padding: '8px 12px', fontSize: 17, fontWeight: 800 } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 44 }}>
        {picked.map((w, k) => <span key={w} style={{ ...chip, background: '#DCFCE7' }}>{k + 1}. {w}</span>)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {words.filter((w) => !picked.includes(w)).map((w) => (
          <button key={w} type="button" onClick={() => tap(w)}
            style={{ ...chip, border: 0, background: '#fff', boxShadow: '0 4px 0 #E5E7EB', cursor: 'pointer', animation: shake === w ? 'pk-shake .4s ease' : undefined }}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

const PHRASES = {
  phr: { key: 'p_w4_phr', text: 'Що означає цей вислів?' },
  alpha: { key: 'p_w4_alpha', text: 'Розстав слова за алфавітом.' },
  num: { key: 'p_w4_num', text: 'Числівник кількісний чи порядковий?' },
  time: { key: 'p_w4_time', text: 'Котра це година?' },
  degree: { key: 'p_w4_degree', text: 'Вибери правильну форму прикметника.' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 22, fontWeight: 800, lineHeight: 1.4 } as const;
  if (p.mode === 'alpha') {
    return (
      <>
        <PromptCard question={`${phrase.text} Дивись і на другу букву.`} answerState={answerState} say={say} sayKey={round.id} />
        <AlphaBoard key={round.id} words={p.words} answer={String(round.answer)} disabled={disabled} onDone={onAnswer} />
      </>
    );
  }
  const question = p.mode === 'phr' ? `Що означає вислів «${p.q}»?` : p.mode === 'num' ? `Числівник «${p.w}» — кількісний чи порядковий?` : p.mode === 'time' ? `Котра година: ${p.t}?` : phrase.text;
  return (
    <>
      <PromptCard question={question} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'num' && <div style={big}>{p.s}</div>}
        {p.mode === 'degree' && <div style={big}>{p.s}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 19, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const words4: GameDefinition<Payload, Answer> = {
  id: 'words-4',
  title: 'Слова 4',
  subject: 'language',
  levels: ['L3'],
  icon: '📚',
  description: 'Фразеологізми, алфавіт на 10–12 слів, числівники, час словами й ступені порівняння прикметника.',
  accent: '#FCE7F3',
  skillsFor: (d) => (d === 1 ? ['language.word.l4.phraseologisms'] : d === 2 ? ['language.word.l4.alphabet-12'] : ['language.word.l4.numeral-types', 'language.word.l4.adjective-comparison']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'phr') return { steps: [`«${p.q}» означає: ${round.answer}.`, 'Це стійкий вислів: слова разом значать не те, що кожне окремо.'] };
    if (p.mode === 'alpha') return { steps: [String(round.answer), 'Спершу дивимось на першу букву, а якщо вони однакові — на другу, потім на третю.'] };
    if (p.mode === 'num') return { steps: [round.answer === 'кількісний' ? `«${p.w}» відповідає на питання «скільки?» — кількісний.` : `«${p.w}» відповідає на питання «котрий?» — порядковий.`, 'Кількісний рахує, порядковий вказує місце в ряду.'] };
    if (p.mode === 'time') return { steps: [`«${p.t}» — це ${round.answer}.`, '«Пів на третю» — це половина, що вже йде до третьої: 2:30. «За чверть пʼята» — до пʼятої бракує 15 хвилин: 4:45.'] };
    return { steps: [`${p.s.replace('___', String(round.answer))}`, p.rule] };
  },
  generate,
  Component,
};

export default words4;
