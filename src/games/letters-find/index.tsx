import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { hasUkAudio, sayUkSeq } from '../shared/uk-audio';
import { findLetterKey, letterParts } from '../shared/spoken-names';

interface Payload {
  target: string;
  options: string[];
}

const ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Ґ', 'Д', 'Е', 'Є', 'Ж', 'З', 'И', 'І', 'Ї', 'Й', 'К',
  'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ',
  'Ь', 'Ю', 'Я',
];

// Групи візуально схожих літер (для diff3 — "підступні" відволікачі).
// Літера може входити в кілька груп; використовуємо об'єднання всіх груп цілі.
const SIMILAR_GROUPS: string[][] = [
  ['О', 'С', 'Ф'],
  ['И', 'Й'],
  ['Н', 'П', 'Ц', 'Ш', 'Щ'],
  ['Ш', 'Щ'],
  ['Е', 'Є'],
  ['Г', 'Ґ'],
  ['В', 'Р', 'Ь', 'Б'],
  ['Ю', 'Н'],
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
  // не вистачає схожих — добираємо рештою (дошкільний алфавіт невеликий)
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
      {hasUkAudio(findLetterKey(target)) ? (
        // ціль лише звучить: намальована, вона була б і серед варіантів — відповідь у завданні
        <PromptCard
          question="Знайди букву"
          answerState={answerState}
          say={(again) => sayUkSeq(letterParts(target, again))}
          sayKey={`${round.id}-${target}`}
        />
      ) : (
        // звуку немає зовсім — показуємо, щоб гра лишалась прохідною
        <PromptCard question="Знайди таку саму букву" answerState={answerState}>
          <div style={{ fontSize: 72, fontWeight: 700, color: 'var(--c-primary)', textAlign: 'center', margin: '8px auto' }}>{target}</div>
        </PromptCard>
      )}
      <ChoiceGrid options={choices} correct={target} disabled={disabled} answerState={answerState} onPick={onAnswer} />
    </>
  );
}

const lettersFind: GameDefinition<Payload, string> = {
  id: 'letters-find',
  title: 'Знайди букву',
  subject: 'language',
  levels: ['L0'],
  icon: '🔤',
  description: 'Послухай і знайди букву.',
  accent: '#EEEBFF',
  generate,
  Component,
  // TODO(A2-мова): skills після seed skill-graph мови
};

export default lettersFind;
