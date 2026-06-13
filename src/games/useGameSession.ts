import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getGame } from './registry';
import type { AgeGroupId } from '../constants/ageGroups';
import {
  computeStars,
  computeXp,
  type LevelSpec,
  type Phase,
  type SessionState,
  type Task,
} from './types';

const FEEDBACK_CORRECT_MS = 1000;

function makeSessionId(): string {
  try {
    const g: any = globalThis as any;
    if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  } catch {}
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type Action =
  | { type: 'START' }
  | { type: 'SUBMIT_CORRECT' }
  | { type: 'SUBMIT_WRONG' }
  | { type: 'FEEDBACK_DONE' }
  | { type: 'RESET'; levelSpec: LevelSpec<any>; sessionId: string };

function reducer(state: SessionState<any>, action: Action): SessionState<any> {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'intro') return state;
      return { ...state, phase: 'playing' };

    case 'SUBMIT_CORRECT':
      if (state.phase !== 'playing') return state;
      return { ...state, phase: 'feedback-correct' };

    case 'SUBMIT_WRONG':
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        phase: 'feedback-wrong',
        mistakes: state.mistakes + 1,
      };

    case 'FEEDBACK_DONE': {
      if (state.phase !== 'feedback-correct' && state.phase !== 'feedback-wrong') {
        return state;
      }
      const nextIndex = state.taskIndex + 1;
      if (nextIndex >= state.levelSpec.tasks.length) {
        const stars = computeStars(state.mistakes);
        return {
          ...state,
          phase: 'finished',
          taskIndex: nextIndex,
          stars,
          xpEarned: computeXp(stars),
        };
      }
      return { ...state, phase: 'playing', taskIndex: nextIndex };
    }

    case 'RESET':
      return {
        sessionId: action.sessionId,
        gameId: state.gameId,
        phase: 'intro',
        levelSpec: action.levelSpec,
        taskIndex: 0,
        mistakes: 0,
        stars: 0,
        xpEarned: 0,
      };

    default:
      return state;
  }
}

export interface MistakeReview {
  chosenLabel?: string;
  correctLabel?: string;
}

export interface UseGameSessionResult<TAnswer = unknown> {
  sessionId: string;
  phase: Phase;
  currentTask: Task<TAnswer> | null;
  taskIndex: number;
  totalTasks: number;
  mistakes: number;
  stars: 0 | 1 | 2 | 3;
  xpEarned: number;
  taskStartedAt: number | null;
  /** Set when the last answer was wrong — drives the mistake-review overlay. */
  review: MistakeReview | null;
  start: () => void;
  submit: (answer: TAnswer) => void;
  /** Dismiss the wrong-answer overlay and advance (child taps "Next"). */
  dismissFeedback: () => void;
  reset: () => void;
}

export function useGameSession<TAnswer = unknown>(
  gameId: string,
  difficulty: number = 1.0,
  ageGroupId?: AgeGroupId,
): UseGameSessionResult<TAnswer> {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game not registered: ${gameId}`);
  }

  const initial = useMemo<SessionState<TAnswer>>(() => {
    const levelSpec = game.generateLevel(difficulty, ageGroupId) as LevelSpec<TAnswer>;
    return {
      sessionId: makeSessionId(),
      gameId,
      phase: 'intro',
      levelSpec,
      taskIndex: 0,
      mistakes: 0,
      stars: 0,
      xpEarned: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const [state, dispatch] = useReducer(reducer, initial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [taskStartedAt, setTaskStartedAt] = useState<number | null>(null);
  const [review, setReview] = useState<MistakeReview | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Correct answers auto-advance (keep the positive loop fast). Wrong
    // answers wait for the child to tap "Next" — giving them time to see
    // their choice vs. the correct one and actually learn from the mistake.
    if (state.phase === 'feedback-correct') {
      timerRef.current = setTimeout(
        () => dispatch({ type: 'FEEDBACK_DONE' }),
        FEEDBACK_CORRECT_MS
      );
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.phase]);

  useEffect(() => {
    if (taskTimerRef.current) {
      clearTimeout(taskTimerRef.current);
      taskTimerRef.current = null;
    }
    if (state.phase !== 'playing') {
      setTaskStartedAt(null);
      return;
    }
    const task = state.levelSpec.tasks[state.taskIndex] as Task<TAnswer> | undefined;
    const limit = task?.timeLimitSec;
    if (!task || !limit || limit <= 0) {
      setTaskStartedAt(null);
      return;
    }
    setTaskStartedAt(Date.now());
    taskTimerRef.current = setTimeout(() => {
      // Ran out of time — no choice to review, just mark wrong.
      setReview(null);
      dispatch({ type: 'SUBMIT_WRONG' });
    }, limit * 1000);
    return () => {
      if (taskTimerRef.current) {
        clearTimeout(taskTimerRef.current);
        taskTimerRef.current = null;
      }
    };
  }, [state.phase, state.taskIndex, state.levelSpec, setTaskStartedAt]);

  const start = useCallback(() => dispatch({ type: 'START' }), []);

  const submit = useCallback(
    (answer: TAnswer) => {
      if (state.phase !== 'playing') return;
      const task = state.levelSpec.tasks[state.taskIndex] as Task<TAnswer>;
      if (!task) return;
      const result = game.validateAnswer(task, answer);
      if (result.correct) {
        setReview(null);
        dispatch({ type: 'SUBMIT_CORRECT' });
      } else {
        setReview({ chosenLabel: result.chosenLabel, correctLabel: result.correctLabel });
        dispatch({ type: 'SUBMIT_WRONG' });
      }
    },
    [game, state.phase, state.taskIndex, state.levelSpec]
  );

  const dismissFeedback = useCallback(() => dispatch({ type: 'FEEDBACK_DONE' }), []);

  const reset = useCallback(() => {
    const levelSpec = game.generateLevel(difficulty, ageGroupId) as LevelSpec<TAnswer>;
    setReview(null);
    dispatch({
      type: 'RESET',
      levelSpec,
      sessionId: makeSessionId(),
    });
  }, [game, difficulty, ageGroupId]);

  const currentTask =
    state.phase === 'finished'
      ? null
      : ((state.levelSpec.tasks[state.taskIndex] ?? null) as Task<TAnswer> | null);

  return {
    sessionId: state.sessionId,
    phase: state.phase,
    currentTask,
    taskIndex: state.taskIndex,
    totalTasks: state.levelSpec.tasks.length,
    mistakes: state.mistakes,
    stars: state.stars,
    xpEarned: state.xpEarned,
    taskStartedAt,
    review,
    start,
    submit,
    dismissFeedback,
    reset,
  };
}
