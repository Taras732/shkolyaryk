import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Алфавіт і перенос» (11.10.2026) — 2 клас, програма Савченко [2 МОВ 4.1]:
 *  d1 — розстав 5 слів за алфавітом (тап по черзі; не та — хитається);
 *  d2 — як перенести слово (складами, не лишаючи одну букву, не розриваючи дж, дз, й з голосним, апостроф);
 *  d3 — апостроф: як правильно написати.
 */

export const ALPHABET = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';
const cmp = (a: string, b: string) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const d = ALPHABET.indexOf(a[i]) - ALPHABET.indexOf(b[i]);
    if (d) return d;
  }
  return a.length - b.length;
};
export const alphaSort = (ws: string[]) => [...ws].sort(cmp);

const WORDS = ['ананас', 'білка', 'вовк', 'груша', 'дуб', 'жаба', 'зебра', 'їжак', 'кіт', 'лев', 'мак', 'ніс', 'олень', 'пес', 'риба', 'сова', 'тигр', 'усмішка', 'хліб', 'цибуля', 'чай', 'шапка', 'юшка', 'яблуко',
  'малина', 'морква', 'миска', 'кит', 'качка', 'сир', 'сонце'];

/** Перенос: слово, правильні місця («мо-ло-ко»), хибний варіант з типовою помилкою. */
const HYPH: { right: string; wrong: string[]; rule: string }[] = [
  { right: 'мо-ло-ко', wrong: ['мол-око', 'м-олоко'], rule: 'Переносимо складами.' },
  { right: 'ка-пус-та', wrong: ['к-апуста', 'капус-т-а'], rule: 'Одну букву не лишаємо й не переносимо.' },
  { right: 'ли-сич-ка', wrong: ['лис-ичка', 'лисичк-а'], rule: 'Переносимо складами; одну букву не лишаємо.' },
  { right: 'бу-джо-ла', wrong: ['буд-жола', 'бу-дж-ола'], rule: 'Дж — один звук, його не розриваємо.' },
  { right: 'дзво-ник', wrong: ['д-звоник', 'дзв-оник'], rule: 'Дз — один звук, його не розриваємо.' },
  { right: 'чай-ник', wrong: ['ча-йник', 'ч-айник'], rule: 'Й не відриваємо від голосного перед ним.' },
  { right: 'мʼя-со', wrong: ['м-ʼясо', 'мʼ-ясо'], rule: 'Апостроф не відриваємо: він лишається з попередньою буквою.' },
  { right: 'ве-сел-ка', wrong: ['в-еселка', 'весел-к-а'], rule: 'Переносимо складами.' },
];

/** Апостроф: правильне написання й хибні. */
const APOS: { right: string; wrong: string[]; why: string }[] = [
  { right: 'мʼясо', wrong: ['мясо', 'мьясо'], why: 'Після губного [м] перед я — апостроф.' },
  { right: 'сімʼя', wrong: ['сімя', 'сімья'], why: 'Після губного [м] перед я — апостроф.' },
  { right: 'пʼять', wrong: ['пять', 'пьять'], why: 'Після губного [п] перед я — апостроф.' },
  { right: 'вʼюн', wrong: ['вюн', 'вьюн'], why: 'Після губного [в] перед ю — апостроф.' },
  { right: 'бʼє', wrong: ['бє', 'бьє'], why: 'Після губного [б] перед є — апостроф.' },
  { right: 'мʼяч', wrong: ['мяч', 'мьяч'], why: 'Після губного [м] перед я — апостроф.' },
  { right: 'подвірʼя', wrong: ['подвіря', 'подвірья'], why: 'Після [р] у кінці складу перед я — апостроф.' },
];

type Payload =
  | { mode: 'alpha'; words: string[] }
  | { mode: 'hyph' | 'apos'; options: string[]; rule: string };
type Answer = string;

const ROUNDS = 5;

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (difficulty === 1) {
    rounds = Array.from({ length: ROUNDS }, (_, i) => {
      // 5 слів з різними першими буквами — або (у 2 останніх раундах) з однаковою першою буквою на дві з них
      let words: string[];
      for (;;) {
        words = shuffle(WORDS).slice(0, 5);
        const firsts = new Set(words.map((w) => w[0]));
        if (i < 3 ? firsts.size === 5 : firsts.size === 4) break;
      }
      return { id: `r${i}`, payload: { mode: 'alpha', words }, answer: alphaSort(words).join(',') };
    });
  } else if (difficulty === 2) {
    rounds = shuffle(HYPH).slice(0, ROUNDS).map((h, i) => ({ id: `r${i}`, payload: { mode: 'hyph', options: shuffle([h.right, ...h.wrong]), rule: h.rule }, answer: h.right }));
  } else {
    rounds = shuffle(APOS).slice(0, ROUNDS).map((a, i) => ({ id: `r${i}`, payload: { mode: 'apos', options: shuffle([a.right, ...a.wrong]), rule: a.why }, answer: a.right }));
  }
  return { difficulty, rounds };
}

/** Тап по словах у порядку алфавіту; не те — хитається; зібрано — відповідь рядком. */
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

const PHRASES = {
  alpha: { key: 'p_ah_alpha', text: 'Розстав слова за алфавітом.' },
  hyph: { key: 'p_ah_hyph', text: 'Як правильно перенести слово?' },
  apos: { key: 'p_ah_apos', text: 'Як правильно написати?' },
} as const;

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
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id} />
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
    </>
  );
}

const alphaHyphen: GameDefinition<Payload, Answer> = {
  id: 'alpha-hyphen',
  title: 'Алфавіт і перенос',
  subject: 'language',
  levels: ['L3'],
  icon: '🔤',
  description: 'Слова за алфавітом, перенос складами, апостроф.',
  accent: '#EDE9FE',
  skillsFor: (d) => [d === 1 ? 'language.word.l2.alphabet-order' : d === 2 ? 'language.orth.l2.hyphenation' : 'language.orth.l2.apostrophe'],
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'alpha') return { steps: [alphaSort(p.words).join(' → '), 'Дивимось на першу букву; якщо однакова — на другу.'] };
    return { steps: [String(round.answer), p.rule] };
  },
  generate,
  Component,
};

export default alphaHyphen;
