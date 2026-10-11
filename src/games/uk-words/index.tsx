import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { CLOSE, OPPOSITES, SWAPS } from './data';

/**
 * «Слова» (11.10.2026) — 1 клас, програма Савченко [1 МОВ 4.1–4.2]:
 *  d1 — протилежне за значенням (дистрактори — та сама частина мови);
 *  d2 — близьке за значенням (серед варіантів навмисно протилежне — його найчастіше плутають);
 *  d3 — заміна звука змінює слово: звучить «ліс» — знайди картинку серед 🌲, 🦊 і ще однієї.
 * Фраза завдання — раз на гру (r0), далі лише слово.
 */

type Payload =
  | { mode: 'opp' | 'close'; word: string; options: string[] }
  | { mode: 'swap'; word: string; options: string[] };
type Answer = string;

const ROUNDS = 5;
const wkey = (w: string) => `w_${w}`;

export function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  let rounds: Round<Payload, Answer>[];
  if (difficulty === 1) {
    rounds = shuffle(OPPOSITES).slice(0, ROUNDS).map((o, i) => {
      const [word, answer] = Math.random() < 0.5 ? [o.a, o.b] : [o.b, o.a];
      // дистрактори — спершу та сама частина мови, далі будь-які (прислівників і дієслів лише по дві пари)
      const pool = [...shuffle(OPPOSITES.filter((x) => x !== o && x.kind === o.kind)), ...shuffle(OPPOSITES.filter((x) => x.kind !== o.kind))];
      const others = pool.slice(0, 2).map((x) => (Math.random() < 0.5 ? x.a : x.b));
      return { id: `r${i}`, payload: { mode: 'opp', word, options: shuffle([answer, ...others]) }, answer };
    });
  } else if (difficulty === 2) {
    rounds = shuffle(CLOSE).slice(0, ROUNDS).map((c, i) => {
      const other = shuffle(CLOSE.filter((x) => x !== c)).map((x) => x.b).find((w) => w !== c.opp)!;
      return { id: `r${i}`, payload: { mode: 'close', word: c.a, options: shuffle([c.b, c.opp, other]) }, answer: c.b };
    });
  } else {
    rounds = shuffle(SWAPS).slice(0, ROUNDS).map((s, i) => {
      const extra = shuffle(SWAPS.filter((x) => x.emoji !== s.emoji && x.emoji !== s.pairEmoji))[0].emoji;
      return { id: `r${i}`, payload: { mode: 'swap', word: s.word, options: shuffle([s.emoji, s.pairEmoji, extra]) }, answer: s.emoji };
    });
  }
  return { difficulty, rounds };
}

const PHRASES = {
  opp: { key: 'p_words_opp', text: 'Знайди протилежне за значенням.' },
  close: { key: 'p_words_close', text: 'Знайди близьке за значенням.' },
  swap: { key: 'p_words_swap', text: 'Послухай уважно і знайди картинку.' },
} as const;

const WORD = { fontSize: 40, fontWeight: 900, textAlign: 'center' as const, fontFamily: 'var(--font-round)' };

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const p = round.payload;
  const phrase = PHRASES[p.mode];
  const word = { key: wkey(p.word), text: p.word };
  const say = hasUkAudio(word.key) ? (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [word] : [phrase, word]) : undefined;

  if (p.mode === 'swap') {
    return (
      <>
        <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
          <div style={WORD}>{p.word}</div>
        </PromptCard>
        <ChoiceGrid options={p.options.map((e) => ({ value: e, node: <span style={{ fontSize: 46, lineHeight: 1 }}>{e}</span> }))}
          correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
      </>
    );
  }
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id}>
        <div style={WORD}>{p.word}</div>
      </PromptCard>
      <ChoiceGrid options={p.options.map((w) => ({ value: w }))} correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={3} />
    </>
  );
}

const ukWords: GameDefinition<Payload, Answer> = {
  id: 'uk-words',
  title: 'Слова',
  subject: 'language',
  levels: ['L3'],
  icon: '💬',
  description: 'Протилежні й близькі за значенням слова; один звук — і вже інше слово.',
  accent: '#FEF9C3',
  skillsFor: (d) => [d === 3 ? 'language.sounds.l1.sound-change-word' : 'language.word.l1.synonyms-antonyms'],
  // «чому так» — за 💡 після відповіді
  explain: (round) => {
    const p = round.payload;
    if (p.mode === 'opp') return { steps: [`${p.word} — ${round.answer}`, 'Ці слова протилежні: означають зовсім різне.'] };
    if (p.mode === 'close') {
      const c = CLOSE.find((x) => x.a === p.word)!;
      return { steps: [`${p.word} — ${c.b}`, 'Ці слова близькі: означають майже те саме.'], why: `«${c.opp}» — навпаки, протилежне.` };
    }
    const s = SWAPS.find((x) => x.word === p.word)!;
    return { steps: [`${s.word} ${s.emoji} — ${s.pair} ${s.pairEmoji}`, 'Один звук інший — і слово означає вже інше.'] };
  },
  generate,
  Component,
};

export default ukWords;
