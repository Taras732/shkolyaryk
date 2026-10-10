import { useEffect, useState } from 'react';
import type { GameDefinition, GameComponentProps, Difficulty, LevelData, Round } from '../types';
import { BOARD_DONE } from '../types';
import { PromptCard } from '../shared/ui';
import { sayUk } from '../shared/uk-audio';
import { usePreschool } from '../shared/preschool';

type Answer = typeof BOARD_DONE;

interface Payload {
  cycles: number;
}

const CYCLES = 4;
const PHASE_MS = 4000;
/** Діаметр кола у спокої та коефіцієнт росту на вдиху. */
const CIRCLE_SIZE = 130;
const INHALE_SCALE = 1.6;

function generate(difficulty: Difficulty): LevelData<Payload, Answer> {
  const round: Round<Payload, Answer> = {
    id: `board-${difficulty}`,
    payload: { cycles: CYCLES },
    answer: BOARD_DONE,
  };
  return { difficulty, rounds: [round] };
}

function Component({ round, answerState, onAnswer }: GameComponentProps<Payload, Answer>) {
  const { cycles } = round.payload;
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const preschool = usePreschool();
  // дошкільня не читає «Вдих… / Видих…» — фаза звучить (10.10)
  useEffect(() => { if (preschool) sayUk(phase === 'inhale' ? 'br_in' : 'br_out', phase === 'inhale' ? 'Вдих…' : 'Видих…'); }, [phase, preschool]);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const total = cycles * 2;
    let timerId = 0;

    setPhase('inhale');

    function tick() {
      timerId = window.setTimeout(() => {
        if (cancelled) return;
        i += 1;
        if (i >= total) {
          onAnswer(BOARD_DONE);
          return;
        }
        setPhase(i % 2 === 0 ? 'inhale' : 'exhale');
        tick();
      }, PHASE_MS);
    }

    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [cycles, onAnswer]);

  return (
    <PromptCard question="Дихаємо разом" answerState={answerState}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '18px 0' }}>
        {/* Резервуємо місце під коло на вдиху (scale), інакше воно налазить на підпис. */}
        <div
          style={{
            height: CIRCLE_SIZE * INHALE_SCALE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--c-primary), var(--c-blue))',
              boxShadow: 'var(--c-shadow)',
              transform: `scale(${phase === 'inhale' ? INHALE_SCALE : 1})`,
              transition: `transform ${PHASE_MS}ms ease-in-out`,
            }}
          />
        </div>
        <div style={{ fontFamily: 'var(--font-round)', fontWeight: 800, fontSize: 22, color: 'var(--c-mut)' }}>
          {phase === 'inhale' ? 'Вдих…' : 'Видих…'}
        </div>
      </div>
    </PromptCard>
  );
}

const breathing: GameDefinition<Payload, Answer> = {
  id: 'breathing',
  title: 'Дихання',
  subject: 'life',
  levels: ['L0', 'L3'],
  icon: '🌬️',
  description: 'Дихальна вправа.',
  accent: '#CFFAFE',
  generate,
  Component,
  // TODO(A2-життя): skills після seed skill-graph життя
};

export default breathing;
