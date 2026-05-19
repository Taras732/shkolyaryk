import type { GameDefinition, LevelSpec, Task } from '../types';
import { Renderer, type DotAnswer, type DotPayload } from './Renderer';

const TASKS_PER_LEVEL = 5;
const HIT_TOLERANCE = 20;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function paramsFor(difficulty: number): { radius: number; speed: number } {
  if (difficulty <= 1) return { radius: 55, speed: 90 };
  if (difficulty === 2) return { radius: 35, speed: 90 };
  return { radius: 35, speed: 220 };
}

function generateLevel(difficulty: number): LevelSpec<DotAnswer> {
  const { radius, speed } = paramsFor(difficulty);
  const tasks: Task<DotAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    const payload: DotPayload = {
      startXFrac: rand(0.25, 0.75),
      startYFrac: rand(0.25, 0.75),
      angleRad: rand(0, Math.PI * 2),
      radius,
      speed,
    };
    tasks.push({ id: `t${i}`, payload });
  }
  return {
    seed: `tap-the-dot-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const tapTheDot: GameDefinition<LevelSpec<DotAnswer>, DotAnswer> = {
  id: 'tap-the-dot',
  islandId: 'logic',
  name: 'game.tapTheDot.name',
  icon: '🎯',
  rulesKey: 'game.tapTheDot.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const dist = Math.hypot(answer.tapX - answer.dotX, answer.tapY - answer.dotY);
    return { correct: dist <= answer.radius + HIT_TOLERANCE };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default tapTheDot;
