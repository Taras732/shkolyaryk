import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { canSpeak, speak } from '../english-words/speech';
import { findEnLetterText } from '../shared/spoken-names';

interface Payload {
  target: string;
  options: string[];
}

const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

// Групи візуально схожих літер (для diff3 — "підступні" відволікачі).
// Літера може входити в кілька груп; використовуємо об'єднання всіх груп цілі.
const SIMILAR_GROUPS: string[][] = [
  ['O', 'Q', 'C'],
  ['M', 'N', 'W'],
  ['E', 'F'],
  ['P', 'R', 'B'],
  ['I', 'L', 'T'],
];

function similarSet(target: string): Set<string> {
  const set = new Set<string>();
  for (const group of SIMILAR_GROUPS) {
    if (group.includes(target)) {
      for (const l of group) if (l !== target) set.add(l);
    }
  }
  return set;
}

/** Відволікачі, свідомо несхожі на ціль (diff1/diff2 — дошкільнятам легше). */
function dissimilarDistractors(target: string, count: number): string[] {
  const similar = similarSet(target);
  const pool = ALPHABET.filter((l) => l !== target && !similar.has(l));
  return shuffle(pool).slice(0, count);
}

/** Відволікачі, схожі за формою на ціль (diff3 — складніше розрізнити). */
function similarDistractors(target: string, count: number): string[] {
  const similar = shuffle(Array.from(similarSet(target)));
  if (similar.length >= count) return similar.slice(0, count);
  // не вистачає схожих — добираємо рештою (алфавіт невеликий)
  const rest = shuffle(ALPHABET.filter((l) => l !== target && !similar.includes(l)));
  return similar.concat(rest).slice(0, count);
}

function optionsCountFor(d: Difficulty): number {
  return d === 1 ? 3 : 4;
}

function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const total = optionsCountFor(difficulty);
  const targets = shuffle(ALPHABET).slice(0, 5);
  const rounds: Round<Payload, string>[] = targets.map((target, i) => {
    const distractors =
      difficulty === 3 ? similarDistractors(target, total - 1) : dissimilarDistractors(target, total - 1);
    const options = shuffle([target, ...distractors]);
    return { id: `r${i}`, payload: { target, options }, answer: target };
  });
  return { difficulty, rounds };
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  const { target, options } = round.payload;
  const choices = options.map((letter) => ({
    value: letter,
    node: <span style={{ fontSize: 32, fontWeight: 700 }}>{letter}</span>,
  }));
  return (
    <>
      {canSpeak() ? (
        // ціль лише звучить: намальована, вона була б і серед варіантів — відповідь у завданні
        <PromptCard question="Find the letter" answerState={answerState} say={() => speak(findEnLetterText(target))} sayKey={`${round.id}-${target}`} />
      ) : (
        <PromptCard question="Find the same letter" answerState={answerState}>
          <div style={{ fontSize: 72, fontWeight: 700, color: 'var(--c-primary)', textAlign: 'center', margin: '8px auto' }}>{target}</div>
        </PromptCard>
      )}
      <ChoiceGrid options={choices} correct={target} disabled={disabled} answerState={answerState} onPick={onAnswer} />
    </>
  );
}

const lettersFindEn: GameDefinition<Payload, string> = {
  id: 'letters-find-en',
  title: 'Find the Letter',
  subject: 'english',
  levels: ['L0'],
  icon: '🔤',
  description: 'Listen and find the letter.',
  accent: '#DBEAFE',
  generate,
  Component,
  // TODO(A2-англійська): skills після seed skill-graph англійської
};

export default lettersFindEn;
