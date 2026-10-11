import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { alphaSort } from '../alpha-hyphen';

/**
 * «Слова 3» (11.10.2026) — 3 клас, програма Савченко:
 *  d1 — синоніми й антоніми;
 *  d2 — 7–9 слів за алфавітом;
 *  d3 — г чи ґ; дж, дз — один звук; дати числівником.
 */

export const SYN: { w: string; right: string; wrong: [string, string] }[] = [
  { w: 'веселий', right: 'радісний', wrong: ['сумний', 'тихий'] },
  { w: 'великий', right: 'величезний', wrong: ['малий', 'новий'] },
  { w: 'гарний', right: 'красивий', wrong: ['поганий', 'високий'] },
  { w: 'швидко', right: 'хутко', wrong: ['повільно', 'тихо'] },
  { w: 'сміливий', right: 'відважний', wrong: ['боягузливий', 'добрий'] },
];
export const ANT: { w: string; right: string; wrong: [string, string] }[] = [
  { w: 'день', right: 'ніч', wrong: ['ранок', 'вечір'] },
  { w: 'гарячий', right: 'холодний', wrong: ['смачний', 'кислий'] },
  { w: 'високий', right: 'низький', wrong: ['широкий', 'тонкий'] },
  { w: 'добрий', right: 'злий', wrong: ['гарний', 'тихий'] },
  { w: 'швидкий', right: 'повільний', wrong: ['тихий', 'сильний'] },
  { w: 'радість', right: 'смуток', wrong: ['веселощі', 'сміх'] },
];

/** Слова з різними першими буквами. */
export const ALPHA_WORDS = ['ананас', 'білка', 'вишня', 'груша', 'дуб', 'єнот', 'жираф', 'зебра', 'іграшка', 'їжак', 'кіт', 'лев', 'мак',
  'ніс', 'осінь', 'пес', 'риба', 'сова', 'тигр', 'урок', 'футбол', 'хліб', 'цибуля', 'чай', 'шапка', 'щітка', 'юшка', 'яблуко'];

export const G_WORDS: { w: string; a: 'г' | 'ґ' }[] = [
  { w: 'ґудзик', a: 'ґ' }, { w: 'ґанок', a: 'ґ' }, { w: 'ґрунт', a: 'ґ' },
  { w: 'гора', a: 'г' }, { w: 'голова', a: 'г' }, { w: 'гриб', a: 'г' }, { w: 'груша', a: 'г' }, { w: 'герой', a: 'г' }, { w: 'гілка', a: 'г' },
];
/** Скільки звуків (дж, дз — один звук) і скільки букв. */
export const SOUNDS: { w: string; sounds: number }[] = [
  { w: 'бджола', sounds: 5 }, { w: 'дзвоник', sounds: 6 }, { w: 'джміль', sounds: 4 }, { w: 'дзеркало', sounds: 7 },
  { w: 'ґудзик', sounds: 5 }, { w: 'дзвінок', sounds: 6 }, { w: 'кукурудза', sounds: 8 }, { w: 'джерело', sounds: 6 },
];

export const ORD: Record<number, string> = {
  1: 'першого', 2: 'другого', 3: 'третього', 4: 'четвертого', 5: 'пʼятого', 6: 'шостого', 7: 'сьомого', 8: 'восьмого', 9: 'девʼятого',
  10: 'десятого', 11: 'одинадцятого', 12: 'дванадцятого', 13: 'тринадцятого', 14: 'чотирнадцятого', 15: 'пʼятнадцятого', 16: 'шістнадцятого',
  17: 'сімнадцятого', 18: 'вісімнадцятого', 19: 'девʼятнадцятого', 20: 'двадцятого', 21: 'двадцять першого', 22: 'двадцять другого',
  23: 'двадцять третього', 24: 'двадцять четвертого', 25: 'двадцять пʼятого', 26: 'двадцять шостого', 27: 'двадцять сьомого',
  28: 'двадцять восьмого', 29: 'двадцять девʼятого', 30: 'тридцятого', 31: 'тридцять першого',
};
export const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const DATE_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 14, 15, 24, 25];

type Mode = 'syn' | 'ant' | 'alpha' | 'g' | 'sounds' | 'date-num' | 'date-word';
type Payload =
  | { mode: Exclude<Mode, 'alpha'>; q: string; big?: string; options: string[]; why: string[]; cols: number }
  | { mode: 'alpha'; words: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;
const pick = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);

function d1(): Item[] {
  const syn = pick(SYN, 3).map((x): Item => ({
    payload: { mode: 'syn', q: `Яке слово близьке за значенням до «${x.w}»?`, options: shuffle([x.right, ...x.wrong]), cols: 1,
      why: [`«${x.right}» означає майже те саме, що «${x.w}» — це синонім.`] },
    answer: x.right,
  }));
  const ant = pick(ANT, 2).map((x): Item => ({
    payload: { mode: 'ant', q: `Яке слово протилежне за значенням до «${x.w}»?`, options: shuffle([x.right, ...x.wrong]), cols: 1,
      why: [`«${x.w}» і «${x.right}» мають протилежне значення — це антоніми.`] },
    answer: x.right,
  }));
  return [...syn, ...ant];
}

function d2(): Item[] {
  return [7, 7, 8, 8, 9].map((n): Item => {
    const words = pick(ALPHA_WORDS, n);
    return { payload: { mode: 'alpha', words }, answer: alphaSort(words).join(',') };
  });
}

