import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle, randInt } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Письмові дії» (11.10.2026) — 4 клас, письмові обчислення у стовпчик:
 *  d1 — багатоцифрове · і : на одноцифрове (ділення без остачі);
 *  d2 — множення на двоцифрове;
 *  d3 — ділення на двоцифрове без остачі.
 * Хибні варіанти — типові помилки: забутий перенос, відсутній зсув, зсув не на той розряд.
 */

export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function pick3(ans: number, cands: number[]): number[] {
  const out: number[] = [];
  const ok = (c: number) => Number.isInteger(c) && c > 0 && c !== ans && !out.includes(c);
  for (const c of shuffle(cands)) if (ok(c) && out.length < 3) out.push(c);
  for (const k of [10, 100, 1, 1000]) for (const c of [ans + k, ans - k]) if (out.length < 3 && ok(c)) out.push(c);
  return out;
}

/** число без переносу: кожну цифру множимо окремо, лишаємо останню цифру добутку */
export function noCarryMul(a: number, b: number): number {
  return Number(String(a).split('').map((d) => (Number(d) * b) % 10).join(''));
}

type Payload =
  | { mode: 'mul1'; a: number; b: number; options: string[] }
  | { mode: 'div1'; a: number; b: number; options: string[] }
  | { mode: 'mul2'; a: number; b: number; options: string[] }
  | { mode: 'div2'; a: number; b: number; options: string[] };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;

function mul1(): Item {
  for (;;) {
    const a = randInt(1100, 9499);
    const b = randInt(2, 9);
    const ans = a * b;
    if (noCarryMul(a, b) === ans || String(a).includes('0')) continue;
    const opts = [ans, ...pick3(ans, [noCarryMul(a, b), ans + 100, ans - 10, ans + 1000, ans - 100])];
    if (opts.length === 4) return { payload: { mode: 'mul1', a, b, options: shuffle(opts.map(fmt)) }, answer: fmt(ans) };
  }
}

function div1(): Item {
  for (;;) {
    const q = randInt(101, 399);
    const b = randInt(2, 9);
    const a = q * b;
    const s = String(q);
    const wrong = [q + 10, q - 10, q * 10, Number(s[1] + s[0] + s[2]), Number(s[0] + s[2]), q + 1];
    const opts = [q, ...pick3(q, wrong)];
    if (opts.length === 4) return { payload: { mode: 'div1', a, b, options: shuffle(opts.map(fmt)) }, answer: fmt(q) };
  }
}

function mul2(): Item {
  for (;;) {
    const a = randInt(112, 489);
    const b = randInt(12, 49);
    const t = Math.floor(b / 10);
    const u = b % 10;
    if (u < 2 || String(a).includes('0')) continue;
    const ans = a * b;
    const noShift = a * u + a * t;
    const shift100 = a * u + a * t * 100;
    const opts = [ans, ...pick3(ans, [noShift, shift100, ans - 10, ans + 100, ans - a])];
    if (opts.length === 4) return { payload: { mode: 'mul2', a, b, options: shuffle(opts.map(fmt)) }, answer: fmt(ans) };
  }
}

