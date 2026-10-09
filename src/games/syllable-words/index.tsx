import { useCallback, useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Round, Difficulty, LevelData } from '../types';
import { BOARD_DONE } from '../types';
import { sayUk } from '../shared/uk-audio';
import { Balloons, PictureCard, TaskBubble, useBoardProgress } from '../shared/preschool';
import { Track } from '../shared/track';
import { FINDS, SLIDES, buildSession, type Step } from './core';

/** «Склади → слово»: дотягни склад до складу — вийде слово (див. core.ts). */
interface BoardPayload {
  difficulty: Difficulty;
}
type Answer = typeof BOARD_DONE;

const AFTER_MERGE_MS = 1700;
const BIG = { fontFamily: 'var(--font-round)', fontWeight: 900 } as const;
const saySyl = (s: string) => sayUk(`s_${s}`, s.toLowerCase());
const sayWord = (w: string) => sayUk(`w_${w.toLowerCase()}`, w.toLowerCase());

function generate(difficulty: Difficulty): LevelData<BoardPayload, Answer> {
  const round: Round<BoardPayload, Answer> = { id: 'sw-board', payload: { difficulty }, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: SLIDES + FINDS }, () => round) };
}

function Component({ onAnswer, onMistake }: GameComponentProps<BoardPayload, Answer>) {
  const [steps] = useState<Step[]>(() => buildSession());
  const [idx, setIdx] = useState(0);
  const [merged, setMerged] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const step = steps[idx];
  const report = useBoardProgress();
  useEffect(() => report(Math.round((idx / steps.length) * 5)), [idx, steps.length, report]);

  const done = useCallback(() => onAnswer(BOARD_DONE), [onAnswer]);
  const next = useCallback(() => {
    setPicked(null);
    setMerged(false);
    if (idx + 1 >= steps.length) done();
    else setIdx(idx + 1);
  }, [idx, steps.length, done]);

  // перевірка: слово звучить рівно раз на вході; далі — лише 🔊
  useEffect(() => {
    if (step?.kind !== 'find') return;
    const t = window.setTimeout(() => sayWord(step.word.word), 300);
    return () => window.clearTimeout(t);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!picked || step?.kind !== 'find') return;
    const ok = picked === step.word.word;
    const t = window.setTimeout(ok ? next : () => setPicked(null), ok ? 1000 : 1100);
    return () => window.clearTimeout(t);
  }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!step) return null;

  if (step.kind === 'slide') {
    const [a, b] = step.word.parts;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TaskBubble text="Натисни склади, а потім дотягни один до одного!" onSay={() => sayWord(step.word.word)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
            {merged && <PictureCard><span style={{ fontSize: 90, lineHeight: 1, animation: 'pk-pop .5s ease-out forwards' }}>{step.word.emoji}</span></PictureCard>}
            <Track
              key={idx}
              left={a}
              right={b}
              onTapLeft={() => saySyl(a)}
              onTapRight={() => saySyl(b)}
              onMerge={() => {
                sayWord(step.word.word);
                window.setTimeout(() => setMerged(true), 200);
                window.setTimeout(next, AFTER_MERGE_MS);
              }}
            />
          </div>
        </TaskBubble>
        <div style={{ height: 100 }} />
      </div>
    );
  }

  const state = !picked ? 'idle' : picked === step.word.word ? 'correct' : 'incorrect';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TaskBubble text="Знайди картинку слова, яке я скажу!" onSay={() => sayWord(step.word.word)} />
      <Balloons
        options={step.options.map((o) => ({ value: o.word, node: <span style={{ ...BIG, fontSize: 46 }}>{o.emoji}</span> }))}
        correct={step.word.word}
        disabled={!!picked}
        answerState={state}
        onPick={(v) => { if (picked) return; setPicked(v); if (v !== step.word.word) onMistake(); }}
      />
    </div>
  );
}

const syllableWords: GameDefinition<BoardPayload, Answer> = {
  id: 'syllable-words',
  title: 'Склади → слово',
  subject: 'language',
  levels: ['L0'],
  icon: '🧱',
  description: 'Дотягни склад до складу — вийде слово.',
  accent: '#FFF3C8',
  generate,
  Component,
};

export default syllableWords;
