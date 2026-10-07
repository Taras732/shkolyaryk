import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, ProfileLevel, LevelData, Round } from '../types';
import { PromptCard, ChoiceGrid } from '../shared/ui';
import { pickScenarios, createRng, type ScenarioAction } from './core';

const ROUNDS_PER_LEVEL = 5;

interface Payload {
  situation: string;
  icon: string;
  actions: ScenarioAction[];
}

/**
 * Уся випадковість — тут. difficulty банк поки не розрізняє: соціальні ситуації
 * не мають природної шкали складності в межах віку, а вигадувати її «щоб було» —
 * гірше, ніж чесно лишити. Зʼявиться разом із ширшим банком (поле tier).
 */
function generate(difficulty: Difficulty, level: ProfileLevel): LevelData<Payload, string> {
  const rng = createRng(0xbeef ^ (difficulty * 7919) ^ (level === 'L0' ? 17 : 31));
  const scenarios = pickScenarios(level, ROUNDS_PER_LEVEL, rng);
  const rounds: Round<Payload, string>[] = scenarios.map((s, i) => ({
    id: `${s.id}-${i}`,
    payload: { situation: s.situation, icon: s.icon, actions: shuffleActions(s.actions, rng) },
    answer: s.actions.find((a) => a.isBest)!.label,
  }));
  return { difficulty, rounds };
}

function shuffleActions(actions: readonly ScenarioAction[], rng: () => number): ScenarioAction[] {
  const a = actions.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Breathe-Think-Do: спершу заспокойся, потім подумай, і лише тоді дій. */
function RulesIntro({ onStart }: { onStart: () => void }) {
  const step = (n: string, title: string, text: string) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', marginBottom: 8 }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{n}</span>
      <div>
        <b style={{ fontSize: 14 }}>{title}</b>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)', lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  );
  return (
    <div className="g-card" style={{ maxWidth: 360, margin: '0 auto' }}>
      <div style={{ fontSize: 34, marginBottom: 4 }}>🫧</div>
      <h2 className="g-title" style={{ fontSize: 19, margin: '0 0 10px' }}>Що буде далі?</h2>
      {step('🫁', 'Вдихни', 'Коли непросто — спершу зроби повільний вдих і видих.')}
      {step('🤔', 'Подумай', 'Що станеться після кожного вибору? Уяви це.')}
      {step('👋', 'Зроби', 'Обери — і побачиш, що сталося далі.')}
      <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--c-mut)', lineHeight: 1.45, margin: '10px 0 14px' }}>
        Тут немає «двійок». Є вибір — і те, що після нього стається 🎯
      </p>
      <button type="button" className="g-btn primary" onClick={onStart}>
        Почати 🫧
      </button>
    </div>
  );
}

/** Наслідок ВИБОРУ дитини — подія, а не оцінка. Найкращий вибір підсвічений зеленим. */
function ConsequenceView({ action, onNext }: { action: ScenarioAction; onNext: () => void }) {
  return (
    <div style={{ animation: 'fadeInUp .3s ease both' }}>
      <div
        style={{
          background: action.isBest ? 'var(--c-ok-bg)' : 'var(--c-primary-soft)',
          border: `1px solid ${action.isBest ? 'var(--c-ok-line)' : '#DAD3FF'}`,
          borderRadius: 'var(--c-r-sm)',
          padding: '16px 18px',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }}>{action.mood}</div>
        <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--c-mut)', marginBottom: 6 }}>
          Що сталося далі
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-ink)', lineHeight: 1.45 }}>{action.consequence}</div>
      </div>
      <button className="g-btn primary" style={{ marginTop: 14 }} onClick={onNext}>
        {action.isBest ? 'Далі →' : 'Спробувати інакше →'}
      </button>
    </div>
  );
}

function Component({ round, disabled, answerState, onAnswer, onMistake }: GameComponentProps<Payload, string>) {
  const { situation, icon, actions } = round.payload;
  const [showIntro, setShowIntro] = useState(true);
  const [chosen, setChosen] = useState<ScenarioAction | null>(null);

  // новий раунд — скидаємо показаний наслідок
  useEffect(() => {
    if (answerState === 'idle') setChosen(null);
  }, [answerState]);

  if (showIntro) return <RulesIntro onStart={() => setShowIntro(false)} />;

  const pick = (label: string | number) => {
    if (disabled || chosen) return;
    setChosen(actions.find((a) => a.label === label) ?? null);
  };

  // Наслідок показує САМ компонент, тому GameShell дізнається про вибір лише
  // після «Далі». Не найкращий вибір не фарбується червоним: у вчинках немає
  // «помилки» — є наслідок, а червона рамка запам'яталась би замість уроку.
  const next = () => {
    if (!chosen) return;
    if (chosen.isBest) onAnswer(chosen.label);
    else {
      onMistake();
      setChosen(null);
    }
  };

  return (
    <>
      <PromptCard question={situation} answerState="idle">
        <div style={{ textAlign: 'center', margin: '8px auto' }}>
          <span style={{ fontSize: 56, lineHeight: 1 }}>{icon}</span>
        </div>
      </PromptCard>
      {chosen ? (
        <ConsequenceView action={chosen} onNext={next} />
      ) : (
        <ChoiceGrid
          options={actions.map((a) => ({ value: a.label }))}
          correct={round.answer}
          disabled={disabled}
          answerState="idle"
          onPick={pick}
          columns={1}
        />
      )}
    </>
  );
}

const lifeScenarios: GameDefinition<Payload, string> = {
  id: 'life-scenarios',
  title: 'Що буде далі?',
  subject: 'life',
  levels: ['L0', 'L3'],
  icon: '🫧',
  description: 'Обери вчинок — і побач, що станеться після нього.',
  accent: '#FEF3C7',
  generate,
  Component,
  // TODO(A2-життя): skills після seed skill-graph життя
};

export default lifeScenarios;