function div2(): Item {
  for (;;) {
    const b = randInt(11, 29);
    const q = randInt(12, 79);
    const a = b * q;
    if (a < 200) continue;
    const s = String(q);
    const wrong = [q + 10, q - 10, Number(s[1] + s[0]), q + 1, q - 1, q * 10];
    const opts = [q, ...pick3(q, wrong)];
    if (opts.length === 4) return { payload: { mode: 'div2', a, b, options: shuffle(opts.map(fmt)) }, answer: fmt(q) };
  }
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items: Item[] = [];
  if (difficulty === 1) items.push(mul1(), mul1(), mul1(), div1(), div1());
  else if (difficulty === 2) for (let i = 0; i < 5; i++) items.push(mul2());
  else for (let i = 0; i < 5; i++) items.push(div2());
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

/** стовпчик для множення: рядки з вирівнюванням по правому краю */
export function mulColumn(a: number, b: number): string {
  const top = fmt(a);
  const bot = fmt(b);
  const w = Math.max(top.length, bot.length + 2, 8);
  const line = '─'.repeat(w);
  return [top.padStart(w), `×${bot.padStart(w - 1)}`, line, '?'.padStart(w)].join('\n');
}

/** запис «куточком» для ділення */
export function divColumn(a: number, b: number): string {
  return `${fmt(a)} │ ${b}\n${'─'.repeat(fmt(a).length + 1)}┘\n${' '.repeat(fmt(a).length + 3)}?`;
}

/** кроки письмового ділення по цифрах */
export function divSteps(a: number, b: number): string {
  const parts: string[] = [];
  let cur = 0;
  let started = false;
  for (const ch of String(a)) {
    cur = cur * 10 + Number(ch);
    const qd = Math.floor(cur / b);
    if (!started && qd === 0) continue;
    started = true;
    parts.push(`${cur} : ${b} = ${qd} (${b}·${qd}=${b * qd}${cur - b * qd ? `, зайве ${cur - b * qd}` : ''})`);
    cur -= b * qd;
  }
  return parts.join('; ');
}

function mulSteps(a: number, b: number): string {
  const parts: string[] = [];
  let carry = 0;
  const ds = String(a).split('').reverse();
  ds.forEach((ch, i) => {
    const prod = Number(ch) * b + carry;
    const last = i === ds.length - 1;
    parts.push(last ? `${ch}·${b}${carry ? `+${carry}` : ''}=${prod}: пишемо ${prod}` : `${ch}·${b}${carry ? `+${carry}` : ''}=${prod}: пишемо ${prod % 10}, ${Math.floor(prod / 10)} запамʼятовуємо`);
    carry = Math.floor(prod / 10);
  });
  return parts.join('; ');
}

const PHRASES = {
  mul1: { key: 'p_wops_mul1', text: 'Помнож у стовпчик. Яка відповідь?' },
  div1: { key: 'p_wops_div1', text: 'Поділи письмово. Яка відповідь?' },
  mul2: { key: 'p_wops_mul2', text: 'Помнож на двоцифрове число. Яка відповідь?' },
  div2: { key: 'p_wops_div2', text: 'Поділи на двоцифрове число. Яка відповідь?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const isMul = p.mode === 'mul1' || p.mode === 'mul2';
  const q = isMul ? 'Помнож у стовпчик' : 'Поділи письмово';
  return (
    <>
      <PromptCard question={q} answerState={answerState} say={say} sayKey={round.id}>
        <pre style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 22, fontWeight: 700, lineHeight: 1.35, margin: '8px auto', width: 'fit-content', textAlign: 'left' }}>
          {isMul ? mulColumn(p.a, p.b) : divColumn(p.a, p.b)}
        </pre>
      </PromptCard>
      <ChoiceGrid
        options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 20, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={2}
      />
    </>
  );
}

const writtenOps: GameDefinition<Payload, Answer> = {
  id: 'written-ops',
  title: 'Письмові дії',
  subject: 'math',
  levels: ['L3'],
  icon: '✏️',
  description: 'Множення й ділення у стовпчик: на одноцифрове та двоцифрове число.',
  accent: '#FEF3C7',
  skillsFor: (d) =>
    d === 1 ? ['math.ops.l4.mult-div-multidigit'] : d === 2 ? ['math.ops.l4.written-mult-2digit'] : ['math.ops.l4.written-div-2digit'],
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'mul1') return { steps: [`Множимо з кінця, цифра за цифрою: ${mulSteps(p.a, p.b)}.`, `Разом: ${round.answer}.`], why: 'Перенос легко забути — запамʼятовуй його і додавай до наступного добутку.' };
    if (p.mode === 'div1' || p.mode === 'div2') return { steps: [`Ділимо по цифрах: ${divSteps(p.a, p.b)}.`, `Частка ${round.answer}. Перевір: ${round.answer} · ${p.b} = ${fmt(p.a)}.`] };
    const t = Math.floor(p.b / 10);
    const u = p.b % 10;
    return {
      steps: [
        `Множимо на одиниці: ${p.a} · ${u} = ${fmt(p.a * u)}.`,
        `Множимо на десятки: ${p.a} · ${t} = ${fmt(p.a * t)}, і пишемо із зсувом на розряд (${fmt(p.a * t * 10)}).`,
        `Додаємо: ${fmt(p.a * u)} + ${fmt(p.a * t * 10)} = ${round.answer}.`,
      ],
      why: 'Другий рядок починають під десятками — без зсуву відповідь стане меншою.',
    };
  },
  generate,
  Component,
};

export default writtenOps;
