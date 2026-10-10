import type { ReactNode } from 'react';
import type { Difficulty, GameComponentProps, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from './ui';
import { hasUkAudio, sayUkSeq } from './uk-audio';

/**
 * «Знайди …» для дошкілля (10.10.2026): ціль лише звучить, варіанти — картинки (3-річна не читає).
 * Фраза («Знайди…») — раз на гру, на першому раунді; далі й на 🔊 — лише назва цілі.
 * Назва в знахідному відмінку («калину», «зиму»), бо звучить після «Знайди».
 */
export interface FindItem {
  id: string;
  /** Що звучить після «Знайди»: знахідний відмінок. */
  say: string;
  img?: string;
  node?: ReactNode;
}

export interface FindPayload {
  kid: true;
  target: string;
  options: string[];
}

export function makeFindRounds(items: FindItem[], d: Difficulty, rounds = 5): LevelData<FindPayload, string> {
  const count = Math.min(items.length, d === 1 ? 3 : 4);
  const targets = shuffle(items).slice(0, Math.min(rounds, items.length));
  const out: Round<FindPayload, string>[] = targets.map((t, i) => ({
    id: `r${i}`,
    payload: { kid: true, target: t.id, options: shuffle([t.id, ...shuffle(items.filter((x) => x.id !== t.id)).slice(0, count - 1).map((x) => x.id)]) },
    answer: t.id,
  }));
  return { difficulty: d, rounds: out };
}

export function FindPicture({ round, disabled, answerState, onAnswer, items, phrase, prefix }: GameComponentProps<FindPayload, string> & {
  items: FindItem[];
  phrase: { key: string; text: string };
  /** Префікс ключів озвучки назв: `${prefix}_${id}`. */
  prefix: string;
}) {
  const byId = new Map(items.map((x) => [x.id, x]));
  const t = byId.get(round.payload.target)!;
  const name = { key: `${prefix}_${t.id}`, text: t.say };
  const say = hasUkAudio(name.key) ? (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [name] : [phrase, name]) : undefined;
  const pic = (x: FindItem) => x.node ?? <img src={x.img} alt="" draggable={false} style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }} />;
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id} />
      <ChoiceGrid options={round.payload.options.map((id) => ({ value: id, node: <span aria-label={byId.get(id)!.say} style={{ display: 'block', lineHeight: 0 }}>{pic(byId.get(id)!)}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={round.payload.options.length === 3 ? 3 : 2} />
    </>
  );
}
