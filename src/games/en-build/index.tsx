import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { sayUkSeq } from '../shared/uk-audio';
import { PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { shuffle } from '../shared/ui';
import { useProfileStore } from '@/stores/useProfileStore';
import { WORDS, enKey, type Word } from '../en-topics/words';

/**
 * «Build the Word» (11.10.2026) — англійське дзеркало «Склади слово»: картинка, слово звучить
 * (британський голос), дитина ставить букви-плитки по порядку; не та — хитається й лишається.
 * Слова — ті самі, що в «English Words» (дитина складає знайоме). Довжина 3 → 4 → 5 букв:
 * наступна відкривається після 5 чистих слів поспіль. Плитки не озвучуються: звуків букв
 * (phonics) без запису голосом немає, а назва букви («ес») заважала б.
 */
interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const ROUNDS = 5;
const CLEAN_TO_LEVEL_UP = 5;
const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
const INK = ['#2563EB', '#DC2626', '#16A34A', '#7C3AED'];
const EXTRA = ['a', 'e', 'i', 'o', 'u', 's', 't', 'm', 'n', 'p', 'r', 'b'];

type Len = 3 | 4 | 5;
export const WORDS_BY_LEN: Record<Len, Word[]> = {
  3: WORDS.filter((w) => w.en.length === 3),
  4: WORDS.filter((w) => w.en.length === 4),
  5: WORDS.filter((w) => w.en.length === 5),
};

interface Task {
  word: Word;
  tiles: string[];
}

/** 5 слів потрібної довжини; плитки — букви слова + зайві (1 для 3–4 букв, 2 для 5). */
export function buildTasks(len: Len): Task[] {
  return shuffle(WORDS_BY_LEN[len]).slice(0, ROUNDS).map((word) => {
    const letters = word.en.split('');
    const extra = shuffle(EXTRA.filter((e) => !letters.includes(e))).slice(0, len === 5 ? 2 : 1);
    return { word, tiles: shuffle([...letters, ...extra]) };
  });
}

interface Progress { len: Len; clean: number }
const keyFor = (id: string) => `shk.enb.v1.${id}`;
function load(id: string): Progress {
  try {
    return { len: 3, clean: 0, ...(JSON.parse(localStorage.getItem(keyFor(id)) ?? '{}') as Partial<Progress>) };
  } catch {
    return { len: 3, clean: 0 };
  }
}
function save(id: string, p: Progress) {
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(p));
  } catch {
    // без памʼяті — почнемо з 3 букв
  }
}

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'enb-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: ROUNDS }, () => round) };
}

const PHRASE = { key: 'p_en_build', text: 'Склади слово!' };
const sayWord = (w: Word, withPhrase = false) => sayUkSeq(withPhrase ? [PHRASE, { key: enKey(w), text: w.en }] : [{ key: enKey(w), text: w.en }]);

function Component({ onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const profileId = useProfileStore((st) => st.activeProfile?.id) ?? 'guest';
  const [, setProg] = useState<Progress>(() => load(profileId));
  const [tasks] = useState<Task[]>(() => buildTasks(load(profileId).len));
  const [missed, setMissed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const task = tasks[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / tasks.length) * 5)), [idx, tasks.length, report]);

  // на старті слова — слово звучить; фраза завдання — лише перед першим
  useEffect(() => {
    if (!task) return;
    const t = window.setTimeout(() => sayWord(task.word, idx === 0), 350);
    return () => window.clearTimeout(t);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);

  useEffect(() => {
    if (!done) return;
    sayWord(task.word);
    setProg((p) => {
      const clean = missed ? 0 : p.clean + 1;
      const up = clean >= CLEAN_TO_LEVEL_UP && p.len < 5;
      const nx: Progress = { len: up ? ((p.len + 1) as Len) : p.len, clean: up ? 0 : clean };
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
  const letters = task.word.en.split('');
  const need = letters[placed.length];

  const tap = (i: number) => {
    if (done || placed.includes(i)) return;
    if (task.tiles[i] !== need) {
      setShake(i);
      setMissed(true);
      onMistake();
      window.setTimeout(() => setShake(null), 450);
      return;
    }
    const nx = [...placed, i];
    setPlaced(nx);
    if (nx.length === letters.length) window.setTimeout(() => setDone(true), 400);
  };

  const cell = letters.length >= 5 ? 56 : letters.length === 4 ? 64 : 74;
  const tile = task.tiles.length >= 7 ? 46 : task.tiles.length >= 5 ? 54 : 64;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TaskBubble text={PHRASE.text} onSay={() => sayWord(task.word)}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <PictureCard><span style={{ fontSize: 96, lineHeight: 1 }}>{task.word.emoji}</span></PictureCard>
          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            {letters.map((ch, k) => {
              const filled = k < placed.length;
              return (
                <motion.div key={k} layout
                  style={{ ...BIG, width: cell, height: 70, borderRadius: 18, display: 'grid', placeItems: 'center', fontSize: 42,
                    background: filled ? (done ? '#22C55E' : '#fff') : 'rgba(255,255,255,.55)', color: filled ? (done ? '#fff' : INK[k % INK.length]) : 'transparent',
                    border: filled ? '0' : '3px dashed #F2C79B', boxShadow: filled ? `0 5px 0 ${done ? '#15803d' : '#EED9BF'}` : 'none',
                    animation: done ? 'pk-pop .5s ease-out forwards' : undefined }}>
                  {filled ? ch : '·'}
                </motion.div>
              );
            })}
          </div>
        </div>
      </TaskBubble>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, padding: '4px 0 10px', minHeight: tile }}>
        {task.tiles.map((t, i) => (
          <motion.button key={`${idx}-${i}`} type="button" onClick={() => tap(i)} whileTap={{ scale: 0.92 }}
            style={{ ...BIG, width: tile, height: tile, borderRadius: 20, border: 0, background: '#fff', color: INK[i % INK.length], fontSize: 40,
              boxShadow: '0 6px 0 #EED9BF', cursor: 'pointer', visibility: placed.includes(i) ? 'hidden' : 'visible',
              animation: shake === i ? 'pk-shake .4s ease' : undefined }}>
            {t}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

const enBuild: GameDefinition<BoardPayload, Answer> = {
  id: 'en-build',
  title: 'Build the Word',
  subject: 'english',
  levels: ['L0', 'L3'],
  icon: '🔤',
  description: 'Почуй слово англійською й склади його з букв по порядку.',
  accent: '#DBEAFE',
  generate,
  Component,
};

export default enBuild;
