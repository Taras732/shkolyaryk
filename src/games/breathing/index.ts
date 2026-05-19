import type { GameDefinition, LevelSpec, Task } from '../types';
import {
  Renderer,
  type BreathingAnswer,
  type BreathingPayload,
} from './Renderer';

const TASKS_PER_LEVEL = 5;

function generateLevel(difficulty: number): LevelSpec<BreathingAnswer> {
  const tasks: Task<BreathingAnswer>[] = [];
  for (let i = 0; i < TASKS_PER_LEVEL; i++) {
    const payload: BreathingPayload = {
      breathNum: i + 1,
      total: TASKS_PER_LEVEL,
    };
    tasks.push({ id: `t${i}`, payload });
  }
  return {
    seed: `breathing-${Date.now()}`,
    difficulty,
    tasks,
  };
}

const breathing: GameDefinition<LevelSpec<BreathingAnswer>, BreathingAnswer> = {
  id: 'breathing',
  islandId: 'emotions',
  name: 'game.breathing.name',
  icon: '🎈',
  rulesKey: 'game.breathing.rules',
  hasDifficulty: false,
  availableFor: ['preschool', 'grade1', 'grade2', 'grade3', 'grade4'],
  generateLevel,
  validateAnswer() {
    return { correct: true };
  },
  gradeFit: { kindergarten: true, grade1: true, grade2: true, grade3: true, grade4: true },
  Renderer,
};

export default breathing;
