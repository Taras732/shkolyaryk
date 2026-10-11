import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Слова 2» (11.10.2026) — 2 клас, програма Савченко [2 МОВ 4.1–4.2]:
 *  d1 — один → багато; яке слово відповідає на «скільки?» (числівник);
 *  d2 — словосполучення: прикметник до іменника (рід і число); до якого питання належить слово;
 *  d3 — наголос змінює значення (зАмок / замОк); службові слова пишемо окремо (в хаті).
 * Наголошену голосну показуємо великою літерою (зАмок) — так у підручниках для 2 класу.
 */

export const PLURAL: [string, string, string, string][] = [
  ['кіт', 'коти', 'котів', 'кота'], ['стіл', 'столи', 'столів', 'стола'], ['книжка', 'книжки', 'книжок', 'книжку'],
  ['дерево', 'дерева', 'дерев', 'деревом'], ['мʼяч', 'мʼячі', 'мʼячів', 'мʼяча'], ['вікно', 'вікна', 'вікон', 'вікном'],
  ['рука', 'руки', 'рук', 'руку'], ['гриб', 'гриби', 'грибів', 'гриба'],
];
export const NUMERAL: { s: string; num: string }[] = [
  { s: 'У кошику три яблука.', num: 'три' }, { s: 'На гілці сиділо пʼять пташок.', num: 'пʼять' },
  { s: 'Я маю чотири олівці.', num: 'чотири' }, { s: 'У лісі жили сім гномів.', num: 'сім' }, { s: 'Тато приніс два кавуни.', num: 'два' },
];
type G = 'm' | 'f' | 'n' | 'pl';
const FEM = new Set(['книжка', 'рука']);
const NEUT = new Set(['дерево', 'вікно']);
const NOUNS: { w: string; g: G }[] = [
  { w: 'день', g: 'm' }, { w: 'ліс', g: 'm' }, { w: 'кіт', g: 'm' }, { w: 'книжка', g: 'f' }, { w: 'річка', g: 'f' }, { w: 'погода', g: 'f' },
  { w: 'сонце', g: 'n' }, { w: 'море', g: 'n' }, { w: 'яблуко', g: 'n' }, { w: 'квіти', g: 'pl' }, { w: 'дні', g: 'pl' },
];
const ADJ: Record<string, Record<G, string>> = {
  теплий: { m: 'теплий', f: 'тепла', n: 'тепле', pl: 'теплі' },
  великий: { m: 'великий', f: 'велика', n: 'велике', pl: 'великі' },
  гарний: { m: 'гарний', f: 'гарна', n: 'гарне', pl: 'гарні' },
};
export const GROUPS: { w: string; q: string }[] = [
  { w: 'сонце', q: 'що?' }, { w: 'мама', q: 'хто?' }, { w: 'пташка', q: 'хто?' }, { w: 'зелений', q: 'який?' },
  { w: 'весела', q: 'яка?' }, { w: 'біжить', q: 'що робить?' }, { w: 'співають', q: 'що роблять?' }, { w: 'пʼять', q: 'скільки?' },
];
const QUESTIONS = ['хто?', 'що?', 'який?', 'яка?', 'що робить?', 'що роблять?', 'скільки?'];
export const STRESS: { e: string; right: string; wrong: string; what: string }[] = [
  { e: '🏰', right: 'зАмок', wrong: 'замОк', what: 'палац' }, { e: '🔒', right: 'замОк', wrong: 'зАмок', what: 'на дверях' },
  { e: '🛣️', right: 'дорОга', wrong: 'дОрога', what: 'шлях' }, { e: '🌾', right: 'мукА', wrong: 'мУка', what: 'борошно' },
  { e: '🗺️', right: 'Атлас', wrong: 'атлАс', what: 'книжка з картами' },
];
export const FUNC: { right: string; wrong: string }[] = [
  { right: 'в хаті', wrong: 'вхаті' }, { right: 'на столі', wrong: 'настолі' }, { right: 'під деревом', wrong: 'піддеревом' },
  { right: 'з мамою', wrong: 'змамою' }, { right: 'у лісі', wrong: 'улісі' }, { right: 'до школи', wrong: 'дошколи' },
];

type Payload =
  | { mode: 'plural'; one: string; options: string[] }
  | { mode: 'numeral'; s: string; options: string[] }
  | { mode: 'phrase'; noun: string; g: G; adj: string; options: string[] }
  | { mode: 'group'; w: string; options: string[] }
  | { mode: 'stress'; e: string; options: string[] }
  | { mode: 'func'; options: string[] };
