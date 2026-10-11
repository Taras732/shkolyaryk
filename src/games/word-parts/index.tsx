import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData, ClassLevel } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';

/**
 * «Будова слова» (11.10.2026) — 3–4 клас, програма Савченко:
 *  3 клас: d1 — споріднені слова й корінь; d2 — частини слова; d3 — префікс з-/с-, роз-/без-;
 *  4 клас: d1 — частини слова; d2 — пре-/при-; d3 — -ський / -цький.
 * Слова власні, лише однозначні розбори.
 */

type Role = 'корінь' | 'префікс' | 'суфікс' | 'закінчення';
const R: Record<string, Role> = { p: 'префікс', r: 'корінь', s: 'суфікс', e: 'закінчення' };
const ROLE_HINT: Record<Role, string> = {
  корінь: 'Корінь — головна частина слова, у ній головне значення.',
  префікс: 'Префікс стоїть перед коренем.',
  суфікс: 'Суфікс стоїть після кореня й творить нове слово.',
  закінчення: 'Закінчення стоїть у кінці слова й змінюється.',
};

/** Розбір: [частина, роль]. */
export const STRUCT: [string, string][][] = [
  [['при', 'p'], ['шкіль', 'r'], ['н', 's'], ['ий', 'e']],
  [['без', 'p'], ['хмар', 'r'], ['н', 's'], ['ий', 'e']],
  [['при', 'p'], ['мор', 'r'], ['ськ', 's'], ['ий', 'e']],
  [['за', 'p'], ['пис', 'r'], ['к', 's'], ['а', 'e']],
  [['ліс', 'r'], ['ов', 's'], ['ий', 'e']],
  [['зелен', 'r'], ['ий', 'e']],
  [['гарн', 'r'], ['а', 'e']],
  [['книж', 'r'], ['к', 's'], ['а', 'e']],
  [['вод', 'r'], ['н', 's'], ['ий', 'e']],
  [['мам', 'r'], ['а', 'e']],
];

/** Споріднене слово: слово, правильне, два схожих за звучанням неспоріднених. */
export const RELATED: { w: string; right: string; wrong: [string, string] }[] = [
  { w: 'ліс', right: 'лісник', wrong: ['лисиця', 'лист'] },
  { w: 'сніг', right: 'сніжинка', wrong: ['снідати', 'сніп'] },
  { w: 'хліб', right: 'хлібний', wrong: ['хлів', 'хлопець'] },
  { w: 'школа', right: 'школяр', wrong: ['шкода', 'шолом'] },
  { w: 'море', right: 'моряк', wrong: ['мороз', 'мотор'] },
  { w: 'сад', right: 'садівник', wrong: ['сало', 'салат'] },
  { w: 'зима', right: 'зимовий', wrong: ['зірка', 'зебра'] },
  { w: 'квітка', right: 'квітник', wrong: ['квач', 'квадрат'] },
];
export const ROOTS: { w: string; root: string; wrong: [string, string] }[] = [
  { w: 'лісник', root: 'ліс', wrong: ['ник', 'лісн'] },
  { w: 'школяр', root: 'школ', wrong: ['яр', 'шко'] },
  { w: 'хлібний', root: 'хліб', wrong: ['ний', 'хлібн'] },
  { w: 'зимовий', root: 'зим', wrong: ['овий', 'зимов'] },
  { w: 'листок', root: 'лист', wrong: ['ок', 'листо'] },
  { w: 'дощик', root: 'дощ', wrong: ['ик', 'дощи'] },
];

/** з-/с-: правильна буква. */
export const ZS: { w: string; a: 'з' | 'с' }[] = [
  { w: 'списати', a: 'с' }, { w: 'сказати', a: 'с' }, { w: 'сфотографувати', a: 'с' }, { w: 'спекти', a: 'с' },
  { w: 'схопити', a: 'с' }, { w: 'стерти', a: 'с' }, { w: 'скласти', a: 'с' }, { w: 'сховати', a: 'с' },
  { w: 'зробити', a: 'з' }, { w: 'зварити', a: 'з' }, { w: 'згадати', a: 'з' }, { w: 'збудувати', a: 'з' },
  { w: 'змалювати', a: 'з' }, { w: 'зняти', a: 'з' }, { w: 'збігти', a: 'з' }, { w: 'здивувати', a: 'з' },
];
/** роз-/без-: правильне написання й хибне. */
export const ROZBEZ: { right: string; wrong: string }[] = [
  { right: 'розпитати', wrong: 'роспитати' }, { right: 'розкласти', wrong: 'роскласти' },
  { right: 'розбудити', wrong: 'росбудити' }, { right: 'розхитати', wrong: 'росхитати' },
  { right: 'безхмарний', wrong: 'бесхмарний' }, { right: 'безкрайній', wrong: 'бескрайній' },
  { right: 'розпалити', wrong: 'роспалити' }, { right: 'безпорадний', wrong: 'беспорадний' },
];