function d3(): Item[] {
  const g = pick(G_WORDS, 2).map((x): Item => ({
    payload: { mode: 'g', q: 'Яку букву вставити: г чи ґ?', big: `_${x.w.slice(1)}`, options: ['г', 'ґ'], cols: 2,
      why: [`${x.w}.`, x.a === 'ґ' ? 'У цьому слові пишемо ґ — вимовляємо твердо.' : 'У цьому слові пишемо звичайну г.'] },
    answer: x.a,
  }));
  const s = pick(SOUNDS, 1).map((x): Item => {
    const letters = x.w.length;
    return {
      payload: { mode: 'sounds', q: `Скільки звуків у слові «${x.w}»?`, options: shuffle([x.sounds, letters, x.sounds - 1].map(String)), cols: 3,
        why: [`Дж і дз — один звук, хоч пишемо двома буквами.`, `У слові «${x.w}» букв ${letters}, а звуків ${x.sounds}.`] },
      answer: String(x.sounds),
    };
  });
  const dates = pick(DATE_DAYS, 2).map((day, i): Item => {
    const month = MONTHS[Math.floor(Math.random() * 12)];
    const near = shuffle([day + 10, day - 10, day + 1, day - 1, day + 2].filter((v) => v >= 1 && v <= 31 && v !== day)).slice(0, 2);
    if (i === 0) {
      return {
        payload: { mode: 'date-num', q: `Як записати цифрами: «${ORD[day]} ${month}»?`, options: shuffle([day, ...near]).map((v) => `${v} ${month}`), cols: 1,
          why: [`«${ORD[day]}» — це ${day}-те число.`, `${day} ${month}.`] },
        answer: `${day} ${month}`,
      };
    }
    return {
      payload: { mode: 'date-word', q: `Як прочитати: ${day} ${month}?`, options: shuffle([day, ...near]).map((v) => `${ORD[v]} ${month}`), cols: 1,
        why: [`${day} ${month} читаємо: ${ORD[day]} ${month}.`, 'Дату читаємо порядковим числівником: першого, другого, третього…'] },
      answer: `${ORD[day]} ${month}`,
    };
  });
  return [...g, ...s, ...dates];
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items = difficulty === 1 ? d1() : difficulty === 2 ? d2() : d3();
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

function AlphaBoard({ words, disabled, onDone }: { words: string[]; disabled: boolean; onDone: (v: string) => void }) {
  const order = alphaSort(words);
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const tap = (w: string) => {
    if (disabled || picked.includes(w)) return;
    if (w !== order[picked.length]) { setShake(w); window.setTimeout(() => setShake(null), 400); return; }
    const nx = [...picked, w];
    setPicked(nx);
    if (nx.length === words.length) window.setTimeout(() => onDone(nx.join(',')), 300);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', minHeight: 40 }}>
        {picked.map((w, k) => <span key={w} style={{ padding: '6px 10px', borderRadius: 12, background: '#DCFCE7', fontWeight: 800 }}>{k + 1}. {w}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {words.filter((w) => !picked.includes(w)).map((w) => (
          <button key={w} type="button" onClick={() => tap(w)}
            style={{ border: 0, borderRadius: 14, padding: '10px 14px', fontSize: 18, fontWeight: 800, background: '#fff', boxShadow: '0 4px 0 #E5E7EB', cursor: 'pointer', animation: shake === w ? 'pk-shake .4s ease' : undefined }}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

const PHRASES: Record<Mode, { key: string; text: string }> = {
  syn: { key: 'p_w3_syn', text: 'Яке слово близьке за значенням?' },
  ant: { key: 'p_w3_ant', text: 'Яке слово протилежне за значенням?' },
  alpha: { key: 'p_w3_alpha', text: 'Розстав слова за алфавітом.' },
  g: { key: 'p_w3_g', text: 'Яку букву вставити: г чи ґ?' },
  sounds: { key: 'p_w3_sounds', text: 'Скільки звуків у слові?' },
  'date-num': { key: 'p_w3_datenum', text: 'Як записати дату цифрами?' },
  'date-word': { key: 'p_w3_dateword', text: 'Як прочитати дату словами?' },
};

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  if (p.mode === 'alpha') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={{ fontSize: 13, color: 'var(--c-mut)', textAlign: 'center' }}>Торкайся слів по черзі: перше за алфавітом — першим</div>
        </PromptCard>
        <AlphaBoard key={round.id} words={p.words} disabled={disabled} onDone={onAnswer} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.big && <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 2, textAlign: 'center' }}>{p.big}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 20, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.cols} />
    </>
  );
}

const words3: GameDefinition<Payload, Answer> = {
  id: 'words-3',
  title: 'Слова 3',
  subject: 'language',
  levels: ['L3'],
  icon: '🔠',
  accent: '#FCE7F3',
  description: 'Синоніми й антоніми, алфавіт, г і ґ, звуки дж і дз, дати словами.',
  skillsFor: (d) => (d === 1
    ? ['language.word.l3.synonyms-antonyms']
    : d === 2 ? ['language.word.l3.alphabet-9']
    : ['language.sounds.l3.g-ge-dzh-dz', 'language.word.l3.numeral-dates']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'alpha') return { steps: [alphaSort(p.words).join(' → '), 'Дивимось на першу букву; якщо однакова — на другу.'] };
    return { steps: p.why };
  },
  generate,
  Component,
};

export default words3;
