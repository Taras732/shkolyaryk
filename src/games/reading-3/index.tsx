import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Читання 3» (11.10.2026) — 3 клас, програма Савченко:
 *  d1 — жанр уривка (байка, пʼєса, казка, вірш, оповідання);
 *  d2 — робота з текстом: яке речення відповідає на питання;
 *  d3 — виразне читання: інтонація, пауза на комі, наголос.
 * Уривки й тексти власні.
 */

const GENRES = ['байка', 'пʼєса', 'казка', 'вірш', 'оповідання'] as const;
export const EXCERPTS: { t: string; g: (typeof GENRES)[number] }[] = [
  { t: 'Півник дуже пишався своїм гребенем і не дивився під ноги. Він упав у калюжу, і всі кури сміялися.\nХто задирає носа, той під ноги не дивиться.', g: 'байка' },
  { t: 'Їжачок кликав Білку допомагати збирати гриби, а вона лише стрибала по гілках. Узимку Білка прийшла просити їжу.\n«Хто влітку ліниться, той узимку голодує», — сказав Їжачок.', g: 'байка' },
  { t: 'ОЛЯ. Привіт, Максиме! Куди ти йдеш?\nМАКСИМ. До бібліотеки. Хочеш зі мною?\n(Оля киває.)', g: 'пʼєса' },
  { t: 'ЛИС. Добрий день, Зайчику!\nЗАЙЧИК. Добрий день! Я поспішаю додому.', g: 'пʼєса' },
  { t: 'Жили-були дід і баба. Мали вони чарівну скриньку, що виконувала бажання.', g: 'казка' },
  { t: 'За темним лісом, за високою горою стояла хатинка. Жила в ній стара чарівниця, що вміла перетворювати дощ на золото.', g: 'казка' },
  { t: 'Місяць гойдається в річці,\nЗірки сплять у водичці.', g: 'вірш' },
  { t: 'Дощик по віконцю — стук,\nЗаспівав маленький друг.', g: 'вірш' },
  { t: 'Максим довго не міг навчитися їздити на велосипеді. Щодня він тренувався у дворі, і за тиждень поїхав сам.', g: 'оповідання' },
  { t: 'Софійка забула вдома зошит. Подруга Іринка поділилась із нею аркушем, і урок минув добре.', g: 'оповідання' },
];
const GENRE_WHY: Record<(typeof GENRES)[number], string> = {
  байка: 'Тварини поводяться як люди, а в кінці є мораль — повчання.',
  пʼєса: 'Є дійові особи й їхні репліки — це пʼєса.',
  казка: 'Тут є чарівне, чого не буває в житті, — це казка.',
  вірш: 'Рядки короткі, а кінці римуються — це вірш.',
  оповідання: 'Про звичайних людей і справжні події — це оповідання.',
};

/** Тексти з 5 речень; питання → індекс речення-відповіді. */
export const TEXTS: { s: string[]; qs: { q: string; a: number }[] }[] = [
  { s: ['Назар із татом поїхали на озеро.', 'Вони взяли з собою вудки й бутерброди.', 'Назар упіймав маленького окуня.', 'Хлопчик відпустив рибку назад у воду.', 'Додому вони повернулися щасливі.'],
    qs: [{ q: 'Що взяли з собою Назар і тато?', a: 1 }, { q: 'Кого упіймав Назар?', a: 2 }, { q: 'Що зробив Назар із рибкою?', a: 3 }] },
  { s: ['Сьогодні в класі було свято Осені.', 'Діти прикрасили стіни золотим листям.', 'Софійка прочитала вірш про дощ.', 'Потім усі пили чай з яблучним пирогом.', 'Свято всім дуже сподобалося.'],
    qs: [{ q: 'Чим діти прикрасили стіни?', a: 1 }, { q: 'Що прочитала Софійка?', a: 2 }, { q: 'Що діти пили й їли після вірша?', a: 3 }] },
  { s: ['Взимку в лісі холодно й тихо.', 'Білка заховала горішки в дуплі.', 'Їжак міцно спить у теплій норі.', 'Лише синички цвірінькають на гілці.', 'Діти повісили для них годівничку.'],
    qs: [{ q: 'Де білка заховала горішки?', a: 1 }, { q: 'Хто спить у норі?', a: 2 }, { q: 'Хто цвірінькає на гілці?', a: 3 }, { q: 'Що повісили діти?', a: 4 }] },
  { s: ['Бабуся жила в селі біля річки.', 'Щоліта до неї приїздив онук Тарасик.', 'Разом вони ловили метеликів.', 'Увечері бабуся розповідала казки.', 'Тарасик засинав усміхнений.'],
    qs: [{ q: 'Хто жив біля річки?', a: 0 }, { q: 'Хто приїздив до бабусі щоліта?', a: 1 }, { q: 'Що бабуся робила ввечері?', a: 3 }] },
];