/** пре-/при-: слово, пояснення, правильна буква. */
export const PRE_PRY: { w: string; hint: string; a: 'е' | 'и' }[] = [
  { w: 'прегарний', hint: 'дуже гарний', a: 'е' }, { w: 'премудрий', hint: 'дуже мудрий', a: 'е' },
  { w: 'пречудовий', hint: 'дуже чудовий', a: 'е' }, { w: 'превеликий', hint: 'дуже великий', a: 'е' },
  { w: 'прекрасний', hint: 'дуже красивий', a: 'е' },
  { w: 'прибігти', hint: 'наблизитися бігом', a: 'и' }, { w: 'приєднати', hint: 'додати до чогось', a: 'и' },
  { w: 'приморський', hint: 'той, що біля моря', a: 'и' }, { w: 'приклеїти', hint: 'приєднати клеєм', a: 'и' },
  { w: 'пришити', hint: 'прикріпити ниткою', a: 'и' }, { w: 'прилетіти', hint: 'наблизитися польотом', a: 'и' },
];

/** -ський / -цький: від чого, правильне, два хибних, чому. */
export const SUFFIX: { base: string; right: string; wrong: [string, string]; why: string }[] = [
  { base: 'козак', right: 'козацький', wrong: ['козаський', 'козазький'], why: 'Після к пишемо -цький: к змінюється на ц.' },
  { base: 'ткач', right: 'ткацький', wrong: ['ткаський', 'ткачський'], why: 'Після ч пишемо -цький: ч змінюється на ц.' },
  { base: 'німець', right: 'німецький', wrong: ['німеський', 'німецський'], why: 'Основа на ц — пишемо -цький.' },
  { base: 'Львів', right: 'львівський', wrong: ['львівцький', 'львівзький'], why: 'Після в пишемо -ський.' },
  { base: 'Київ', right: 'київський', wrong: ['київцький', 'київзький'], why: 'Після в пишемо -ський.' },
  { base: 'Одеса', right: 'одеський', wrong: ['одецький', 'одезький'], why: 'Від Одеса: -ський.' },
  { base: 'Прага', right: 'празький', wrong: ['прагський', 'працький'], why: 'Г змінюється на з: празький.' },
  { base: 'студент', right: 'студентський', wrong: ['студентцький', 'студенцький'], why: 'Після т пишемо -ський.' },
  { base: 'швед', right: 'шведський', wrong: ['швецький', 'шведцький'], why: 'Після д пишемо -ський.' },
];

type Mode = 'related' | 'root' | 'parts' | 'zs' | 'spell' | 'prepri' | 'suffix';
type Payload = {
  mode: Mode;
  q: string;
  big?: string;
  segs?: { t: string; hi: boolean }[];
  options: string[];
  why: string[];
  cols: number;
};
type Answer = string;

const pick = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);
type Item = Omit<Round<Payload, Answer>, 'id'>;

function relatedItems(n: number): Item[] {
  return pick(RELATED, n).map((x) => ({
    payload: { mode: 'related', q: `Яке слово споріднене зі словом «${x.w}»?`, options: shuffle([x.right, ...x.wrong]), cols: 1,
      why: [`«${x.right}» — споріднене до «${x.w}»: у них один корінь.`, 'Схожі за звучанням слова можуть мати різне значення — це не родичі.'] },
    answer: x.right,
  }));
}
function rootItems(n: number): Item[] {
  return pick(ROOTS, n).map((x) => ({
    payload: { mode: 'root', q: `Знайди корінь слова «${x.w}».`, options: shuffle([x.root, ...x.wrong]), cols: 1,
      why: [`Корінь слова «${x.w}» — «${x.root}».`, 'У споріднених слів корінь однаковий.'] },
    answer: x.root,
  }));
}
function partsItems(n: number): Item[] {
  return pick(STRUCT, n).map((parts) => {
    const hi = Math.floor(Math.random() * parts.length);
    const role = R[parts[hi][1]];
    return {
      payload: { mode: 'parts', q: 'Що це за частина слова?', segs: parts.map(([t], i) => ({ t, hi: i === hi })),
        options: ['корінь', 'префікс', 'суфікс', 'закінчення'], cols: 2,
        why: [`«${parts[hi][0]}» — ${role}.`, ROLE_HINT[role]] },
      answer: role,
    };
  });
}
function zsItems(): Item[] {
  const zs = pick(ZS, 3).map((x): Item => ({
    payload: { mode: 'zs', q: 'Яку букву вставити: з чи с?', big: `_${x.w.slice(1)}`, options: ['з', 'с'], cols: 2,
      why: x.a === 'с' ? [`${x.w}.`, 'Перед к, п, т, ф, х пишемо с-.'] : [`${x.w}.`, 'Перед іншими буквами пишемо з-.'] },
    answer: x.a,
  }));
  const rb = pick(ROZBEZ, 2).map((x): Item => ({
    payload: { mode: 'spell', q: 'Яке слово написано правильно?', options: shuffle([x.right, x.wrong]), cols: 1,
      why: [`${x.right}.`, 'Префікси роз- і без- завжди пишемо з буквою з.'] },
    answer: x.right,
  }));
  return [...zs, ...rb];
}
function prepriItems(): Item[] {
  const all = shuffle(PRE_PRY);
  const pre = all.filter((x) => x.a === 'е');
  const pri = all.filter((x) => x.a === 'и');
  const chosen = Math.random() < 0.5 ? [...pre.slice(0, 2), ...pri.slice(0, 3)] : [...pre.slice(0, 3), ...pri.slice(0, 2)];
  return chosen.map((x) => ({
    payload: { mode: 'prepri', q: `Яку букву вставити? «${x.hint}»`, big: x.w.replace(/^пр./, 'пр_'), options: ['е', 'и'], cols: 2,
      why: x.a === 'е' ? [`${x.w} — це «${x.hint}».`, 'Пре- означає «дуже»: прегарний.'] : [`${x.w} — «${x.hint}».`, 'При- означає наближення, приєднання: прибігти.'] },
    answer: x.a,
  }));
}
function suffixItems(): Item[] {
  return pick(SUFFIX, 5).map((x) => ({
    payload: { mode: 'suffix', q: `Утвори прикметник від слова «${x.base}».`, options: shuffle([x.right, ...x.wrong]), cols: 1,
      why: [`${x.base} → ${x.right}.`, x.why] },
    answer: x.right,
  }));
}

