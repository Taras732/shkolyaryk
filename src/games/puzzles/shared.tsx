import { useEffect, type ReactNode } from 'react';
import type { Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';

/**
 * Спільне для ігор-головоломок: одне поле на рівень, гра сама вирішує, коли
 * розв'язано. «Помилок» тут майже немає — це пошук способу, а не тест;
 * помилкою рахується лише явна хибна перевірка («Готово», а не порівну).
 */
export type Answer = typeof BOARD_DONE;

export function boardLevel<P>(difficulty: Difficulty, payload: P, id = 'board', rounds = 1): LevelData<P, Answer> {
  const round: Round<P, Answer> = { id, payload, answer: BOARD_DONE };
  return { difficulty, rounds: Array.from({ length: rounds }, () => round) };
}

/** Коли задачу розв'язано — коротка пауза на радість, потім фініш. */
export function useFinish(done: boolean, onAnswer: (a: Answer) => void, delay = 1400) {
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => onAnswer(BOARD_DONE), delay);
    return () => window.clearTimeout(t);
  }, [done, onAnswer, delay]);
}

export function Task({ text, sub, done, doneText }: { text: ReactNode; sub?: ReactNode; done?: boolean; doneText?: string }) {
  return (
    <div className="g-card" style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 900, color: done ? 'var(--c-ok-ink)' : 'var(--c-ink)' }}>{done ? doneText ?? 'Готово! 🎉' : text}</div>
      {sub && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-mut)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export const pickOne = <T,>(arr: readonly T[], rng: () => number = Math.random): T => arr[Math.floor(rng() * arr.length)];

export function shuffleWith<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
