import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Частини мови 3» (11.10.2026) — 3 клас, програма Савченко:
 *  d1 — іменник: рід, число, істота/неістота, власна/загальна назва;
 *  d2 — прикметник узгоджується з іменником;
 *  d3 — дієслово: час, «не» з дієсловами; займенник замість іменника.
 */

type Gender = 'чоловічий' | 'жіночий' | 'середній';
export const GENDER: { w: string; g: Gender }[] = [
  { w: 'стілець', g: 'чоловічий' }, { w: 'зошит', g: 'чоловічий' }, { w: 'кіт', g: 'чоловічий' }, { w: 'дощ', g: 'чоловічий' },
  { w: 'учень', g: 'чоловічий' }, { w: 'тато', g: 'чоловічий' },
  { w: 'книжка', g: 'жіночий' }, { w: 'школа', g: 'жіночий' }, { w: 'лампа', g: 'жіночий' }, { w: 'мама', g: 'жіночий' }, { w: 'ніч', g: 'жіночий' },
  { w: 'вікно', g: 'середній' }, { w: 'море', g: 'середній' }, { w: 'яблуко', g: 'середній' }, { w: 'сонце', g: 'середній' }, { w: 'місто', g: 'середній' },
];
export const NUMBER: { w: string; n: 'однина' | 'множина' }[] = [
  { w: 'діти', n: 'множина' }, { w: 'друзі', n: 'множина' }, { w: 'квіти', n: 'множина' }, { w: 'зошити', n: 'множина' },
  { w: 'олівці', n: 'множина' }, { w: 'мʼячі', n: 'множина' },
  { w: 'стіл', n: 'однина' }, { w: 'дерево', n: 'однина' }, { w: 'птах', n: 'однина' }, { w: 'олівець', n: 'однина' }, { w: 'мʼяч', n: 'однина' },
];
export const ANIMATE: { w: string; a: 'хто? (істота)' | 'що? (неістота)' }[] = [
  { w: 'кіт', a: 'хто? (істота)' }, { w: 'дівчинка', a: 'хто? (істота)' }, { w: 'птах', a: 'хто? (істота)' },
  { w: 'хлопчик', a: 'хто? (істота)' }, { w: 'риба', a: 'хто? (істота)' }, { w: 'комаха', a: 'хто? (істота)' },
  { w: 'стілець', a: 'що? (неістота)' }, { w: 'дерево', a: 'що? (неістота)' }, { w: 'парта', a: 'що? (неістота)' },
  { w: 'сонце', a: 'що? (неістота)' }, { w: 'вода', a: 'що? (неістота)' }, { w: 'квітка', a: 'що? (неістота)' },
];
export const PROPER: { w: string; p: 'власна' | 'загальна' }[] = [
  { w: 'Київ', p: 'власна' }, { w: 'Дніпро', p: 'власна' }, { w: 'Мурчик', p: 'власна' }, { w: 'Оля', p: 'власна' },
  { w: 'Карпати', p: 'власна' }, { w: 'Україна', p: 'власна' },
  { w: 'місто', p: 'загальна' }, { w: 'річка', p: 'загальна' }, { w: 'кіт', p: 'загальна' }, { w: 'дівчинка', p: 'загальна' },
  { w: 'гори', p: 'загальна' }, { w: 'країна', p: 'загальна' },
];

/** Прикметник: основа + іменник + його рід/число. */
type Gn = 'ж' | 'ч' | 'с' | 'мн';
export const ENDING: Record<Gn, string> = { ж: '-а', ч: '-ий', с: '-е', мн: '-і' };
const GN_NAME: Record<Gn, string> = { ж: 'вона, жіночий рід', ч: 'він, чоловічий рід', с: 'воно, середній рід', мн: 'вони, множина' };
export const ADJ: { adj: string; noun: string; gn: Gn }[] = [
  { adj: 'зелен', noun: 'трава', gn: 'ж' }, { adj: 'гарн', noun: 'книжка', gn: 'ж' }, { adj: 'нов', noun: 'хата', gn: 'ж' },
  { adj: 'висок', noun: 'гора', gn: 'ж' }, { adj: 'смачн', noun: 'вишня', gn: 'ж' },
  { adj: 'зелен', noun: 'лист', gn: 'ч' }, { adj: 'холодн', noun: 'день', gn: 'ч' }, { adj: 'велик', noun: 'будинок', gn: 'ч' },
  { adj: 'нов', noun: 'стіл', gn: 'ч' }, { adj: 'смачн', noun: 'пиріг', gn: 'ч' },
  { adj: 'гарн', noun: 'вікно', gn: 'с' }, { adj: 'холодн', noun: 'море', gn: 'с' }, { adj: 'зелен', noun: 'дерево', gn: 'с' },
  { adj: 'нов', noun: 'місто', gn: 'с' }, { adj: 'тепл', noun: 'сонце', gn: 'с' },
  { adj: 'весел', noun: 'діти', gn: 'мн' }, { adj: 'висок', noun: 'ліси', gn: 'мн' }, { adj: 'нов', noun: 'олівці', gn: 'мн' },
  { adj: 'гарн', noun: 'квіти', gn: 'мн' }, { adj: 'нов', noun: 'друзі', gn: 'мн' },
];

