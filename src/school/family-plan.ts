import type { ClassLevel } from '@/games/types';
import { AFTER_SCHOOL_PLAN } from './after-school';

/**
 * План «Після школи», налаштований батьками під конкретну дитину.
 * Без налаштування — типовий план класу. Локально, як і решта прогресу.
 */
export interface FamilyPlan {
  /** auto — розумний план щодня; manual — кроки, обрані батьками. */
  mode: 'auto' | 'manual';
  steps: string[];
  /** Таблиця множення, яку тренуємо зараз (null — гра сама радить першу невивчену). */
  ttTable: number | null;
}

export const MAX_STEPS = 5;

const keyFor = (profileId: string) => `shk.plan.v1.${profileId}`;

export function defaultPlan(cl: ClassLevel): FamilyPlan {
  return { mode: 'auto', steps: [...AFTER_SCHOOL_PLAN[cl]], ttTable: null };
}

export function loadPlan(profileId: string, cl: ClassLevel): FamilyPlan {
  try {
    const raw = localStorage.getItem(keyFor(profileId));
    if (!raw) return defaultPlan(cl);
    const p = JSON.parse(raw) as Partial<FamilyPlan>;
    const steps = Array.isArray(p.steps) && p.steps.length > 0 ? p.steps.slice(0, MAX_STEPS) : defaultPlan(cl).steps;
    // план, збережений до появи розумного режиму, — це вибір батьків: лишаємо ручним
    const mode = p.mode === 'auto' || p.mode === 'manual' ? p.mode : 'manual';
    return { mode, steps, ttTable: typeof p.ttTable === 'number' ? p.ttTable : null };
  } catch {
    return defaultPlan(cl);
  }
}

/** Лише таблиця множення з плану — для самої гри (без класу і реєстру ігор, щоб не було циклу імпортів). */
export function loadParentTable(profileId: string): number | null {
  try {
    const p = JSON.parse(localStorage.getItem(keyFor(profileId)) ?? '{}') as Partial<FamilyPlan>;
    return typeof p.ttTable === 'number' ? p.ttTable : null;
  } catch {
    return null;
  }
}

export function savePlan(profileId: string, plan: FamilyPlan): void {
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(plan));
  } catch {
    // без пам'яті — лишиться типовий план
  }
}

export function moveStep(steps: string[], i: number, dir: -1 | 1): string[] {
  const j = i + dir;
  if (j < 0 || j >= steps.length) return steps;
  const out = [...steps];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
