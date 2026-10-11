import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Речення і текст 3» (11.10.2026) — 3 клас, програма Савченко:
 *  d1 — підмет і присудок;
 *  d2 — другорядні члени речення; звертання й кома;
 *  d3 — тип тексту (розповідь, опис, міркування); простий план.
 * Речення й тексти власні, короткі.
 */

/** Речення (слова без розділових знаків): підмет, присудок. */
export const SP: { w: string[]; s: string; p: string }[] = [
  { w: ['Діти', 'малюють', 'сонце'], s: 'Діти', p: 'малюють' },
  { w: ['Білка', 'стрибає', 'по', 'гілках'], s: 'Білка', p: 'стрибає' },
  { w: ['Мама', 'пече', 'смачний', 'пиріг'], s: 'Мама', p: 'пече' },
  { w: ['Хлопчик', 'читає', 'цікаву', 'книжку'], s: 'Хлопчик', p: 'читає' },
  { w: ['Над', 'лісом', 'світить', 'місяць'], s: 'місяць', p: 'світить' },
  { w: ['Ми', 'вирушили', 'в', 'похід'], s: 'Ми', p: 'вирушили' },
  { w: ['Під', 'деревом', 'спить', 'кіт'], s: 'кіт', p: 'спить' },
  { w: ['Вчителька', 'розповідає', 'казку'], s: 'Вчителька', p: 'розповідає' },
  { w: ['Улітку', 'цвітуть', 'соняшники'], s: 'соняшники', p: 'цвітуть' },
  { w: ['Собака', 'гавкає', 'на', 'кота'], s: 'Собака', p: 'гавкає' },
];
/** Три слова: підмет, присудок, один другорядний. */
export const SEC: { w: string[]; s: string; p: string; sec: string }[] = [
  { w: ['Мама', 'пече', 'пиріг'], s: 'Мама', p: 'пече', sec: 'пиріг' },
  { w: ['Діти', 'малюють', 'сонце'], s: 'Діти', p: 'малюють', sec: 'сонце' },
  { w: ['Птахи', 'співають', 'весело'], s: 'Птахи', p: 'співають', sec: 'весело' },
  { w: ['Тато', 'читає', 'газету'], s: 'Тато', p: 'читає', sec: 'газету' },
  { w: ['Оля', 'купила', 'хліб'], s: 'Оля', p: 'купила', sec: 'хліб' },
  { w: ['Сніг', 'падає', 'тихо'], s: 'Сніг', p: 'падає', sec: 'тихо' },
  { w: ['Учень', 'пише', 'диктант'], s: 'Учень', p: 'пише', sec: 'диктант' },
  { w: ['Вдома', 'спить', 'кіт'], s: 'кіт', p: 'спить', sec: 'Вдома' },
  { w: ['Тихо', 'падає', 'сніг'], s: 'сніг', p: 'падає', sec: 'Тихо' },
  { w: ['Ластівки', 'летять', 'високо'], s: 'Ластівки', p: 'летять', sec: 'високо' },
];
/** Звертання: слова, після якого слова кома (індекс), кінцевий знак. */
export const ADDR: { w: string[]; k: number; end: '.' | '!'; v: string }[] = [
  { w: ['Мамо', 'ходи', 'сюди'], k: 0, end: '!', v: 'Мамо' },
  { w: ['Оленко', 'подай', 'мені', 'зошит'], k: 0, end: '.', v: 'Оленко' },
  { w: ['Добрий', 'день', 'Іванку'], k: 1, end: '!', v: 'Іванку' },
  { w: ['Друже', 'дякую', 'за', 'допомогу'], k: 0, end: '!', v: 'Друже' },
  { w: ['Бабусю', 'я', 'тебе', 'люблю'], k: 0, end: '!', v: 'Бабусю' },
  { w: ['Я', 'тебе', 'люблю', 'бабусю'], k: 2, end: '!', v: 'бабусю' },
  { w: ['Ірино', 'відкрий', 'вікно'], k: 0, end: '.', v: 'Ірино' },
];
export const withComma = (w: string[], k: number | null, end: string) =>
  w.map((x, i) => (i === k ? `${x},` : x)).join(' ') + end;