export function generate(difficulty: Difficulty, _level?: unknown, classLevel?: ClassLevel): LevelData<Payload, Answer> {
  let items: Item[];
  if (classLevel === 'grade4') {
    items = difficulty === 1 ? partsItems(5) : difficulty === 2 ? prepriItems() : suffixItems();
  } else {
    items = difficulty === 1 ? [...relatedItems(3), ...rootItems(2)] : difficulty === 2 ? partsItems(5) : zsItems();
  }
  return { difficulty, rounds: shuffle(items).map((r, i) => ({ ...r, id: `r${i}` })) };
}

const PHRASES: Record<Mode, { key: string; text: string }> = {
  related: { key: 'p_wp_related', text: 'Яке слово споріднене?' },
  root: { key: 'p_wp_root', text: 'Знайди корінь слова.' },
  parts: { key: 'p_wp_parts', text: 'Що це за частина слова?' },
  zs: { key: 'p_wp_zs', text: 'Яку букву вставити: з чи с?' },
  spell: { key: 'p_wp_spell', text: 'Яке слово написано правильно?' },
  prepri: { key: 'p_wp_prepri', text: 'Пре чи при? Яку букву вставити?' },
  suffix: { key: 'p_wp_suffix', text: 'Утвори прикметник від слова.' },
};

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const say = hasUkAudio(phrase.key) ? () => sayUkSeq([phrase]) : undefined;
  return (
    <>
      <PromptCard question={p.q} answerState={answerState} say={say} sayKey={round.id}>
        {p.segs && (
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1, textAlign: 'center' }}>
            {p.segs.map((s, i) => (
              <span key={i} style={s.hi ? { background: '#FEF08A', borderRadius: 6, padding: '0 3px', borderBottom: '3px solid #CA8A04' } : undefined}>{s.t}</span>
            ))}
          </div>
        )}
        {p.big && <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 2, textAlign: 'center' }}>{p.big}</div>}
      </PromptCard>
      <ChoiceGrid options={p.options.map((o) => ({ value: o, node: <span style={{ fontSize: 20, fontWeight: 800 }}>{o}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.cols} />
    </>
  );
}

const wordParts: GameDefinition<Payload, Answer> = {
  id: 'word-parts',
  title: 'Будова слова',
  subject: 'language',
  levels: ['L3'],
  icon: '🧩',
  accent: '#FEF9C3',
  description: 'Споріднені слова, корінь, префікс, суфікс і закінчення; правопис префіксів і суфіксів.',
  skillsFor: (d, cls) => {
    if (cls === 'grade4') return d === 1 ? ['language.word.l3.word-structure'] : d === 2 ? ['language.orth.l4.prefix-pre-pry'] : ['language.orth.l4.suffix-skyi-tskyi'];
    return d === 1 ? ['language.word.l3.related-words-root'] : d === 2 ? ['language.word.l3.word-structure'] : ['language.orth.l3.prefix-z-s'];
  },
  explain: (round) => ({ steps: round.payload.why }),
  generate,
  Component,
};

export default wordParts;
