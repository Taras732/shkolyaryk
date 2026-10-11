import { useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Речення і текст 2» (11.10.2026) — 2 клас, програма Савченко [2 МОВ 4.1–4.2, 3.1, 3.3]:
 *  d1 — вид речення за метою (розповідне / питальне / спонукальне); поширити речення словом за питанням;
 *  d2 — розповідь чи опис; найкращий заголовок;
 *  d3 — склади текст: три речення по порядку (зачин → основна частина → кінцівка).
 * Тексти власні, короткі.
 */

export const KINDS: { s: string; k: 'розповідне' | 'питальне' | 'спонукальне' }[] = [
  { s: 'Надворі падає сніг.', k: 'розповідне' }, { s: 'Котра зараз година?', k: 'питальне' }, { s: 'Закрий, будь ласка, двері.', k: 'спонукальне' },
  { s: 'У лісі живе їжачок.', k: 'розповідне' }, { s: 'Ти підеш з нами гуляти?', k: 'питальне' }, { s: 'Принеси мені книжку.', k: 'спонукальне' },
  { s: 'Мама пече пиріг.', k: 'розповідне' }, { s: 'Де мій олівець?', k: 'питальне' }, { s: 'Полий квіти.', k: 'спонукальне' },
];
export const EXTEND: { s: string; q: string; right: string; wrong: [string, string] }[] = [
  { s: 'Кіт спить', q: 'де?', right: 'на дивані', wrong: ['чорний', 'біжить'] },
  { s: 'Пташка співає', q: 'як?', right: 'дзвінко', wrong: ['пташка', 'гніздо'] },
  { s: 'Діти граються', q: 'де?', right: 'у дворі', wrong: ['веселі', 'грають'] },
  { s: 'Сонце світить', q: 'як?', right: 'яскраво', wrong: ['сонячний', 'небо'] },
  { s: 'Ми підемо в парк', q: 'коли?', right: 'завтра', wrong: ['зелений', 'парку'] },
];
/** Тексти: 3 речення по порядку, вид, заголовки (перший — найкращий). */
export const TEXTS: { s: [string, string, string]; type: 'розповідь' | 'опис'; titles: [string, string, string] }[] = [
  { s: ['Уранці Оля пішла до лісу.', 'Там вона знайшла маленького їжачка.', 'Оля тихенько поклала йому яблуко.'], type: 'розповідь', titles: ['Оля і їжачок', 'Яблуко', 'Ліс'] },
  { s: ['Наш кіт Мурчик зовсім рудий.', 'У нього зелені очі й довгі вуса.', 'Хвіст у Мурчика пухнастий, як щітка.'], type: 'опис', titles: ['Наш Мурчик', 'Зелені очі', 'Щітка'] },
  { s: ['Тато приніс додому ялинку.', 'Ми разом прикрасили її кульками.', 'Увечері на ялинці засвітилися вогники.'], type: 'розповідь', titles: ['Як ми прикрашали ялинку', 'Кульки', 'Тато'] },
  { s: ['Осінній парк дуже гарний.', 'Клени стоять червоні й золоті.', 'Під ногами шелестить жовте листя.'], type: 'опис', titles: ['Осінній парк', 'Червоні клени', 'Листя'] },
  { s: ['Петрик посадив у горщик зернятко.', 'Щодня він поливав його водою.', 'Через тиждень зʼявився зелений паросток.'], type: 'розповідь', titles: ['Зернятко Петрика', 'Вода', 'Горщик'] },
  { s: ['Моя лялька Ліза маленька.', 'У неї кучеряве волосся й синя сукня.', 'На ніжках — червоні черевички.'], type: 'опис', titles: ['Лялька Ліза', 'Синя сукня', 'Черевички'] },
  { s: ['Сашко вирішив зробити годівничку.', 'Він вирізав віконце в коробці з-під соку.', 'Тепер до годівнички щодня прилітають синички.'], type: 'розповідь', titles: ['Годівничка Сашка', 'Коробка', 'Сік'] },
  { s: ['Увечері пішов сильний дощ.', 'Уранці на подвірʼї зʼявилися великі калюжі.', 'Діти взули гумаки й побігли стрибати по калюжах.'], type: 'розповідь', titles: ['Після дощу', 'Гумаки', 'Подвірʼя'] },
];

type Payload =
  | { mode: 'kind'; s: string; options: string[] }
  | { mode: 'extend'; s: string; q: string; options: string[] }
  | { mode: 'type'; text: string; options: string[] }
  | { mode: 'title'; text: string; options: string[] }
  | { mode: 'order'; parts: string[] };
type Answer = string;


export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Omit<Round<Payload, Answer>, 'id'>[] = [];
  if (difficulty === 1) {
    for (const k of shuffle(KINDS).slice(0, 3)) items.push({ payload: { mode: 'kind', s: k.s, options: ['розповідне', 'питальне', 'спонукальне'] }, answer: k.k });
    for (const e of shuffle(EXTEND).slice(0, 2)) items.push({ payload: { mode: 'extend', s: e.s, q: e.q, options: shuffle([e.right, ...e.wrong]) }, answer: e.right });
  } else if (difficulty === 2) {
    const ts = shuffle(TEXTS).slice(0, 5);
    ts.forEach((t, i) => {
      const text = t.s.join(' ');
      if (i < 3) items.push({ payload: { mode: 'type', text, options: ['розповідь', 'опис'] }, answer: t.type });
      else items.push({ payload: { mode: 'title', text, options: shuffle([...t.titles]) }, answer: t.titles[0] });
    });
  } else {
    // лише розповіді: в описі порядок речень не однозначний (очі чи хвіст — неважливо), дитина могла б бути правою
    for (const t of shuffle(TEXTS.filter((x) => x.type === 'розповідь')).slice(0, 5)) items.push({ payload: { mode: 'order', parts: shuffle([...t.s]) }, answer: t.s.join(' ') });
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

/** Тап по реченнях у правильному порядку; не те — хитається. */
function OrderBoard({ parts, answer, disabled, onDone }: { parts: string[]; answer: string; disabled: boolean; onDone: (v: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const tap = (s: string) => {
    if (disabled || picked.includes(s)) return;
    const nx = [...picked, s];
    if (!answer.startsWith(nx.join(' '))) { setShake(s); window.setTimeout(() => setShake(null), 400); return; }
    setPicked(nx);
    if (nx.length === parts.length) window.setTimeout(() => onDone(nx.join(' ')), 300);
  };
  const LABEL = ['Зачин', 'Основна частина', 'Кінцівка'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {picked.map((s, k) => <div key={s} style={{ padding: '6px 10px', borderRadius: 12, background: '#DCFCE7', fontWeight: 700 }}><b>{LABEL[k]}:</b> {s}</div>)}
      {parts.filter((s) => !picked.includes(s)).map((s) => (
        <button key={s} type="button" onClick={() => tap(s)}
          style={{ border: 0, borderRadius: 14, padding: '10px 12px', fontSize: 16, fontWeight: 700, textAlign: 'left', background: '#fff', boxShadow: '0 4px 0 #E5E7EB', cursor: 'pointer', animation: shake === s ? 'pk-shake .4s ease' : undefined }}>
          {s}
        </button>
      ))}
    </div>
  );
}

const PHRASES = {
  kind: { key: 'p_t2_kind', text: 'Яке це речення за метою?' },
  extend: { key: 'p_t2_extend', text: 'Поширимо речення.' },
  type: { key: 'p_t2_type', text: 'Це розповідь чи опис?' },
  title: { key: 'p_t2_title', text: 'Який заголовок найкращий?' },
  order: { key: 'p_t2_order', text: 'Склади текст: що спочатку, що потім?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const textStyle = { fontSize: 17, fontWeight: 600, lineHeight: 1.5, textAlign: 'left' as const };
  if (p.mode === 'order') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id} />
        <OrderBoard key={round.id} parts={p.parts} answer={String(round.answer)} disabled={disabled} onDone={onAnswer} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={p.mode === 'extend' ? `${phrase.text} ${p.s} (${p.q}) …` : phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        {p.mode === 'kind' && <div style={{ ...textStyle, fontSize: 24, textAlign: 'center' }}>{p.s}</div>}
        {(p.mode === 'type' || p.mode === 'title') && <div style={textStyle}>{p.text}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 18, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={1} />
    </>
  );
}

const text2: GameDefinition<Payload, Answer> = {
  id: 'text-2',
  title: 'Речення і текст 2',
  subject: 'language',
  levels: ['L3'],
  icon: '📜',
  description: 'Види речень, поширене речення, розповідь чи опис, заголовок, порядок речень у тексті.',
  accent: '#E0F2FE',
  skillsFor: (d) => (d === 1 ? ['language.text.l2.sentence-types-purpose', 'language.text.l2.extend-sentence'] : d === 2 ? ['language.text.l2.text-types', 'language.text.l2.title-topic'] : ['language.reading.l2.text-parts', 'language.text.l2.compose-text']),
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'kind') return { steps: [p.s, round.answer === 'розповідне' ? 'Розповідаємо про щось — розповідне.' : round.answer === 'питальне' ? 'Питаємо — питальне.' : 'Просимо чи спонукаємо щось зробити — спонукальне.'] };
    if (p.mode === 'extend') return { steps: [`${p.s} ${round.answer}.`, `Слово «${round.answer}» відповідає на питання «${p.q}» і поширює речення.`] };
    if (p.mode === 'type') return { steps: [round.answer === 'розповідь' ? 'Тут події йдуть одна за одною — це розповідь.' : 'Тут розповідають, який предмет на вигляд, — це опис.'] };
    if (p.mode === 'title') return { steps: [`«${round.answer}» — про весь текст, а не про одну деталь.`] };
    return { steps: [String(round.answer), 'Зачин — початок, основна частина — що сталося, кінцівка — чим закінчилось.'] };
  },
  generate,
  Component,
};

export default text2;
