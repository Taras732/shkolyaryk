import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, randInt, shuffle } from '../shared/ui';
import { ALL_LOOK_ALIKE, LOOK_ALIKE } from '../shared/look-alike';

/**
 * «Що тут зайве?» (09.10.2026): ряд картинок, одна не така — знайди її.
 *  1 — три однакові + одна зовсім інша (🍎🍎🍎🐶) — уважність;
 *  2 — три однакові + одна схожа (🍎🍎🍅🍎) — уважність до деталей;
 *  3 — три з однієї групи + одна з іншої (🐶🐺🦊 + 🚗) — класифікація, «що не підходить».
 * Відповідь — номер зайвої картинки.
 */
interface Payload {
  items: string[];
}

const ROUNDS = 6;

function makeRound(d: Difficulty): { items: string[]; odd: number } {
  const groups = shuffle(LOOK_ALIKE);
  const g = groups[0];
  let items: string[];
  let oddItem: string;
  if (d === 3) {
    const three = shuffle(g).slice(0, 3);
    oddItem = groups[1][randInt(0, groups[1].length - 1)];
    items = three;
  } else {
    const main = g[randInt(0, g.length - 1)];
    items = [main, main, main];
    oddItem = d === 2
      ? g.filter((e) => e !== main)[randInt(0, g.length - 2)]
      : ALL_LOOK_ALIKE.filter((e) => !g.includes(e))[randInt(0, ALL_LOOK_ALIKE.length - g.length - 1)];
  }
  const odd = randInt(0, 3);
  items.splice(odd, 0, oddItem);
  return { items, odd };
}

function generate(difficulty: Difficulty): LevelData<Payload, string> {
  const rounds: Round<Payload, string>[] = Array.from({ length: ROUNDS }, (_, i) => {
    const { items, odd } = makeRound(difficulty);
    return { id: `r${i}`, payload: { items }, answer: String(odd) };
  });
  return { difficulty, rounds };
}

function Component({ round, disabled, answerState, onAnswer }: GameComponentProps<Payload, string>) {
  return (
    <>
      <PromptCard question="Що тут зайве?" answerState={answerState} />
      <ChoiceGrid
        options={round.payload.items.map((e, i) => ({ value: String(i), node: <span style={{ fontSize: 44 }}>{e}</span> }))}
        correct={round.answer}
        disabled={disabled}
        answerState={answerState}
        onPick={onAnswer}
        columns={4}
      />
    </>
  );
}

const oddOneOut: GameDefinition<Payload, string> = {
  id: 'odd-one-out',
  title: 'Що тут зайве?',
  subject: 'attention',
  levels: ['L0'],
  icon: '🤔',
  description: 'Одна картинка не така, як інші — знайди її.',
  accent: '#FFE3EC',
  generate,
  Component,
};

export default oddOneOut;
