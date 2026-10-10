import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round, ProfileLevel } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { usePreschool } from '../shared/preschool';
import { FindPicture, makeFindRounds, type FindItem, type FindPayload } from '../shared/find-picture';

/** Прапор кодом — точні кольори й пропорції 2:3 (емодзі-прапор Windows малює як «UA»). */
const Flag = () => (
  <svg viewBox="0 0 90 60" width={78} height={52} style={{ display: 'block', borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,.25)' }}>
    <rect width="90" height="30" fill="#0057B7" />
    <rect y="30" width="90" height="30" fill="#FFD700" />
  </svg>
);

/**
 * Дошкілля (10.10.2026): «Знайди прапор / соняшник / калину…» — намальовані символи, ціль звучить.
 * Тризуб свідомо не беремо: згенерований герб спотворюється, а з державним символом так не можна.
 */
export const KID_SYMBOLS: FindItem[] = [
  { id: 'flag', say: 'прапор', node: <Flag /> },
  { id: 'sunflower', say: 'соняшник', img: '/count/sym_sunflower.webp' },
  { id: 'kalyna', say: 'калину', img: '/count/sym_kalyna.webp' },
  { id: 'vyshyvanka', say: 'вишиванку', img: '/count/sym_vyshyvanka.webp' },
  { id: 'pysanka', say: 'писанку', img: '/count/sym_pysanka.webp' },
  { id: 'nightingale', say: 'соловейка', img: '/count/sym_nightingale.webp' },
];
export const KID_SYMBOL_SAYS = KID_SYMBOLS.map((x) => [x.id, x.say] as const);

interface Payload {
  question: string;
  emoji?: string;
  options: string[];
}

interface EmojiItem {
  key: string;
  emoji: string;
  name: string;
  tier: Difficulty;
}

/**
 * Q23 — емодзі лишені ЛИШЕ там, де вони справді зображають символ.
 * Прибрано хибні пари: 👕 (звичайна футболка) як «Вишиванка», 🥚 (яйце) як
 * «Писанка», 🍒 (вишні) як «Калина», 🐦 (пташка) як «Соловей», 🎵 (нота) як
 * «Гімн», 🗺️ (карта світу) як «Карта України», 🔱 (тризуб Посейдона) як герб.
 * Дитина не могла їх упізнати, а для символів держави така підміна ще й
 * неповажна. Ці символи перенесені в описові питання (FACT_ITEMS) — там вони
 * названі словами, без викривлення. Справжні зображення (SVG) — окрема задача.
 */
const EMOJI_ITEMS: EmojiItem[] = [
  { key: 'sunflower', emoji: '🌻', name: 'Соняшник', tier: 1 },
  { key: 'flag', emoji: '🇺🇦', name: 'Прапор України', tier: 1 },
];

/** Пул назв для дистракторів (не лише ті, що мають емодзі). */
const SYMBOL_NAMES = [
  'Соняшник', 'Прапор України', 'Тризуб', 'Калина', 'Вишиванка', 'Писанка', 'Соловей',
];

interface FactItem {
  key: string;
  question: string;
  answer: string;
  options: string[];
  tier: Difficulty;
}

const FACT_ITEMS: FactItem[] = [
  {
    key: 'colors-count',
    question: 'Скільки кольорів на прапорі України?',
    answer: '2',
    options: ['1', '2', '3'],
    tier: 1,
  },
  {
    key: 'flower',
    question: 'Яка квітка — символ України?',
    answer: 'Соняшник',
    options: ['Соняшник', 'Тюльпан', 'Троянда', 'Ромашка'],
    tier: 1,
  },
  {
    key: 'top-color',
    question: 'Який колір зверху на прапорі України?',
    answer: 'Синій',
    options: ['Синій', 'Жовтий', 'Білий', 'Зелений'],
    tier: 2,
  },
  {
    key: 'bottom-color',
    question: 'Який колір знизу на прапорі України?',
    answer: 'Жовтий',
    options: ['Жовтий', 'Синій', 'Червоний', 'Чорний'],
    tier: 2,
  },
  {
    key: 'herb',
    question: 'Що зображено на гербі України?',
    answer: 'Тризуб',
    options: ['Тризуб', 'Лев', 'Орел', 'Зірка'],
    tier: 2,
  },
  {
    key: 'bird',
    question: 'Який птах символізує Україну в піснях?',
    answer: 'Соловей',
    options: ['Соловей', 'Орел', 'Голуб', 'Лелека'],
    tier: 3,
  },
  // Символи, які раніше подавались хибними емодзі — тепер названі словами (Q23).
  {
    key: 'vyshyvanka',
    question: 'Як називається святкова сорочка з українським орнаментом?',
    answer: 'Вишиванка',
    options: ['Вишиванка', 'Светр', 'Куртка', 'Піжама'],
    tier: 1,
  },
  {
    key: 'pysanka',
    question: 'Як називають яйце з візерунками, яке готують на Великдень?',
    answer: 'Писанка',
    options: ['Писанка', 'Іграшка', 'Свічка', 'Ліхтарик'],
    tier: 2,
  },
  {
    key: 'viburnum',
    question: 'Який кущ із червоними ягодами оспіваний в українських піснях?',
    answer: 'Калина',
    options: ['Калина', 'Ялина', 'Береза', 'Верба'],
    tier: 2,
  },
  {
    key: 'anthem',
    question: 'Як називають головну урочисту пісню держави?',
    answer: 'Гімн',
    options: ['Гімн', 'Колискова', 'Казка', 'Лічилка'],
    tier: 3,
  },
];

function configFor(
  difficulty: Difficulty,
  level: ProfileLevel,
): { optionsCount: number; maxTier: Difficulty; factRatio: number } {
  if (level === 'L0') {
    const optionsCount = difficulty === 1 ? 3 : difficulty === 2 ? 3 : 4;
    return { optionsCount, maxTier: difficulty, factRatio: 0 };
  }
  const optionsCount = difficulty === 3 ? 4 : 3;
  const factRatio = difficulty === 1 ? 0.2 : difficulty === 2 ? 0.5 : 0.8;
  return { optionsCount, maxTier: difficulty, factRatio };
}

export const ROUNDS_PER_LEVEL = 5;

/**
 * Генерація раундів. Ключове: кожен символ/факт трапляється в спробі ЛИШЕ РАЗ —
 * раніше target бралась випадково без перевірки, тож той самий символ міг випасти
 * усі 5 раундів поспіль. Якщо унікального матеріалу менше за ROUNDS_PER_LEVEL —
 * краще менше раундів, ніж повтори.
 */
function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, string> {
  if (level === 'L0') return makeFindRounds(KID_SYMBOLS, difficulty) as unknown as LevelData<Payload, string>;
  const cfg = configFor(difficulty, level);
  const rounds: Round<Payload, string>[] = [];

  // окремі пули, кожен перемішаний раз → беремо послідовно, без повторів
  const factPool = shuffle(FACT_ITEMS.filter((f) => f.tier <= cfg.maxTier));
  const emojiPool = shuffle(EMOJI_ITEMS.filter((e) => e.tier <= cfg.maxTier));
  const wantFacts = Math.round(ROUNDS_PER_LEVEL * cfg.factRatio);

  const takeFact = (i: number): Round<Payload, string> | null => {
    const fact = factPool.shift();
    if (!fact) return null;
    const distractors = shuffle(fact.options.filter((o) => o !== fact.answer)).slice(0, cfg.optionsCount - 1);
    return {
      id: `r${i}`,
      payload: { question: fact.question, options: shuffle([fact.answer, ...distractors]) },
      answer: fact.answer,
    };
  };

  const takeEmoji = (i: number): Round<Payload, string> | null => {
    const target = emojiPool.shift();
    if (!target) return null;
    const distractors = shuffle(SYMBOL_NAMES.filter((n) => n !== target.name)).slice(0, cfg.optionsCount - 1);
    return {
      id: `r${i}`,
      payload: { question: 'Що це за символ?', emoji: target.emoji, options: shuffle([target.name, ...distractors]) },
      answer: target.name,
    };
  };

  for (let i = 0; i < ROUNDS_PER_LEVEL; i++) {
    const preferFact = rounds.filter((r) => !r.payload.emoji).length < wantFacts;
    // якщо бажаний тип вичерпано — добираємо іншим, аби не повторювати матеріал
    const round = preferFact ? (takeFact(i) ?? takeEmoji(i)) : (takeEmoji(i) ?? takeFact(i));
    if (!round) break;
    rounds.push(round);
  }

  return { difficulty, rounds };
}

function Component(props: GameComponentProps<Payload, string>) {
  const preschool = usePreschool();
  if (preschool && (props.round.payload as unknown as FindPayload).kid)
    return <FindPicture {...(props as unknown as GameComponentProps<FindPayload, string>)} items={KID_SYMBOLS} phrase={{ key: 'p_find_sym', text: 'Знайди' }} prefix="sym" album="symbols" />;
  return <SchoolSymbols {...props} />;
}

function SchoolSymbols({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { question, emoji, options } = round.payload;
  const choices = options.map((opt) => ({ value: opt }));
  return (
    <>
      <PromptCard question={question} answerState={answerState}>
        {emoji ? <div style={{ fontSize: 88, textAlign: 'center', margin: '8px auto', lineHeight: 1 }}>{emoji}</div> : null}
      </PromptCard>
      <ChoiceGrid
        options={choices}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
      />
    </>
  );
}

const uaSymbols: GameDefinition<Payload, string> = {
  id: 'ua-symbols',
  title: 'Символи України',
  subject: 'world',
  levels: ['L0', 'L3'],
  icon: '🌻',
  description: 'Символи України.',
  accent: '#FEF9C3',
  generate,
  Component,
  // TODO(A2-світ): skills після seed skill-graph світу
};

export default uaSymbols;
