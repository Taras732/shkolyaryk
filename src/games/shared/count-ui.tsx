import { useEffect, type ReactNode } from 'react';
import { TaskBubble } from './preschool';

/**
 * Предмети для лічби (Лічильна Гора, 10.10.2026): рядами по 5, як у «десятці» —
 * око схоплює «повний ряд + ще трохи», а не розсип, який доводиться перераховувати.
 */
export function Objects({ n, emoji, size = 44 }: { n: number; emoji: string; size?: number }) {
  const rows: number[] = [];
  for (let left = n; left > 0; left -= 5) rows.push(Math.min(5, left));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(size * 0.18), alignItems: 'flex-start' }}>
      {rows.map((c, r) => (
        <div key={r} style={{ display: 'flex', gap: Math.round(size * 0.14) }}>
          {Array.from({ length: c }).map((_, k) => (
            <span key={k} style={{ fontSize: size, lineHeight: 1, width: size * 1.1, textAlign: 'center' }}>
              {emoji}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Розмір предмета під кількість: що більше предметів, то менші, щоб вліз ряд з 5. */
export const objSize = (n: number) => (n <= 3 ? 66 : n <= 5 ? 50 : n <= 10 ? 38 : 30);

/** Як PromptCard у дошкільній рамці, але вміст лежить прямо в сцені — без білої картки навколо. */
export function SceneTask({ question, say, sayKey, children }: { question: string; say: (again?: boolean) => void; sayKey: string; children: ReactNode }) {
  useEffect(() => {
    say(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayKey]);
  return <TaskBubble text={question} onSay={() => say(true)}>{children}</TaskBubble>;
}
