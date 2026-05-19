import type { GameDefinition, LevelSpec, Task } from '../types';
import type { AgeGroupId } from '../../constants/ageGroups';
import {
  Renderer,
  type StageId,
  type PlantGrowAnswer,
  type PlantGrowPayload,
} from './Renderer';

// Ordered growth sequence
const STAGES: StageId[] = ['seed', 'sprout', 'sapling', 'flower', 'fruit'];

const TASKS_PER_LEVEL = 5;

// Emoji pool per stage — multiple visual variants keep it fresh
const STAGE_EMOJIS: Record<StageId, string[]> = {
  seed: ['🌰', '🫘', '🌾'],
  sprout: ['🌱', '🪴'],
  sapling: ['🌿', '🍃'],
  flower: ['🌸', '🌼', '🌻'],
  fruit: ['🍎', '🍇', '🍊'],
};

function pickEmoji(stage: StageId, taskIndex: number): string {
  const pool = STAGE_EMOJIS[stage];
  return pool[taskIndex % pool.length];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LevelConfig {
  stagePool: StageId[];
  choiceCount: number;
  timeLimitSec?: number;
}

function timerFor(group: AgeGroupId): number {
  switch (group) {
    case 'preschool':
      return 14;
    case 'grade1':
      return 12;
    case 'grade2':
      return 10;
    case 'grade3':
      return 8;
    case 'grade4':
      return 6;
    default:
      return 10;
  }
}

function configFor(difficulty: number, ageGroupId: AgeGroupId | undefined): LevelConfig {
  const group = ageGroupId ?? 'grade1';
  const isOlder = group === 'grade3' || group === 'grade4';

  if (difficulty <= 1) {
    // Easy: seed / sprout / fruit — 3 choices
    return { stagePool: ['seed', 'sprout', 'fruit'], choiceCount: 3 };
  }
  if (difficulty === 2) {
    // Medium: all 5 stages — 4 choices (exclude 1 distractor)
    return {
      stagePool: STAGES,
      choiceCount: isOlder ? 5 : 4,
    };
  }
  // Hard: all 5 + timer
  return {
    stagePool: STAGES,
    choiceCount: 5,
    timeLimitSec: timerFor(group),
  };
}

function makeChoices(target: StageId, pool: StageId[], count: number): StageId[] {
  const others = shuffle(pool.filter((s) => s !== target)).slice(0, count - 1);
  return shuffle([target, ...others]);
}

function generateLevel(difficulty: number, ageGroupId?: AgeGroupId): LevelSpec<PlantGrowAnswer> {
  const cfg = configFor(difficulty, ageGroupId);
  const targets = shuffle(cfg.stagePool).slice(0, TASKS_PER_LEVEL);

  const tasks: Task<PlantGrowAnswer>[] = targets.map((stage, index) => {
    const choices = makeChoices(stage, cfg.stagePool.length >= cfg.choiceCount ? cfg.stagePool : STAGES, cfg.choiceCount);
    const payload: PlantGrowPayload = {
      targetStage: stage,
      emoji: pickEmoji(stage, index),
      choices,
    };
    return { id: `t${index}`, payload, timeLimitSec: cfg.timeLimitSec };
  });

  return { seed: `plant-grow-${Date.now()}`, difficulty, tasks };
}

const plantGrow: GameDefinition<LevelSpec<PlantGrowAnswer>, PlantGrowAnswer> = {
  id: 'plant-grow',
  islandId: 'science',
  name: 'game.plantGrow.name',
  icon: '🌱',
  rulesKey: 'game.plantGrow.rules',
  generateLevel,
  validateAnswer(task, answer) {
    const p = task.payload as PlantGrowPayload;
    return { correct: answer === p.targetStage };
  },
  Renderer,
};

export default plantGrow;