/** Інтонація за знаком у кінці. */
export const INTONATION: { s: string; a: 'розповідна' | 'питальна' | 'оклична' }[] = [
  { s: 'Ти вже зробив уроки?', a: 'питальна' }, { s: 'Куди зникла моя ручка?', a: 'питальна' }, { s: 'Котра зараз година?', a: 'питальна' },
  { s: 'Яка гарна сьогодні погода!', a: 'оклична' }, { s: 'Як я люблю літо!', a: 'оклична' }, { s: 'Ура, ми виграли!', a: 'оклична' },
  { s: 'Ми живемо у Львові.', a: 'розповідна' }, { s: 'Взимку падає сніг.', a: 'розповідна' }, { s: 'Тато читає газету.', a: 'розповідна' },
];
/** Пауза на комі: слово перед комою. */
export const PAUSE: { s: string; w: string; others: string[] }[] = [
  { s: 'Сонце зійшло, і птахи заспівали.', w: 'зійшло', others: ['Сонце', 'птахи', 'і'] },
  { s: 'Надворі холодно, тому ми вдягли шапки.', w: 'холодно', others: ['Надворі', 'ми', 'вдягли'] },
  { s: 'Оля малює, а Максим читає.', w: 'малює', others: ['Оля', 'Максим', 'а'] },
  { s: 'Дощ скінчився, і виглянуло сонце.', w: 'скінчився', others: ['Дощ', 'виглянуло', 'і'] },
];
/** Наголос: слово й наголошений голосний (у кожному слові голосні різні). */
export const STRESS: { w: string; v: string }[] = [
  { w: 'вікно', v: 'о' }, { w: 'сестра', v: 'а' }, { w: 'книжка', v: 'и' }, { w: 'зошит', v: 'о' }, { w: 'місто', v: 'і' }, { w: 'школа', v: 'о' },
  { w: 'вода', v: 'а' }, { w: 'кішка', v: 'і' }, { w: 'будинок', v: 'и' }, { w: 'листок', v: 'о' }, { w: 'гора', v: 'а' }, { w: 'ведмідь', v: 'і' },
  { w: 'портфель', v: 'е' }, { w: 'олівець', v: 'е' }, { w: 'сонце', v: 'о' },
];
const VOWELS = ['а', 'е', 'и', 'і', 'о', 'у'];
export const stressed = (w: string, v: string) => {
  const i = w.indexOf(v);
  return `${w.slice(0, i + 1)}́${w.slice(i + 1)}`;
};

type Mode = 'genre' | 'text' | 'intonation' | 'pause' | 'stress';
type Payload = { mode: Mode; q: string; text?: string; big?: string; options: string[]; why: string[]; cols: number };
type Answer = string;
type Item = Omit<Round<Payload, Answer>, 'id'>;
const pick = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);

function d1(): Item[] {
  return pick(EXCERPTS, 5).map((e) => ({
    payload: { mode: 'genre', q: 'Що це за твір?', text: e.t, cols: 2, why: [`Це ${e.g}.`, GENRE_WHY[e.g]],
      options: shuffle([e.g, ...pick(GENRES.filter((g) => g !== e.g), 3)]) },
    answer: e.g,
  }));
}

