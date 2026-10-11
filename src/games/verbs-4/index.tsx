import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Дієслово, займенник, прислівник» (11.10.2026) — 4 клас, програма Савченко:
 *  d1 — особа і число дієслова;
 *  d2 — -ться чи -тся / -шся у дієсловах;
 *  d3 — особові займенники (замість іменника) і прислівник (як? де? коли?).
 */

export const PERSONS = ['1 особа, однина', '2 особа, однина', '3 особа, однина', '1 особа, множина', '2 особа, множина', '3 особа, множина'] as const;
export const VERBS: { s: string; v: string; pron: string; a: (typeof PERSONS)[number] }[] = [
  { s: 'Я читаю цікаву книжку.', v: 'читаю', pron: 'я', a: '1 особа, однина' },
  { s: 'Ти малюєш квіти.', v: 'малюєш', pron: 'ти', a: '2 особа, однина' },
  { s: 'Вона плаває в басейні.', v: 'плаває', pron: 'вона', a: '3 особа, однина' },
  { s: 'Ми співаємо українські пісні.', v: 'співаємо', pron: 'ми', a: '1 особа, множина' },
  { s: 'Ви з Іринкою читаєте голосно.', v: 'читаєте', pron: 'ви', a: '2 особа, множина' },
  { s: 'Діти біжать до школи.', v: 'біжать', pron: 'вони', a: '3 особа, множина' },
  { s: 'Сестра малює мого песика.', v: 'малює', pron: 'вона', a: '3 особа, однина' },
  { s: 'Ми з братом збираємо гриби.', v: 'збираємо', pron: 'ми', a: '1 особа, множина' },
  { s: 'Ти знаєш відповідь.', v: 'знаєш', pron: 'ти', a: '2 особа, однина' },
  { s: 'Мама пече пиріг.', v: 'пече', pron: 'вона', a: '3 особа, однина' },
  { s: 'Птахи летять на південь.', v: 'летять', pron: 'вони', a: '3 особа, множина' },
  { s: 'Я допомагаю бабусі.', v: 'допомагаю', pron: 'я', a: '1 особа, однина' },
];

export const REFL: { s: string; right: string; wrong: [string, string, string]; rule: string }[] = [
  { s: 'Він ___ у третьому класі (вчитися).', right: 'вчиться', wrong: ['вчится', 'вчишся', 'вчитися'], rule: 'Він — що робить? — вчиться. Після -т- пишемо ь: -ться.' },
  { s: 'Ти голосно ___ (сміятися).', right: 'смієшся', wrong: ['смієтся', 'сміється', 'сміятися'], rule: 'Ти — закінчення -шся: смієшся.' },
  { s: 'Вони щоранку ___ холодною водою (митися).', right: 'миються', wrong: ['мияться', 'миєтся', 'миєшся'], rule: 'Вони — що роблять? — миються. Закінчення -ться.' },
  { s: 'Я ___ у річці (купатися).', right: 'купаюся', wrong: ['купається', 'купаєшся', 'купаєтся'], rule: 'Я — закінчення -юся: купаюся.' },
  { s: 'Дівчинка ___ перед сніданком (вмиватися).', right: 'вмивається', wrong: ['вмиваєтся', 'вмиваєшся', 'вмиватися'], rule: 'Вона — що робить? — вмивається. Закінчення -ться.' },
  { s: 'Ми ___ до школи (збиратися).', right: 'збираємося', wrong: ['збирається', 'збираєшся', 'збираються'], rule: 'Ми — закінчення -мося: збираємося.' },
  { s: 'Ти ___ у дворі? (гратися)', right: 'граєшся', wrong: ['грається', 'граєтся', 'гратися'], rule: 'Ти — закінчення -шся: граєшся.' },
  { s: 'Діти ___ у дворі (гратися).', right: 'граються', wrong: ['грається', 'граєтся', 'граєшся'], rule: 'Вони — що роблять? — граються. Закінчення -ться.' },
  { s: 'Мама мені ___ (усміхатися).', right: 'усміхається', wrong: ['усміхаєтся', 'усміхаєшся', 'усміхатися'], rule: 'Вона — що робить? — усміхається. Закінчення -ться.' },
];

const PRONOUNS = ['я', 'ти', 'він', 'вона', 'воно', 'ми', 'ви', 'вони'];
export const SUBJECTS: { s: string; subj: string; a: string }[] = [
  { s: 'Оля читає цікаву книжку.', subj: 'Оля', a: 'вона' },
  { s: 'Кіт спить на дивані.', subj: 'Кіт', a: 'він' },
  { s: 'Діти граються у дворі.', subj: 'Діти', a: 'вони' },
  { s: 'Сонце світить яскраво.', subj: 'Сонце', a: 'воно' },
  { s: 'Мама і я йдемо на ринок.', subj: 'Мама і я', a: 'ми' },
  { s: 'Ти і Петрик співаєте.', subj: 'Ти і Петрик', a: 'ви' },
  { s: 'Богдан і Назар малюють.', subj: 'Богдан і Назар', a: 'вони' },
  { s: 'Дівчинка пливе до берега.', subj: 'Дівчинка', a: 'вона' },
];

