/**
 * Англійські слова для дошкілля за темами (рішення 11.10.2026: англійська — дзеркало української
 * стежки). У кожній темі спершу короткі слова. Картинка — емодзі, як у «Буква і звук»;
 * `img` — намальована заміна, коли зʼявиться.
 */
export interface Word {
  id: string;
  /** Що звучить і що підписано під картинкою. */
  en: string;
  emoji: string;
  img?: string;
}

const W = (en: string, emoji: string): Word => ({ id: en, en, emoji });

export const GROUPS: { title: string; words: Word[] }[] = [
  { title: 'Тварини', words: [W('cat', '🐱'), W('dog', '🐶'), W('pig', '🐷'), W('hen', '🐔'), W('fox', '🦊'), W('cow', '🐮')] },
  { title: 'Дім', words: [W('bed', '🛏️'), W('cup', '☕'), W('door', '🚪'), W('lamp', '💡'), W('book', '📖'), W('house', '🏠')] },
  { title: 'Тіло', words: [W('eye', '👁️'), W('ear', '👂'), W('nose', '👃'), W('hand', '✋'), W('mouth', '👄'), W('foot', '🦶')] },
  { title: 'Людина', words: [W('mum', '👩'), W('dad', '👨'), W('baby', '👶'), W('boy', '👦'), W('girl', '👧')] },
  { title: 'Їжа', words: [W('egg', '🥚'), W('milk', '🥛'), W('cake', '🍰'), W('apple', '🍎'), W('bread', '🍞'), W('banana', '🍌')] },
  { title: 'Одяг', words: [W('hat', '👒'), W('sock', '🧦'), W('cap', '🧢'), W('dress', '👗'), W('coat', '🧥'), W('shoes', '👟')] },
  { title: 'Тварини 2', words: [W('duck', '🦆'), W('fish', '🐟'), W('frog', '🐸'), W('bear', '🐻'), W('horse', '🐴'), W('mouse', '🐭')] },
  { title: 'Дім 2', words: [W('key', '🔑'), W('bath', '🛁'), W('sofa', '🛋️'), W('chair', '🪑'), W('clock', '🕰️'), W('window', '🪟')] },
  { title: 'Людина 2', words: [W('leg', '🦵'), W('tooth', '🦷'), W('granny', '👵'), W('grandad', '👴')] },
  { title: 'Їжа 2', words: [W('pear', '🍐'), W('juice', '🧃'), W('cheese', '🧀'), W('carrot', '🥕'), W('orange', '🍊')] },
];

export const WORDS: Word[] = GROUPS.flatMap((g) => g.words);

/** Ключ аудіофайлу слова (англійський голос, scripts/gen-uk-audio.py). */
export const enKey = (w: Word) => `en_w_${w.en}`;