function d2(): Item[] {
  const pool = TEXTS.flatMap((t, ti) => t.qs.map((q) => ({ ti, ...q })));
  return pick(pool, 5).map((x): Item => {
    const t = TEXTS[x.ti];
    const right = t.s[x.a];
    const wrong = pick(t.s.filter((_, i) => i !== x.a), 2);
    return {
      payload: { mode: 'text', q: x.q, text: t.s.join(' '), options: shuffle([right, ...wrong]), cols: 1,
        why: [right, 'Знайди в тексті речення, де сказано про це.'] },
      answer: right,
    };
  });
}

function d3(): Item[] {
  const into = pick(INTONATION, 2).map((x): Item => ({
    payload: { mode: 'intonation', q: 'З якою інтонацією читати речення?', big: x.s, options: ['розповідна', 'питальна', 'оклична'], cols: 1,
      why: x.a === 'питальна' ? ['Питання — голос піднімається.'] : x.a === 'оклична' ? ['Окличне речення читаємо з почуттям, голосніше.'] : ['Розповідне речення читаємо спокійно, голос на кінці опускається.'] },
    answer: x.a,
  }));
  const pause = pick(PAUSE, 1).map((x): Item => ({
    payload: { mode: 'pause', q: 'Після якого слова коротка пауза (там, де кома)?', big: x.s, options: shuffle([x.w, ...pick(x.others, 2)]), cols: 1,
      why: [x.s.replace(`${x.w},`, `${x.w}, |`), 'На комі робимо коротку паузу, на крапці — довшу.'] },
    answer: x.w,
  }));
  const stress = pick(STRESS, 2).map((x): Item => {
    const own = [...x.w].filter((c) => VOWELS.includes(c));
    const extra = pick(VOWELS.filter((v) => !own.includes(v)), Math.max(0, 3 - new Set(own).size));
    return {
      payload: { mode: 'stress', q: 'Який голосний у слові наголошений?', big: x.w, options: shuffle([...new Set(own), ...extra]), cols: 3,
        why: [stressed(x.w, x.v), 'Наголошений голосний вимовляємо голосніше й довше.'] },
      answer: x.v,
    };
  });
  return [...into, ...pause, ...stress];
}

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const items = difficulty === 1 ? d1() : difficulty === 2 ? d2() : d3();
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES: Record<Mode, { key: string; text: string }> = {
  genre: { key: 'p_r3_genre', text: 'Що це за твір: байка, пʼєса, казка, вірш чи оповідання?' },
  text: { key: 'p_r3_text', text: 'Прочитай текст. Яке речення відповідає на питання?' },
  intonation: { key: 'p_r3_intonation', text: 'З якою інтонацією читати речення?' },
  pause: { key: 'p_r3_pause', text: 'Після якого слова коротка пауза?' },
  stress: { key: 'p_r3_stress', text: 'Який голосний у слові наголошений?' },
};

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  const text = { fontSize: 17, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line' as const, textAlign: 'left' as const };
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.text && <div style={text}>{p.text}</div>}
        {p.big && <div style={{ fontSize: p.mode === 'stress' ? 34 : 22, fontWeight: 900, textAlign: 'center' }}>{p.big}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: p.cols === 1 && p.mode === 'text' ? 16 : 19, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.cols} />
    </>
  );
}

const reading3: GameDefinition<Payload, Answer> = {
  id: 'reading-3',
  title: 'Читання 3',
  subject: 'language',
  levels: ['L3'],
  icon: '📚',
  accent: '#FFE4E6',
  description: 'Жанри (байка, пʼєса), робота з текстом, виразне читання й наголос.',
  skillsFor: (d) => (d === 1
    ? ['language.reading.l3.fable-play']
    : d === 2 ? ['language.reading.l3.work-with-text']
    : ['language.reading.l3.expressive-reading', 'language.sounds.l3.stress-unstressed-vowels-intro']),
  explain: (round) => ({ steps: round.payload.why }),
  generate,
  Component,
};

export default reading3;