/** Прислівник: рівно одне слово з чотирьох відповідає на питання як? де? коли? */
export const ADVERBS: { s: string; options: [string, string, string, string]; a: string; q: string }[] = [
  { s: 'Вчора ми ходили до парку.', options: ['вчора', 'ми', 'ходили', 'парку'], a: 'вчора', q: 'коли?' },
  { s: 'Орел літає високо над горами.', options: ['орел', 'літає', 'високо', 'горами'], a: 'високо', q: 'як?' },
  { s: 'Діти весело співають пісні.', options: ['діти', 'весело', 'співають', 'пісні'], a: 'весело', q: 'як?' },
  { s: 'Вгорі летить білий літак.', options: ['вгорі', 'летить', 'білий', 'літак'], a: 'вгорі', q: 'де?' },
  { s: 'Завтра ми підемо в зоопарк.', options: ['завтра', 'ми', 'підемо', 'зоопарк'], a: 'завтра', q: 'коли?' },
  { s: 'Сусідський собака гавкає голосно.', options: ['сусідський', 'собака', 'гавкає', 'голосно'], a: 'голосно', q: 'як?' },
  { s: 'Тут росте стара груша.', options: ['тут', 'росте', 'стара', 'груша'], a: 'тут', q: 'де?' },
];

type Payload =
  | { mode: 'person'; s: string; v: string; pron: string; options: string[] }
  | { mode: 'refl'; s: string; rule: string; options: string[] }
  | { mode: 'pron'; s: string; subj: string; options: string[] }
  | { mode: 'adv'; s: string; q: string; options: string[] };
type Answer = string;

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (const x of shuffle(VERBS).slice(0, 5)) {
      const options = shuffle([x.a, ...shuffle(PERSONS.filter((p) => p !== x.a)).slice(0, 3)]);
      items.push({ payload: { mode: 'person', s: x.s, v: x.v, pron: x.pron, options }, answer: x.a });
    }
  } else if (difficulty === 2) {
    for (const x of shuffle(REFL).slice(0, 5)) items.push({ payload: { mode: 'refl', s: x.s, rule: x.rule, options: shuffle([x.right, ...x.wrong]) }, answer: x.right });
  } else {
    for (const x of shuffle(SUBJECTS).slice(0, 3)) {
      const options = shuffle([x.a, ...shuffle(PRONOUNS.filter((p) => p !== x.a)).slice(0, 3)]);
      items.push({ payload: { mode: 'pron', s: x.s, subj: x.subj, options }, answer: x.a });
    }
    for (const x of shuffle(ADVERBS).slice(0, 2)) items.push({ payload: { mode: 'adv', s: x.s, q: x.q, options: shuffle([...x.options]) }, answer: x.a });
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES = {
  person: { key: 'p_v4_person', text: 'Яка особа і число у виділеного дієслова?' },
  refl: { key: 'p_v4_refl', text: 'Вибери правильне слово.' },
  pron: { key: 'p_v4_pron', text: 'Яким займенником замінити виділене слово?' },
  adv: { key: 'p_v4_adv', text: 'Яке слово відповідає на питання як? де? коли?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const big = { fontSize: 22, fontWeight: 800, lineHeight: 1.4 } as const;
  const hl = { background: '#FEF08A', borderRadius: 6, padding: '0 4px' } as const;
  const question =
    p.mode === 'person' ? `Яка особа і число в слова «${p.v}»?`
      : p.mode === 'pron' ? `Яким займенником замінити «${p.subj}»?`
        : p.mode === 'adv' ? 'Яке слово відповідає на питання як? де? коли?'
          : 'Вибери правильне слово.';
  const wide = p.mode === 'person';
  return (
    <>
      <PromptCard question={question} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'person' && <div style={big}>{p.s.split(p.v).flatMap((part, i, arr) => (i < arr.length - 1 ? [part, <span key={i} style={hl}>{p.v}</span>] : [part]))}</div>}
        {p.mode === 'pron' && <div style={big}>{p.s.split(p.subj).flatMap((part, i, arr) => (i < arr.length - 1 ? [part, <span key={i} style={hl}>{p.subj}</span>] : [part]))}</div>}
        {(p.mode === 'refl' || p.mode === 'adv') && <div style={big}>{p.s}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: wide ? 17 : 19, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const verbs4: GameDefinition<Payload, Answer> = {
  id: 'verbs-4',
  title: 'Дієслово, займенник, прислівник',
  subject: 'language',
  levels: ['L3'],
  icon: '🏃',
  description: 'Особа і число дієслова, -ться чи -шся, займенники замість іменників і прислівник.',
  accent: '#DCFCE7',
  skillsFor: (d) => (d === 1 ? ['language.word.l4.verb-person-number'] : d === 2 ? ['language.orth.l4.reflexive-sya-tsya'] : ['language.word.l4.pronoun-person', 'language.word.l4.adverb-intro']),
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'person') return { steps: [`Підстав займенник: ${p.pron} ${p.v}.`, `Це ${round.answer}.`] };
    if (p.mode === 'refl') return { steps: [p.s.replace('___', String(round.answer)), p.rule] };
    if (p.mode === 'pron') return { steps: [`Замість «${p.subj}» кажемо «${round.answer}».`, 'Займенник вказує на предмет, не називаючи його.'] };
    return { steps: [`«${round.answer}» відповідає на питання ${p.q}`, 'Це прислівник: показує ознаку дії — як, де чи коли вона відбувається.'] };
  },
  generate,
  Component,
};

export default verbs4;
