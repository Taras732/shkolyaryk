import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { HS_WORDS, STRESS_WORDS, VC_WORDS, VOWELS, wordKey } from './words';

/**
 * «Звуки в слові» (11.10.2026) — 1 клас, програма Савченко [1 МОВ 4.1]: голосні й приголосні,
 * тверді й мʼякі, наголос. Кольорова модель звуків НУШ: голосний — червоний, твердий — синій,
 * мʼякий — зелений. Слово звучить і має картинку; фраза завдання — раз на гру (r0), далі лише слово.
 *  d1 — виділена буква: голосний чи приголосний;
 *  d2 — виділений приголосний: твердий чи мʼякий (пари лис — ліс, кит — кіт);
 *  d3 — де наголос: тапнути наголошений склад.
 */

type Payload =
  | { mode: 'vc'; word: string; emoji: string; at: number }
  | { mode: 'hs'; word: string; emoji: string; at: number }
  | { mode: 'stress'; word: string; emoji: string; syllables: string[] };
type Answer = string | number;

const ROUNDS = 6;

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (difficulty === 1) {
    rounds = shuffle(VC_WORDS).slice(0, ROUNDS).map((w, i) => ({
      id: `r${i}`, payload: { mode: 'vc', word: w.word, emoji: w.emoji, at: w.at }, answer: VOWELS.has(w.word[w.at]) ? 'vowel' : 'cons',
    }));
  } else if (difficulty === 2) {
    // пари поруч не ставимо, але в сесії половина твердих, половина мʼяких
    const soft = shuffle(HS_WORDS.filter((w) => w.soft)).slice(0, ROUNDS / 2);
    const hard = shuffle(HS_WORDS.filter((w) => !w.soft)).slice(0, ROUNDS / 2);
    rounds = shuffle([...soft, ...hard]).map((w, i) => ({
      id: `r${i}`, payload: { mode: 'hs', word: w.word, emoji: w.emoji, at: w.at }, answer: w.soft ? 'soft' : 'hard',
    }));
  } else {
    rounds = shuffle(STRESS_WORDS).slice(0, ROUNDS).map((w, i) => ({
      id: `r${i}`, payload: { mode: 'stress', word: w.word, emoji: w.emoji, syllables: w.syllables }, answer: w.stress,
    }));
  }
  return { difficulty, rounds };
}

const RED = '#EF4444';
const BLUE = '#3B82F6';
const GREEN = '#22C55E';

/** Кольорова фішка звуку, як у звукових схемах НУШ. */
const Chip = ({ color, label }: { color: string; label: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 26, height: 26, borderRadius: 7, background: color, display: 'inline-block' }} />
    <span style={{ fontSize: 16 }}>{label}</span>
  </span>
);

function Word({ word, at }: { word: string; at: number }) {
  return (
    <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: 4, textAlign: 'center', fontFamily: 'var(--font-round)' }}>
      {[...word].map((ch, i) => (
        <span key={i} style={i === at ? { color: 'var(--c-primary)', borderBottom: '5px solid var(--c-primary)' } : undefined}>{ch}</span>
      ))}
    </div>
  );
}

const PHRASES = {
  vc: { key: 'p_snd_vc', text: 'Голосний чи приголосний?' },
  hs: { key: 'p_snd_hs', text: 'Твердий чи мʼякий?' },
  stress: { key: 'p_snd_stress', text: 'Де наголос?' },
} as const;

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const word = { key: wordKey(p.word), text: p.word };
  const say = hasUkAudio(word.key) ? (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [word] : [phrase, word]) : undefined;
  const pic = <div style={{ fontSize: 64, textAlign: 'center', lineHeight: 1.1 }}>{p.emoji}</div>;

  if (p.mode === 'stress') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>{pic}</PromptCard>
        <ChoiceGrid
          options={p.syllables.map((s, i) => ({ value: i, node: <span style={{ fontSize: 30, fontWeight: 900 }}>{s}</span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={p.syllables.length} />
      </>
    );
  }

  const options = p.mode === 'vc'
    ? [{ value: 'vowel', node: <Chip color={RED} label="голосний" /> }, { value: 'cons', node: <Chip color={BLUE} label="приголосний" /> }]
    : [{ value: 'hard', node: <Chip color={BLUE} label="твердий" /> }, { value: 'soft', node: <Chip color={GREEN} label="мʼякий" /> }];
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        {pic}
        <Word word={p.word} at={p.at} />
      </PromptCard>
      <ChoiceGrid options={options} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={2} />
    </>
  );
}

const ukSounds: GameDefinition<Payload, Answer> = {
  id: 'uk-sounds',
  title: 'Звуки в слові',
  subject: 'language',
  levels: ['L3'],
  icon: '🔴',
  description: 'Голосні й приголосні, тверді й мʼякі, наголос — у словах з картинкою.',
  accent: '#FFE4E6',
  skillsFor: (d) => [d === 1 ? 'language.sounds.l1.vowels-consonants' : d === 2 ? 'language.sounds.l1.hard-soft-consonants' : 'language.sounds.l1.stress'],
  // 11.10: «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'stress') {
      const st = round.answer as number;
      return { steps: [p.syllables.map((x, i) => (i === st ? x.toUpperCase() : x)).join('-'), 'Наголошений склад вимовляємо сильніше й довше.'] };
    }
    const ch = p.word[p.at];
    if (p.mode === 'vc') {
      return round.answer === 'vowel'
        ? { steps: [`«${ch}» — голосний.`, 'Голосний звук співається голосом, нічого не заважає: а-а-а.'] }
        : { steps: [`«${ch}» — приголосний.`, 'Губи, язик чи зуби заважають повітрю — звук не проспіваєш.'] };
    }
    const next = p.word[p.at + 1];
    return round.answer === 'soft'
      ? { steps: [`«${ch}» тут мʼякий.`, next === 'ь' ? 'Після нього мʼякий знак — він помʼякшує.' : `Після нього «${next}» — вона помʼякшує.`] }
      : { steps: [`«${ch}» тут твердий.`, next ? `Після нього «${next}» — звучить твердо.` : 'Він у кінці слова й звучить твердо.'] };
  },
  generate,
  Component,
};

export default ukSounds;