export const TENSE: { s: string; t: 'минулий' | 'теперішній' | 'майбутній' }[] = [
  { s: 'Оля читала книжку.', t: 'минулий' }, { s: 'Вчора ми ходили в парк.', t: 'минулий' }, { s: 'Кіт спав на дивані.', t: 'минулий' },
  { s: 'Дощ ішов цілу ніч.', t: 'минулий' },
  { s: 'Діти малюють сонце.', t: 'теперішній' }, { s: 'Мама зараз варить борщ.', t: 'теперішній' }, { s: 'Собака біжить додому.', t: 'теперішній' },
  { s: 'Завтра я піду до школи.', t: 'майбутній' }, { s: 'Тато читатиме нам казку.', t: 'майбутній' }, { s: 'Ми будемо співати.', t: 'майбутній' },
  { s: 'Влітку ми поїдемо до моря.', t: 'майбутній' },
];
const TENSE_WHY = {
  минулий: 'Дія вже відбулась — це минулий час.',
  теперішній: 'Дія відбувається зараз — це теперішній час.',
  майбутній: 'Дія ще буде — це майбутній час.',
} as const;
export const NE: { right: string; wrong: string }[] = [
  { right: 'не бачу', wrong: 'небачу' }, { right: 'не знаю', wrong: 'незнаю' }, { right: 'не люблю', wrong: 'нелюблю' },
  { right: 'не хочу', wrong: 'нехочу' }, { right: 'не вмію', wrong: 'невмію' }, { right: 'не чую', wrong: 'нечую' },
];
export const PRON: { n: string; tail: string; p: 'він' | 'вона' | 'воно' | 'вони' }[] = [
  { n: 'Оля', tail: 'малює', p: 'вона' }, { n: 'Максим', tail: 'співає', p: 'він' }, { n: 'Діти', tail: 'граються у дворі', p: 'вони' },
  { n: 'Кошеня', tail: 'спить', p: 'воно' }, { n: 'Мама', tail: 'пече пиріг', p: 'вона' }, { n: 'Тато', tail: 'читає газету', p: 'він' },
  { n: 'Книжки', tail: 'лежать на столі', p: 'вони' }, { n: 'Озеро', tail: 'блищить на сонці', p: 'воно' },
  { n: 'Учителька', tail: 'пояснює правило', p: 'вона' },
];

type Mode = 'gender' | 'number' | 'animate' | 'proper' | 'adj' | 'tense' | 'ne' | 'pron';
type Payload = { mode: Mode; q: string; big?: string; options: string[]; why: string[]; cols: number };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;
const pick = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);

const GENDER_WHY: Record<Gender, string> = { чоловічий: 'мій', жіночий: 'моя', середній: 'моє' };
const GENDER_PRON: Record<Gender, string> = { чоловічий: 'він', жіночий: 'вона', середній: 'воно' };

function d1(): Item[] {
  const items: Item[] = [];
  for (const x of pick(GENDER, 2)) items.push({
    payload: { mode: 'gender', q: 'Якого роду це слово?', big: x.w, options: ['чоловічий', 'жіночий', 'середній'], cols: 1,
      why: [`Скажи: ${GENDER_WHY[x.g]} ${x.w} — це «${GENDER_PRON[x.g]}».`, `Тому рід ${x.g}.`] },
    answer: x.g,
  });
  for (const x of pick(NUMBER, 1)) items.push({
    payload: { mode: 'number', q: 'Один предмет чи багато?', big: x.w, options: ['однина', 'множина'], cols: 2,
      why: [x.n === 'однина' ? 'Це один предмет — однина.' : 'Це кілька предметів — множина.'] },
    answer: x.n,
  });
  for (const x of pick(ANIMATE, 1)) items.push({
    payload: { mode: 'animate', q: 'На яке питання відповідає слово?', big: x.w, options: ['хто? (істота)', 'що? (неістота)'], cols: 1,
      why: [x.a === 'хто? (істота)' ? `Про «${x.w}» питаємо «хто?» — це істота.` : `Про «${x.w}» питаємо «що?» — це неістота.`] },
    answer: x.a,
  });
  for (const x of pick(PROPER, 1)) items.push({
    payload: { mode: 'proper', q: 'Яка це назва?', big: x.w, options: ['власна', 'загальна'], cols: 2,
      why: [x.p === 'власна' ? 'Це особлива назва, її пишемо з великої букви — власна.' : 'Так називають багато схожих предметів — загальна назва.'] },
    answer: x.p,
  });
  return items;
}

