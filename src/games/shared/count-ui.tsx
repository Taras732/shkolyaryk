import { useEffect, type ReactNode } from 'react';
import { TaskBubble } from './preschool';

/** Намальовані предмети для лічби (public/count/*.webp, прозоре тло; згенеровано 10.10.2026). */
export const COUNT_ITEMS = ['apple', 'strawberry', 'carrot', 'mushroom', 'acorn', 'pear', 'orange', 'cookie', 'candy', 'flower'] as const;
export type CountItem = (typeof COUNT_ITEMS)[number];
/** Стабільний вибір предмета для раунду (не тасується при ре-рендері). */
export const itemFor = (seed: number): CountItem => COUNT_ITEMS[Math.abs(seed) % COUNT_ITEMS.length];

/**
 * Предмети для лічби (Лічильна Гора, 10.10.2026): рядами по 5, як у «десятці» —
 * око схоплює «повний ряд + ще трохи», а не розсип, який доводиться перераховувати.
 * `img` — намальований предмет; без нього — емодзі (шкільний режим).
 */
export function Objects({ n, emoji, img, size = 44 }: { n: number; emoji?: string; img?: CountItem; size?: number }) {
  const rows: number[] = [];
  for (let left = n; left > 0; left -= 5) rows.push(Math.min(5, left));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(size * 0.16), alignItems: 'flex-start' }}>
      {rows.map((c, r) => (
        <div key={r} style={{ display: 'flex', gap: Math.round(size * 0.12) }}>
          {Array.from({ length: c }).map((_, k) =>
            img ? (
              <img key={k} src={`/count/${img}.webp`} alt="" draggable={false}
                style={{ width: size, height: size, objectFit: 'contain', filter: 'drop-shadow(0 2px 1px rgba(120,80,30,.18))' }} />
            ) : (
              <span key={k} style={{ fontSize: size, lineHeight: 1, width: size * 1.1, textAlign: 'center' }}>
                {emoji}
              </span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/** Розмір предмета під кількість: що більше предметів, то менші, щоб вліз ряд з 5. */
export const objSize = (n: number) => (n <= 3 ? 70 : n <= 5 ? 52 : n <= 10 ? 40 : 32);

/** Як PromptCard у дошкільній рамці, але вміст лежить прямо в сцені — без білої картки навколо. */
export function SceneTask({ question, say, sayKey, children, sceneBg, peek }: { question: string; say: (again?: boolean) => void; sayKey: string; children: ReactNode; sceneBg?: string; peek?: boolean }) {
  useEffect(() => {
    say(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayKey]);
  return <TaskBubble text={question} onSay={() => say(true)} sceneBg={sceneBg} peek={peek}>{children}</TaskBubble>;
}
