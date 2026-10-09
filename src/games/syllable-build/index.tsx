import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { useProfileStore } from '@/stores/useProfileStore';
import { ROUNDS, buildByLength, nextLength, type Task } from './core';

/**
 * «Склади слово» (переробка 09.10.2026): картинка, слово звучить; внизу перемішані плитки —
 * тапай по порядку: плитка звучить і летить у свою клітинку; не та — хитається й лишається.
 * Складено — слово звучить цілим, «бум» і зірочки.
 */
interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
const LONG = ['М', 'Н', 'Л', 'Р', 'С', 'З', 'В', 'Ш'];
const INK = ['#2563EB', '#DC2626', '#16A34A', '#7C3AED'];

const sayWord = (w: string) => sayUk(`w_${w.toLowerCase()}`, w.toLowerCase());
/** Плитка звучить: склад — складом; буква — протяжно (М, Н…) або назвою. */
const sayTile = (t: string) =>
  t.length > 1 ? sayUk(`s_${t}`, t.toLowerCase()) : LONG.includes(t) ? sayUk(`c_${t}`, t.toLowerCase()) : sayUk(`n_${t}`, t.toLowerCase());

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'sb-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: ROUNDS }, () => round) };
}

/** Прогрес: скільки букв у словах зараз і скільки чистих слів поспіль. */
interface SbProgress { len: 3 | 4 | 5; clean: number }
const keyFor = (id: string) => `shk.sb.v1.${id}`;
function load(id: string): SbProgress {
  try {
    return { len: 3, clean: 0, ...(JSON.parse(localStorage.getItem(keyFor(id)) ?? '{}') as Partial<SbProgress>) };
  } catch {
    return { len: 3, clean: 0 };
  }
}
function save(id: string, p: SbProgress) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(p));
  } catch {
    // без памʼяті — почнемо з 3 букв
  }
}

function Component({ onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const profileId = useProfileStore((st) => st.activeProfile?.id) ?? 'guest';
  const [, setProg] = useState<SbProgress>(() => load(profileId));
  const [tasks] = useState<Task[]>(() => buildByLength(load(profileId).len));
  const [missed, setMissed] = useState(false); // у цьому слові була помилка
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]); // індекси плиток, що вже в клітинках
  const [shake, setShake] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const task = tasks[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / tasks.length) * 5)), [idx, tasks.length, report]);

  // на старті слова — слово звучить
  useEffect(() => {
    if (!task) return;
    const t = window.setTimeout(() => sayWord(task.entry.word), 350);
    return () => window.clearTimeout(t);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);

  // складено — слово звучить, пауза, далі
  useEffect(() => {
    if (!done) return;
    sayWord(task.entry.word);
    // чисте слово — +1 до серії; 5 поспіль — наступна довжина (з наступної сесії)
    setProg((p) => {
      const clean = missed ? 0 : p.clean + 1;
      const len = nextLength(p.len, clean);
      const nx = { len, clean: len !== p.len ? 0 : clean };
      save(profileId, nx);
      return nx;
    });
    const t = window.setTimeout(() => {
      setDone(false);
      setMissed(false);
      setPlaced([]);
      if (idx + 1 >= tasks.length) finish();
      else setIdx(idx + 1);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;
  const parts = task.entry.parts;
  const need = parts[placed.length];

  const tap = (i: number) => {
    if (done || placed.includes(i)) return;
    const t = task.tiles[i];
    sayTile(t);
    if (t !== need) {
      setShake(i);
      setMissed(true);
      onMistake();
      window.setTimeout(() => setShake(null), 450);
      return;
    }
    const nx = [...placed, i];
    setPlaced(nx);
    if (nx.length === parts.length) window.setTimeout(() => setDone(true), 500);
  };

  // що довше слово — то менші плитки, щоб влізли в рядок
  const tileSize = parts[0].length > 1 ? 92 : parts.length >= 5 ? 60 : parts.length === 4 ? 68 : 78;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TaskBubble text="Склади слово!" onSay={() => sayWord(task.entry.word)}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <PictureCard><span style={{ fontSize: 96, lineHeight: 1 }}>{task.entry.emoji}</span></PictureCard>
          {/* клітинки слова */}
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            {parts.map((p, k) => {
              const filled = k < placed.length;
              return (
                <motion.div key={k} layout
                  style={{ ...BIG, width: tileSize, height: 74, borderRadius: 20, display: 'grid', placeItems: 'center', fontSize: parts[0].length > 1 ? 40 : 46,
                    background: filled ? (done ? '#22C55E' : '#fff') : 'rgba(255,255,255,.55)', color: filled ? (done ? '#fff' : INK[k % INK.length]) : 'transparent',
                    border: filled ? '0' : '3px dashed #F2C79B', boxShadow: filled ? `0 5px 0 ${done ? '#15803d' : '#EED9BF'}` : 'none',
                    animation: done ? 'pk-pop .5s ease-out forwards' : undefined }}>
                  {filled ? p : '·'}
                </motion.div>
              );
            })}
            {done && ['-60px,-40px', '60px,-40px', '0,-60px', '-50px,40px', '50px,40px'].map((pp, k) => {
              const [dx, dy] = pp.split(',');
              return <span key={k} style={{ position: 'absolute', left: '46%', top: '30%', fontSize: 22, ['--dx' as string]: dx, ['--dy' as string]: dy, animation: 'pk-spark .7s ease-out forwards' }}>⭐</span>;
            })}
          </div>
        </div>
      </TaskBubble>

      {/* плитки внизу */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '4px 0 10px', minHeight: tileSize }}>
        {task.tiles.map((t, i) => (
          <motion.button key={`${idx}-${i}`} type="button" onClick={() => tap(i)} whileTap={{ scale: 0.92 }}
            style={{ ...BIG, width: tileSize, height: tileSize, borderRadius: 24, border: 0, background: '#fff', color: INK[i % INK.length], fontSize: t.length > 1 ? 40 : 48,
              boxShadow: '0 6px 0 #EED9BF', cursor: 'pointer', visibility: placed.includes(i) ? 'hidden' : 'visible',
              animation: shake === i ? 'pk-shake .4s ease' : undefined }}>
            {t}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const syllableBuild: GameDefinition<BoardPayload, Answer> = {
  id: 'syllable-build',
  title: 'Склади слово',
  subject: 'language',
  levels: ['L0'],
  icon: '🔡',
  description: 'Почуй слово й склади його з плиток по порядку.',
  accent: '#EEEBFF',
  generate,
  Component,
};

export default syllableBuild;