function d2(): Item[] {
  const groups: Gn[] = ['ж', 'ч', 'с', 'мн'];
  const chosen = [...groups.map((g) => pick(ADJ.filter((x) => x.gn === g), 1)[0])];
  const used = new Set(chosen.map((c) => c.noun));
  chosen.push(pick(ADJ.filter((x) => !used.has(x.noun)), 1)[0]);
  return chosen.map((x) => ({
    payload: { mode: 'adj', q: 'Яке закінчення має прикметник?', big: `${x.adj}__ ${x.noun}`, options: shuffle(['-а', '-ий', '-е', '-і']), cols: 2,
      why: [`«${x.noun}» — ${GN_NAME[x.gn]}.`, `Прикметник узгоджується з іменником: ${x.adj}${ENDING[x.gn].slice(1)} ${x.noun}.`] },
    answer: ENDING[x.gn],
  }));
}

function d3(): Item[] {
  const items: Item[] = [];
  for (const x of pick(TENSE, 2)) items.push({
    payload: { mode: 'tense', q: 'У якому часі дієслово?', big: x.s, options: ['минулий', 'теперішній', 'майбутній'], cols: 1, why: [TENSE_WHY[x.t]] },
    answer: x.t,
  });
  for (const x of pick(NE, 1)) items.push({
    payload: { mode: 'ne', q: 'Як правильно писати?', options: shuffle([x.right, x.wrong]), cols: 1,
      why: [`${x.right}.`, 'З дієсловами «не» пишемо окремо.'] },
    answer: x.right,
  });
  for (const x of pick(PRON, 2)) items.push({
    payload: { mode: 'pron', q: `Заміни слово «${x.n}» займенником: … ${x.tail}.`, big: `${x.n} ${x.tail}.`, options: ['він', 'вона', 'воно', 'вони'], cols: 2,
      why: [`«${x.n}» — ${x.p}.`, 'Займенник стоїть замість іменника, щоб не повторювати слово.'] },
    answer: x.p,
  });
  return items;
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items = difficulty === 1 ? d1() : difficulty === 2 ? d2() : d3();
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES: Record<Mode, { key: string; text: string }> = {
  gender: { key: 'p_p3_gender', text: 'Якого роду це слово?' },
  number: { key: 'p_p3_number', text: 'Один предмет чи багато?' },
  animate: { key: 'p_p3_animate', text: 'На яке питання відповідає слово: хто чи що?' },
  proper: { key: 'p_p3_proper', text: 'Це власна чи загальна назва?' },
  adj: { key: 'p_p3_adj', text: 'Яке закінчення має прикметник?' },
  tense: { key: 'p_p3_tense', text: 'У якому часі дієслово?' },
  ne: { key: 'p_p3_ne', text: 'Як правильно писати?' },
  pron: { key: 'p_p3_pron', text: 'Заміни слово займенником.' },
};

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const sentence = p.mode === 'tense' || p.mode === 'pron';
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.big && <div style={{ fontSize: sentence ? 20 : 30, fontWeight: 900, letterSpacing: sentence ? 0 : 1, textAlign: 'center' }}>{p.big}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 20, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.cols} />
    </>
  );
}

const parts3: GameDefinition<Payload, Answer> = {
  id: 'parts-3',
  title: 'Частини мови 3',
  subject: 'language',
  levels: ['L3'],
  icon: '🏷️',
  accent: '#DBEAFE',
  description: 'Іменник, прикметник, дієслово й займенник: рід, число, час, узгодження.',
  skillsFor: (d) => (d === 1
    ? ['language.word.l3.noun-gender-number', 'language.word.l3.animate-proper']
    : d === 2 ? ['language.word.l3.adjective-agreement']
    : ['language.word.l3.verb-tense', 'language.word.l3.ne-with-verbs', 'language.word.l3.pronoun-intro']),
  explain: (round) => ({ steps: round.payload.why }),
  generate,
  Component,
};

export default parts3;
