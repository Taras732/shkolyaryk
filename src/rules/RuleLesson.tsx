import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ChoiceGrid } from '@/games/shared/ui';
import type { AnswerState, GradeBand } from '@/games/types';
import {
  advance,
  startLesson,
  buildOptions,
  tasksDone,
  totalTasks,
  summaryRules,
  createRng,
  encouragementFor,
  type Explain,
  type LessonState,
  type RuleLessonDef,
  type RuleTask,
  type RuleVisual,
} from './rule-core';

// UI движка «Правило». Уся логіка фаз — у rule-core (чисте, тестоване);
// тут лише рендер поточної фази + канон-стилі (світла тема, --c-primary).

function VisualView({ visual }: { visual: RuleVisual }) {
  if (visual.kind === 'emoji') {
    return (
      <div style={{ textAlign: 'center', margin: '14px 0' }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>{visual.emoji}</div>
        {visual.caption && (
          <div style={{ color: 'var(--c-mut)', fontWeight: 800, fontSize: 13, marginTop: 6 }}>{visual.caption}</div>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0' }}>
      {visual.steps.map((s, i) => (
        <div
          key={i}
          style={{
            background: 'var(--c-primary-soft)',
            color: 'var(--c-primary)',
            fontWeight: 800,
            fontSize: 18,
            padding: '10px 14px',
            borderRadius: 'var(--c-r-sm)',
            textAlign: 'center',
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

/**
 * Пояснення помилки. Свідомо ПЕРЕВЕРНУТО акцент (фідбек Тараса): для дитини
 * червоний докір «ось що ти зробив не так» домінує й запам'ятовується сильніше
 * за правильну відповідь. Тому:
 *  1) тепла growth-фраза зверху (помилятися — нормально);
 *  2) ГОЛОВНЕ й велике — зелене «як правильно» (correctTail / доказ / правило);
 *  3) причина помилки — дрібним НЕЙТРАЛЬНИМ підписом унизу, без хрестиків і
 *     без покрокового «ти почав з…» (його все одно не завжди прослідкувати —
 *     дитина могла тицьнути навмання).
 */
function ExplainView({ explain, encouragement, misconception }: {
  explain: Explain;
  encouragement: string;
  misconception: string | null;
}) {
  // «Як правильно» — головний зелений блок, залежно від форми пояснення.
  let howTo: React.ReactNode;
  if (explain.kind === 'consequence-replay') {
    howTo = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {explain.correctTail.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontWeight: 800, fontSize: 16, color: 'var(--c-ok-ink)' }}>
            <span style={{ flexShrink: 0 }}>✓</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    );
  } else if (explain.kind === 'visual-proof') {
    howTo = (
      <>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--c-ink)', marginBottom: 4 }}>{explain.note}</div>
        <VisualView visual={explain.visual} />
      </>
    );
  } else {
    howTo = <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--c-ink)' }}>{explain.text}</div>;
  }

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeInUp .3s ease both' }}>
      {/* тепла фраза — не докір */}
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 15, color: 'var(--c-primary)' }}>{encouragement}</div>
      {/* головне — зелене «як правильно» */}
      <div style={{ background: 'var(--c-ok-bg)', border: '1px solid var(--c-ok-line)', borderRadius: 'var(--c-r-sm)', padding: '16px 18px' }}>
        <div style={{ ...panelTitle('var(--c-ok-ink)'), fontSize: 13 }}>Ось як правильно 👇</div>
        {howTo}
      </div>
      {/* причина — дрібно, нейтрально, без червоного */}
      {misconception && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-mut)', textAlign: 'center', lineHeight: 1.4 }}>
          💡 Так виходить, якщо {misconception}.
        </div>
      )}
    </div>
  );
}

function panelTitle(color: string) {
  return { fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color, marginBottom: 8 } as const;
}

interface Props {
  def: RuleLessonDef;
  band: GradeBand;
  mastery?: number;
  seed: number;
  onExit: () => void;
  onDone: (result: { mistakes: number }) => void;
  onReplay: () => void;
}

export default function RuleLesson({ def, band, mastery = 0, seed, onExit, onDone, onReplay }: Props) {
  const [state, dispatch] = useReducer(
    (s: LessonState, ev: Parameters<typeof advance>[1]) => advance(s, ev),
    undefined,
    // Приклади будуються РАЗ, усередині машини. Читати їх у рендері треба
    // теж зі state.blocks — інакше окремий useMemo(blocks) міг би розійтися з
    // машиною, якщо seed/band зміняться після старту (напр. довантаження
    // профілю): UI показав би один приклад, а машина перевіряла б інший →
    // «правильна = помилка». Тепер джерело єдине.
    () => startLesson(def.build(band, createRng(seed)), mastery),
  );

  const { phase, blocks } = state;
  const total = totalTasks(blocks);
  const done = tasksDone(state);

  // Поточне завдання (лише у фазі apply) — з ТОГО САМОГО state.blocks, що й машина.
  const currentTask = phase.kind === 'apply' ? blocks[phase.block].tasks[phase.task] : null;

  // Короткий зелений фідбек на правильну відповідь ПЕРЕД переходом (як у GameShell):
  // без нього правильний вибір не підсвічувався й одразу стрибав далі.
  const [flash, setFlash] = useState<'correct' | null>(null);
  const flashTimer = useRef<number | null>(null);
  useEffect(() => () => { if (flashTimer.current) window.clearTimeout(flashTimer.current); }, []);

  function pickAnswer(value: string) {
    if (flash || state.explain || !currentTask) return;
    // Питаємо саму машину (probe), а не дублюємо перевірку correctness в UI:
    // так салют і рішення машини не можуть розійтися. advance чистий — не мутує стан.
    const isCorrect = advance(state, { type: 'ANSWER', value }).explain === null;
    if (isCorrect) {
      setFlash('correct');
      confetti({ particleCount: 40, spread: 42, origin: { y: 0.7 }, disableForReducedMotion: true });
      flashTimer.current = window.setTimeout(() => {
        setFlash(null);
        dispatch({ type: 'ANSWER', value });
      }, 700);
    } else {
      dispatch({ type: 'ANSWER', value });
    }
  }

  const topbar = (
    <div className="g-topbar">
      <button
        className="g-iconbtn"
        aria-label="Вийти"
        onClick={() => {
          if (window.confirm('Вийти з уроку? Прогрес не збережеться.')) onExit();
        }}
      >
        ✕
      </button>
      <div className="g-progress">
        <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <div className="g-count">{Math.min(done + 1, total)}/{total}</div>
      <div className="g-diffbadge">Правило</div>
    </div>
  );

  // ---- Summary ----
  if (phase.kind === 'summary') {
    return (
      <div className="g-screen">
        <div className="play-col">
          <div className="g-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
            <div style={{ fontSize: 64, animation: 'starPop .5s ease both' }}>🎓</div>
            <h2 className="g-title" style={{ fontSize: 22, textAlign: 'center' }}>Урок пройдено!</h2>
            <div style={{ width: '100%', maxWidth: 340 }}>
              <div style={panelTitle('var(--c-primary)')}>Ти вивчив правило:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {summaryRules(blocks).map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      background: 'var(--c-primary-soft)', color: 'var(--c-ink)',
                      fontWeight: 800, fontSize: 15, padding: '12px 14px', borderRadius: 'var(--c-r-sm)',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>📌</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
              <button className="g-btn primary" onClick={() => onDone({ mistakes: state.mistakes })}>Готово 🎉</button>
              <button className="g-btn soft" onClick={onReplay}>Пройти ще раз 🔁</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const block = blocks[phase.block];
  const changeBadge =
    phase.kind === 'rule' && phase.block > 0 && block.changeNote ? (
      <div
        style={{
          alignSelf: 'center', background: 'var(--c-gold)', color: '#7a5b00',
          fontWeight: 900, fontSize: 12, padding: '6px 14px', borderRadius: 999,
          textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8,
        }}
      >
        ✨ {block.changeNote}
      </div>
    ) : null;

  // ---- Rule ----
  if (phase.kind === 'rule') {
    return (
      <Screen topbar={topbar}>
        {changeBadge}
        <div className="g-card">
          <div className="g-question">📏 Правило</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--c-ink)', lineHeight: 1.3 }}>{block.statement.text}</div>
          {block.statement.visual && <VisualView visual={block.statement.visual} />}
        </div>
        <button className="g-btn primary" style={{ marginTop: 18 }} onClick={() => dispatch({ type: 'NEXT' })}>Далі →</button>
      </Screen>
    );
  }

  // ---- Worked example (PD2) ----
  if (phase.kind === 'worked') {
    const w = block.worked;
    return (
      <Screen topbar={topbar}>
        <div className="g-card">
          <div className="g-question">Розберемо разом</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--c-primary)', textAlign: 'center', margin: '8px 0 16px' }}>{w.prompt}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {w.steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', fontWeight: 700, fontSize: 17, lineHeight: 1.35, color: 'var(--c-ink)' }}>
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: 999, background: 'var(--c-primary)',
                  color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 22, fontWeight: 900, color: 'var(--c-ok-ink)' }}>= {w.answer}</div>
        </div>
        <button className="g-btn primary" style={{ marginTop: 18 }} onClick={() => dispatch({ type: 'NEXT' })}>Зрозуміло, спробую →</button>
      </Screen>
    );
  }

  // ---- Apply ----
  const task = block.tasks[phase.task];
  const showingExplain = state.explain !== null;
  const answerState = flash === 'correct' ? 'correct' : showingExplain ? 'incorrect' : 'idle';

  return (
    <Screen topbar={topbar}>
      {/* Правило завжди перед очима — дитина може перечитати, не виходячи із завдання. */}
      <div
        style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--c-primary-soft)', borderRadius: 'var(--c-r-sm)',
          padding: '10px 14px', marginBottom: 14, fontSize: 13.5, fontWeight: 800, color: 'var(--c-primary)',
        }}
      >
        <span style={{ flexShrink: 0 }}>📏</span>
        <span>{block.statement.text}</span>
      </div>
      <div className="g-card">
        <div className="g-question">Застосуй правило</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--c-ink)', textAlign: 'center', margin: '10px 0' }}>{task.prompt}</div>
      </div>
      <ApplyChoices
        key={`${phase.block}-${phase.task}`}
        task={task}
        seed={seed}
        correct={task.correct}
        disabled={showingExplain || flash !== null}
        answerState={answerState}
        onPick={pickAnswer}
      />
      {state.explain && (
        <>
          <ExplainView
            explain={state.explain}
            encouragement={encouragementFor(state.mistakes)}
            misconception={state.wrongMisconception}
          />
          <button className="g-btn primary" style={{ marginTop: 16 }} onClick={() => dispatch({ type: 'NEXT' })}>Спробувати ще раз →</button>
        </>
      )}
    </Screen>
  );
}