type TextType = 'розповідь' | 'опис' | 'міркування';
export const TYPES: { t: string; type: TextType }[] = [
  { t: 'Уранці Софійка пішла в парк. Там вона побачила білку. Дівчинка дала їй горішок.', type: 'розповідь' },
  { t: 'Максим знайшов у дворі мʼячик. Він покликав друзів, і вони пограли у футбол. Потім усі пішли додому.', type: 'розповідь' },
  { t: 'Влітку ми поїхали до бабусі. Ми допомагали їй збирати яблука. Увечері ми пили чай із варенням.', type: 'розповідь' },
  { t: 'У нашого пса Рексика густа руда шерсть. Вуха в нього стоять сторчма, а ніс мокрий і чорний.', type: 'опис' },
  { t: 'Наша класна кімната світла й простора. Біля вікна стоять парти, а на стіні висить велика карта.', type: 'опис' },
  { t: 'Осінній ліс дуже гарний. Дерева стоять жовті та червоні, а під ногами шарудить листя.', type: 'опис' },
  { t: 'Книжки треба берегти, бо ними користуються багато дітей. Тому не можна їх малювати й рвати.', type: 'міркування' },
  { t: 'Взимку птахам важко знайти їжу, тому їх треба підгодовувати. Отже, повісимо годівничку.', type: 'міркування' },
  { t: 'Зарядку варто робити щоранку, бо вона додає сил. Тому я роблю її щодня.', type: 'міркування' },
];
const TYPE_WHY: Record<TextType, string> = {
  розповідь: 'Події йдуть одна за одною — це розповідь.',
  опис: 'Тут розповідають, який предмет на вигляд, — це опис.',
  міркування: 'Є «бо» чи «тому» і висновок — це міркування.',
};
/** Текст із 3 речень і план із 3 пунктів у правильному порядку. */
export const PLANS: { t: string; plan: [string, string, string] }[] = [
  { t: 'Тарас знайшов у дворі кошеня. Він приніс його додому й напоїв молоком. Тепер кошеня живе в їхній родині.',
    plan: ['Знахідка кошеняти', 'Турбота про кошеня', 'Кошеня в родині'] },
  { t: 'Уранці діти зібрали рюкзаки. Потім вони поїхали автобусом до лісу. Увечері всі повернулися додому.',
    plan: ['Збирання рюкзаків', 'Поїздка до лісу', 'Повернення додому'] },
  { t: 'Оля посадила зернятко в горщик. Через кілька днів зʼявився паросток. Згодом він став квіткою.',
    plan: ['Посадили зернятко', 'Зʼявився паросток', 'Паросток став квіткою'] },
  { t: 'Тато приніс ялинку. Ми разом прикрасили її. Увечері засвітилися вогники.',
    plan: ['Тато приніс ялинку', 'Прикрашання ялинки', 'Вогники на ялинці'] },
];

type Mode = 'subject' | 'predicate' | 'secondary' | 'comma' | 'type' | 'plan';
type Payload =
  | { mode: 'subject' | 'predicate' | 'secondary' | 'comma' | 'type'; q: string; big?: string; text?: string; options: string[]; why: string[]; cols: number }
  | { mode: 'plan'; q: string; text: string; parts: string[]; why: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;
const pick = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);
const sentence = (w: string[]) => `${w.join(' ')}.`;

function d1(): Item[] {
  return pick(SP, 5).map((x, i): Item => {
    const subj = i % 2 === 0;
    return {
      payload: { mode: subj ? 'subject' : 'predicate', q: subj ? 'Яке слово — підмет?' : 'Яке слово — присудок?', big: sentence(x.w), options: [...x.w], cols: 2,
        why: subj ? [`Підмет відповідає на питання «хто?» або «що?» — тут «${x.s}».`] : [`Присудок каже, що робить підмет, — тут «${x.p}».`, `Підмет — «${x.s}».`] },
      answer: subj ? x.s : x.p,
    };
  });
}

function d2(): Item[] {
  const sec = pick(SEC, 3).map((x): Item => ({
    payload: { mode: 'secondary', q: 'Яке слово — другорядний член речення?', big: sentence(x.w), options: [...x.w], cols: 1,
      why: [`«${x.s}» — підмет, «${x.p}» — присудок.`, `Слово «${x.sec}» їх пояснює — це другорядний член.`] },
    answer: x.sec,
  }));
  const addr = pick(ADDR, 2).map((x): Item => {
    const right = withComma(x.w, x.k, x.end);
    const others = [...Array(x.w.length - 1).keys()].filter((j) => j !== x.k);
    const wrong = [withComma(x.w, null, x.end), withComma(x.w, shuffle(others)[0], x.end)];
    return {
      payload: { mode: 'comma', q: 'Де правильно поставлена кома?', options: shuffle([right, ...wrong]), cols: 1,
        why: [right, `«${x.v}» — звертання (до кого говоримо). Його відокремлюємо комою.`] },
      answer: right,
    };
  });
  return [...sec, ...addr];
}

