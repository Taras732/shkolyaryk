import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { AnswerState } from '../types';
import { Balloons, TaskBubble, usePreschool } from './preschool';

/** Картка-завдання (canon): питання зверху + візуальний вміст. */
export function PromptCard({
  question,
  answerState,
  children,
  say,
  sayKey,
}: {
  question: string;
  answerState: AnswerState;
  children?: ReactNode;
  /** Озвучити ціль. Є — у картці велика кнопка 🔊, і ціль звучить сама на старті раунду.
   *  again=true — повтор з кнопки (можна озвучити лише ціль, без фрази). */
  say?: (again?: boolean) => void;
  /** Зміна ключа = новий раунд = звучить знову. */
  sayKey?: string | number;
}) {
  const preschool = usePreschool();
  useEffect(() => {
    say?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sayKey]);
  if (preschool) {
    return <TaskBubble text={question} onSay={say ? () => say(true) : undefined}>{children}</TaskBubble>;
  }
  return (
    <div className={`g-card${answerState === 'incorrect' ? ' shake' : ''}`} style={{ marginBottom: 18 }}>
      <div className="g-question">{question}</div>
      {say && <SayButton onClick={() => say(true)} />}
      {children}
    </div>
  );
}

/** Велика кругла 🔊 — дитина, що не читає, тисне й чує завдання ще раз. */
export function SayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Послухати ще раз"
      style={{ display: 'block', margin: '8px auto', width: 120, height: 120, borderRadius: '50%', border: 0, background: 'var(--c-primary-soft)', fontSize: 56, cursor: 'pointer' }}
    >
      🔊
    </button>
  );
}

export interface Choice<T extends string | number = string | number> {
  value: T;
  /** Що показати на кнопці (за замовчуванням — value). */
  node?: ReactNode;
}

/**
 * Довжина тексту варіанта — щоб зменшити шрифт для довгих слів («Прикметник»).
 * Складний ReactNode має власні стилі — його не міряємо.
 */
function choiceTextLength<T extends string | number>(opt: Choice<T>): number {
  if (opt.node === undefined || typeof opt.node === 'string' || typeof opt.node === 'number') {
    return String(opt.node ?? opt.value).length;
  }
  return 0;
}

/**
 * Сітка варіантів відповіді. Сама підсвічує правильний/неправильний вибір
 * за answerState та correct. Скидає вибір, коли answerState повертається в idle.
 */
export function ChoiceGrid<T extends string | number>({
  options,
  correct,
  disabled,
  answerState,
  onPick,
  columns,
}: {
  options: Choice<T>[];
  correct: T;
  disabled: boolean;
  answerState: AnswerState;
  onPick: (value: T) => void;
  columns?: number;
}) {
  const preschool = usePreschool();
  const [selected, setSelected] = useState<T | null>(null);

  useEffect(() => {
    if (answerState === 'idle') setSelected(null);
  }, [answerState]);

  if (preschool) return <Balloons options={options} correct={correct} disabled={disabled} answerState={answerState} onPick={onPick} />;

  const cols = columns ?? (options.length === 3 ? 3 : 2);
  // довгі текстові варіанти не влазять у базові 22px на вузьких екранах
  const longText = options.reduce((m, o) => Math.max(m, choiceTextLength(o)), 0) > 7;

  return (
    <div
      className={`g-choices${longText ? ' g-choices--long' : ''}`}
      // кількість колонок — через CSS-змінну, щоб медіазапит міг обмежити її
      // до 2 на вузькому екрані (інлайн-стиль медіазапитом не перекриєш)
      style={{ '--g-cols': cols } as CSSProperties}
    >
      {options.map((opt, i) => {
        let cls = 'g-choice';
        const isSel = selected === opt.value;
        // правильний варіант, який дитина НЕ обрала → це підказка, не її вибір
        const reveal = answerState === 'incorrect' && opt.value === correct && !isSel;
        if (isSel && answerState === 'correct') cls += ' correct';
        else if (isSel && answerState === 'incorrect') cls += ' wrong';
        else if (reveal) cls += ' reveal';
        return (
          <button
            key={i}
            type="button"
            className={cls}
            disabled={disabled}
            onClick={(e) => {
              if (disabled) return;
              // раунд не перемонтовується при помилці → :focus/:hover залипає
              // на натиснутій кнопці і читається дитиною як підказка
              e.currentTarget.blur();
              setSelected(opt.value);
              onPick(opt.value);
            }}
          >
            {opt.node ?? opt.value}
            {reveal && <span className="g-choice-tag">Правильна відповідь</span>}
          </button>
        );
      })}
    </div>
  );
}

// --- дрібні утиліти генерації, спільні для ігор ---
export function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Побудувати варіанти-обманки навколо правильної числової відповіді. */
export function numberDecoys(correct: number, count: number, spread: number, min = 0): number[] {
  const pool = new Set<number>([correct]);
  let guard = 0;
  while (pool.size < count && guard < 200) {
    const off = (Math.random() > 0.5 ? 1 : -1) * randInt(1, spread);
    const d = correct + off;
    if (d >= min && d !== correct) pool.add(d);
    guard++;
  }
  // добити послідовними, якщо не вистачило
  let f = Math.max(min, correct - spread);
  while (pool.size < count) {
    if (f !== correct && f >= min) pool.add(f);
    f++;
  }
  return shuffle(Array.from(pool));
}