/**
 * Варіанти фази apply. Порядок обчислюється ДЕТЕРМІНОВАНО в useMemo із seed+id
 * завдання — не залежить від кількості ре-рендерів, тож не стрибає між показом
 * і кліком (корінь скарги «правильна = помилка»). key={block-task} у батька
 * перемонтовує компонент на новому завданні.
 */
function ApplyChoices({
  task,
  seed,
  correct,
  disabled,
  answerState,
  onPick,
}: {
  task: RuleTask;
  seed: number;
  correct: string;
  disabled: boolean;
  answerState: AnswerState;
  onPick: (value: string) => void;
}) {
  const options = useMemo(() => buildOptions(task, seed).map((v) => ({ value: v })), [task.id, seed]);
  return (
    <ChoiceGrid
      options={options}
      correct={correct}
      disabled={disabled}
      answerState={answerState}
      onPick={(v) => onPick(String(v))}
    />
  );
}

function Screen({ topbar, children }: { topbar: React.ReactNode; children: React.ReactNode }) {
  // Контент вирівняний ДОГОРИ (не по центру) з невеликим відступом — інакше на
  // широкому екрані картка «губилась» посередині з великою порожнечею, а текст
  // здавався дрібним. Читабельна колонка — 620px від .play-col.
  return (
    <div className="g-screen">
      <div className="play-col">
        {topbar}
        <div className="g-scroll" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 28 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
