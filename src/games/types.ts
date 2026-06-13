import type { ComponentType } from 'react';
import type { AgeGroupId } from '../constants/ageGroups';

export type Phase =
  | 'intro'
  | 'playing'
  | 'feedback-correct'
  | 'feedback-wrong'
  | 'finished';

export interface Task<TAnswer = unknown> {
  id: string;
  payload: unknown;
  expected?: TAnswer;
  timeLimitSec?: number;
}

export interface LevelSpec<TAnswer = unknown> {
  seed: string;
  difficulty: number;
  tasks: Task<TAnswer>[];
}

export interface ValidationResult {
  correct: boolean;
  // Optional human-readable labels for the mistake-review overlay shown on a
  // wrong answer: what the child picked vs. what was correct. Lets the child
  // understand the mistake instead of just being told "wrong". Games fill
  // these where it's meaningful; when absent the overlay just pauses.
  chosenLabel?: string;
  correctLabel?: string;
}

export interface RendererProps<TAnswer = unknown> {
  task: Task<TAnswer>;
  onAnswer: (answer: TAnswer) => void;
  disabled?: boolean;
}

export interface LevelLabel {
  emoji: string;
  labelKey: string;
}

export interface GameDefinition<TLevelSpec extends LevelSpec<any> = LevelSpec<any>, TAnswer = any> {
  id: string;
  islandId: string;
  name: string;
  icon?: string;
  rulesKey?: string;
  hasDifficulty?: boolean;
  availableFor?: AgeGroupId[];
  levelLabels?: Record<1 | 2 | 3, LevelLabel>;
  generateLevel: (difficulty: number, ageGroupId?: AgeGroupId) => TLevelSpec;
  validateAnswer: (task: Task<TAnswer>, answer: TAnswer) => ValidationResult;
  Renderer: ComponentType<RendererProps<TAnswer>>;
}

export interface SessionState<TAnswer = unknown> {
  sessionId: string;
  gameId: string;
  phase: Phase;
  levelSpec: LevelSpec<TAnswer>;
  taskIndex: number;
  mistakes: number;
  stars: 0 | 1 | 2 | 3;
  xpEarned: number;
}

export function computeStars(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export function computeXp(stars: 1 | 2 | 3): number {
  if (stars === 3) return 12;
  if (stars === 2) return 8;
  return 5;
}
