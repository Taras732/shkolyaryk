import type { Difficulty, GameComponentProps, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';

/**
 * Дошкілля (10.10.2026): «Що з чим дружить?» — без фази «запам'ятай» (пам'ять тренує Печера).
 * Намальований предмет і 3–4 картинки, одна з них — його пара. Картинки в public/count.
 */
export const KID_PAIRS: [string, string][] = [
  ['dog', 'as_bone'],
  ['bunny', 'carrot'],
  ['cow', 'as_milk'],
  ['cyc_hen', 'cyc_egg'],
  ['as_bee', 'flower'],
  ['as_raincloud', 'as_umbrella'],
  ['mouse', 'as_cheese'],
  ['bear', 'as_honey'],
  ['cat', 'as_yarn'],
  ['as_toothbrush', 'as_toothpaste'],
];

export interface KidAssocP {
  kid: true;
  query: string;
  options: string[];
}

/** Рівень 1 — 3 варіанти, 2 — 4, 3 — 4 і пара буває навпаки (кісточка → чия?). */
export function generateKids(d: Difficulty): LevelData<KidAssocP, string> {
  const order = shuffle(KID_PAIRS.map((_, i) => i));
  const rounds: Round<KidAssocP, string>[] = order.slice(0, 5).map((t, i) => {
    const flip = d === 3 && Math.random() < 0.5;
    const side = (p: [string, string], q: boolean) => (q !== flip ? p[0] : p[1]);
    const query = side(KID_PAIRS[t], true);
    const answer = side(KID_PAIRS[t], false);
    const others = shuffle(KID_PAIRS.filter((_, k) => k !== t)).slice(0, d === 1 ? 2 : 3).map((p) => side(p, false));
    return { id: `r${i}`, payload: { kid: true, query, options: shuffle([answer, ...others]) }, answer };
  });
  return { difficulty: d, rounds };
}

const pic = (id: string, size: number) => (
  <img src={`/count/${id}.webp`} alt="" draggable={false} style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />
);

export function KidsAssoc({ round, disabled, answerState, onAnswer }: GameComponentProps<KidAssocP, string>) {
  const { query, options } = round.payload;
  // фраза — раз на гру (перший раунд), 🔊 — повторити
  const say = (again?: boolean) => (again || round.id === 'r0') && sayUk('p_assoc', 'Що з чим дружить?');
  return (
    <>
      <PromptCard question="Що з чим дружить?" answerState={answerState} say={say} sayKey={round.id}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{pic(query, 150)}</div>
      </PromptCard>
      <ChoiceGrid options={options.map((o) => ({ value: o, node: <span aria-label={o} style={{ display: 'block' }}>{pic(o, 64)}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={options.length === 3 ? 3 : 2} />
    </>
  );
}