type Answer = string;

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const make = (i: number): Omit<Round<Payload, Answer>, 'id'> => {
    if (difficulty === 1) {
      if (i < 3) { const [one, many, w1, w2] = pick(PLURAL); return { payload: { mode: 'plural', one, options: shuffle([many, w1, w2]) }, answer: many }; }
      const n = pick(NUMERAL);
      const words = n.s.replace('.', '').split(' ').filter((w) => w !== n.num && w.length > 2);
      return { payload: { mode: 'numeral', s: n.s, options: shuffle([n.num, ...shuffle(words).slice(0, 2)]) }, answer: n.num };
    }
    if (difficulty === 2) {
      if (i < 3) {
        const n = pick(NOUNS), adj = pick(Object.keys(ADJ)), forms = ADJ[adj];
        const right = forms[n.g];
        return { payload: { mode: 'phrase', noun: n.w, g: n.g, adj, options: shuffle([right, ...shuffle(Object.values(forms).filter((f) => f !== right)).slice(0, 2)]) }, answer: right };
      }
      const g = pick(GROUPS);
      return { payload: { mode: 'group', w: g.w, options: shuffle([g.q, ...shuffle(QUESTIONS.filter((q) => q !== g.q)).slice(0, 2)]) }, answer: g.q };
    }
    if (i < 3) { const s = pick(STRESS); return { payload: { mode: 'stress', e: s.e, options: shuffle([s.right, s.wrong]) }, answer: s.right }; }
    const f = pick(FUNC);
    return { payload: { mode: 'func', options: shuffle([f.right, f.wrong]) }, answer: f.right };
  };
  // без однакових завдань поспіль у сесії
  const seen = new Set<string>();
  const rounds: Round<Payload, Answer>[] = [];
  for (let i = 0, tries = 0; rounds.length < 5 && tries < 200; tries++) {
    const r = make(i);
    const key = JSON.stringify(r.payload).slice(0, 40) + r.answer;
    if (seen.has(key)) continue;
    seen.add(key);
    rounds.push({ ...r, id: `r${rounds.length}` });
    i++;
  }
  return { difficulty, rounds: shuffle(rounds).map((r, k) => ({ ...r, id: `r${k}` })) };
}

const PHRASES = {
  plural: { key: 'p_w2_plural2', text: 'Один — два. Як сказати?' },
  numeral: { key: 'p_w2_numeral', text: 'Яке слово відповідає на питання «скільки?»' },
  phrase: { key: 'p_w2_phrase', text: 'Яке слово підходить?' },
  group: { key: 'p_w2_group', text: 'На яке питання відповідає слово?' },
  stress: { key: 'p_w2_stress', text: 'Де наголос у цьому слові?' },
  func: { key: 'p_w2_func', text: 'Як правильно написати?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 32, fontWeight: 900, textAlign: 'center' as const, fontFamily: 'var(--font-round)' };
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        {/* «два», а не «багато»: після «багато» правильно «котів», і дитина мала б рацію */}
        {p.mode === 'plural' && <div style={big}>{FEM.has(p.one) ? 'одна' : NEUT.has(p.one) ? 'одне' : 'один'} {p.one} → {FEM.has(p.one) ? 'дві' : 'два'} …</div>}
        {p.mode === 'numeral' && <div style={{ ...big, fontSize: 24 }}>{p.s}</div>}
        {p.mode === 'phrase' && <div style={big}>___ {p.noun}</div>}
        {p.mode === 'group' && <div style={big}>{p.w}</div>}
        {p.mode === 'stress' && <div style={{ fontSize: 64, textAlign: 'center' }}>{p.e}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 22, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.options.length === 2 ? 2 : 1} />
    </>
  );
}

const words2: GameDefinition<Payload, Answer> = {
  id: 'words-2',
  title: 'Слова 2',
  subject: 'language',
  levels: ['L3'],
  icon: '🧩',
  description: 'Один — багато, скільки?, словосполучення, питання до слова, наголос, службові слова.',
  accent: '#FEF9C3',
  skillsFor: (d) => (d === 1 ? ['language.word.l2.plural', 'language.word.l2.numeral-intro'] : d === 2 ? ['language.word.l2.phrases', 'language.word.l2.word-groups'] : ['language.word.l2.stress-meaning', 'language.word.l2.function-words']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'plural') return { steps: [`${FEM.has(p.one) ? 'одна' : NEUT.has(p.one) ? 'одне' : 'один'} ${p.one} — ${FEM.has(p.one) ? 'дві' : 'два'} ${round.answer}`, 'Слово змінюється за числом: один — багато.'] };
    if (p.mode === 'numeral') return { steps: [`«${round.answer}» відповідає на питання «скільки?».`, 'Такі слова називають число предметів.'] };
    if (p.mode === 'phrase') return { steps: [`${round.answer} ${p.noun}`, `${p.noun} — ${p.g === 'm' ? 'він (мій)' : p.g === 'f' ? 'вона (моя)' : p.g === 'n' ? 'воно (моє)' : 'вони (мої)'}, тож і ознака така сама.`] };
    if (p.mode === 'group') return { steps: [`${p.w} — ${round.answer}`] };
    if (p.mode === 'stress') { const s = STRESS.find((x) => x.e === p.e)!; return { steps: [`${s.right} — ${s.what} ${s.e}`, `${s.wrong} — інше слово: наголос змінює значення.`] }; }
    return { steps: [String(round.answer), 'Маленькі слова в, на, під, з, у, до пишемо окремо від інших слів.'] };
  },
  generate,
  Component,
};

export default words2;
