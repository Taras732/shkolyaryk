import type { ReactNode } from 'react';
import type { Difficulty, GameComponentProps, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid, shuffle } from './ui';
import { hasUkAudio, sayUkSeq } from './uk-audio';
import { motion } from 'motion/react';
import { SceneTask } from './count-ui';
import { addSticker, type AlbumSection } from '@/pets/album';
import { useProfileStore } from '@/stores/useProfileStore';

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
  /** Який набір картинок (гра з кількома наборами — пори року / погода). */
  set?: string;
  target: string;
  options: string[];
}

export function makeFindRounds(items: FindItem[], d: Difficulty, rounds = 5, opts: { count?: number; set?: string } = {}): LevelData<FindPayload, string> {
  const count = Math.min(items.length, opts.count ?? (d === 1 ? 3 : 4));
  const targets = shuffle(items).slice(0, Math.min(rounds, items.length));
  const out: Round<FindPayload, string>[] = targets.map((t, i) => ({
    id: `r${i}`,
    payload: { kid: true, set: opts.set, target: t.id, options: shuffle([t.id, ...shuffle(items.filter((x) => x.id !== t.id)).slice(0, count - 1).map((x) => x.id)]) },
    answer: t.id,
  }));
  return { difficulty: d, rounds: out };
}

export function FindPicture({ round, disabled, answerState, onAnswer: answer, items, phrase, prefix, big, album }: GameComponentProps<FindPayload, string> & {
  /** Сцени (пори року): великі картки 2×2 прямо на сцені замість кружечків. */
  big?: boolean;
  /** Знайдене правильно — наліпка в альбом друга. */
  album?: AlbumSection;
  items: FindItem[];
  phrase: { key: string; text: string };
  /** Префікс ключів озвучки назв: `${prefix}_${id}`. */
  prefix: string;
}) {
  const profileId = useProfileStore((s) => s.activeProfile?.id);
  const onAnswer = (id: string) => { if (album && id === round.answer) addSticker(profileId, album, id); answer(id); };
  const byId = new Map(items.map((x) => [x.id, x]));
  const t = byId.get(round.payload.target)!;
  const name = { key: `${prefix}_${t.id}`, text: t.say };
  const say = hasUkAudio(name.key) ? (again?: boolean) => sayUkSeq(again || round.id !== 'r0' ? [name] : [phrase, name]) : undefined;
  if (big) {
    const sayFn = say ?? (() => {});
    return (
      <SceneTask question={phrase.text} say={sayFn} sayKey={round.id} peek={false}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, width: '100%', maxWidth: 340, position: 'relative', zIndex: 1 }}>
          {round.payload.options.map((id) => {
            const x = byId.get(id)!;
            const right = answerState === 'correct' && id === round.answer;
            return (
              <motion.button key={id} type="button" aria-label={x.say} disabled={disabled} whileTap={{ scale: 0.95 }} onClick={() => !disabled && onAnswer(id)}
                style={{ aspectRatio: '1', border: 0, padding: 0, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', background: '#fff',
                  boxShadow: right ? '0 0 0 5px #22C55E, 0 6px 0 #9FDDB0' : '0 6px 0 #F1E3CF', opacity: answerState === 'correct' && !right ? 0.45 : 1 }}>
                <img src={x.img} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </motion.button>
            );
          })}
        </div>
      </SceneTask>
    );
  }
  const pic = (x: FindItem) => x.node ?? <img src={x.img} alt="" draggable={false} style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }} />;
  return (
    <>
      <PromptCard question={phrase.text} answerState={answerState} say={say} sayKey={round.id} />
      <ChoiceGrid options={round.payload.options.map((id) => ({ value: id, node: <span aria-label={byId.get(id)!.say} style={{ display: 'block', lineHeight: 0 }}>{pic(byId.get(id)!)}</span> }))}
        correct={round.answer} disabled={disabled} answerState={answerState} onPick={onAnswer} columns={round.payload.options.length === 3 ? 3 : 2} />
    </>
  );
}