function d3(): Item[] {
  const types = pick(TYPES, 3).map((x): Item => ({
    payload: { mode: 'type', q: 'Який це текст?', text: x.t, options: ['розповідь', 'опис', 'міркування'], cols: 1, why: [TYPE_WHY[x.type]] },
    answer: x.type,
  }));
  const plans = pick(PLANS, 2).map((x): Item => ({
    payload: { mode: 'plan', q: 'Склади план: що спочатку, що потім?', text: x.t, parts: shuffle([...x.plan]), why: [x.plan.join(' → '), 'План іде в порядку подій у тексті.'] },
    answer: x.plan.join('|'),
  }));
  return [...types, ...plans];
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items = difficulty === 1 ? d1() : difficulty === 2 ? d2() : d3();
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

function OrderBoard({ parts, answer, disabled, onDone }: { parts: string[]; answer: string; disabled: boolean; onDone: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const order = answer.split('|');
  const tap = (s: string) => {
    if (disabled || picked.includes(s)) return;
    if (s !== order[picked.length]) { setShake(s); window.setTimeout(() => setShake(null), 400); return; }
    const nx = [...picked, s];
    setPicked(nx);
    if (nx.length === parts.length) window.setTimeout(() => onDone(nx.join('|')), 300);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {picked.map((s, k) => <div key={s} style={{ padding: '6px 10px', borderRadius: 12, background: '#DCFCE7', fontWeight: 700 }}>{k + 1}. {s}</div>)}
      {parts.filter((s) => !picked.includes(s)).map((s) => (
        <button key={s} type="button" onClick={() => tap(s)}
          style={{ border: 0, borderRadius: 14, padding: '10px 12px', fontSize: 16, fontWeight: 700, textAlign: 'left', background: '#fff', boxShadow: '0 4px 0 #E5E7EB', cursor: 'pointer', animation: shake === s ? 'pk-shake .4s ease' : undefined }}>
          {s}
        </button>
      ))}
    </div>
  );
}

const PHRASES: Record<Mode, { key: string; text: string }> = {
  subject: { key: 'p_s3_subject', text: 'Яке слово — підмет?' },
  predicate: { key: 'p_s3_predicate', text: 'Яке слово — присудок?' },
  secondary: { key: 'p_s3_secondary', text: 'Яке слово — другорядний член речення?' },
  comma: { key: 'p_s3_comma', text: 'Де правильно поставлена кома?' },
  type: { key: 'p_s3_type', text: 'Який це текст: розповідь, опис чи міркування?' },
  plan: { key: 'p_s3_plan', text: 'Склади план: що спочатку, що потім?' },
};

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const text = { fontSize: 17, fontWeight: 600, lineHeight: 1.5, textAlign: 'left' as const };
  if (p.mode === 'plan') {
    return (
      <>
        <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
          <div style={text}>{p.text}</div>
        </PromptCard>
        <OrderBoard key={round.id} parts={p.parts} answer={round.answer} disabled={disabled} onDone={onAnswer} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.big && <div style={{ fontSize: 24, fontWeight: 900, textAlign: 'center' }}>{p.big}</div>}
        {p.text && <div style={text}>{p.text}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 19, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.cols} />
    </>
  );
}

const sentence3: GameDefinition<Payload, Answer> = {
  id: 'sentence-3',
  title: 'Речення і текст 3',
  subject: 'language',
  levels: ['L3'],
  icon: '✍️',
  accent: '#E0F2FE',
  description: 'Підмет і присудок, другорядні члени, звертання, тип тексту й план.',
  skillsFor: (d) => (d === 1
    ? ['language.text.l3.subject-predicate']
    : d === 2 ? ['language.text.l3.secondary-members', 'language.text.l3.address-punctuation']
    : ['language.text.l3.text-types', 'language.text.l3.text-plan']),
  explain: (round) => ({ steps: round.payload.why }),
  generate,
  Component,
};

export default sentence3;
