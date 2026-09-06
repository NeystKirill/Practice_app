import type { Grade } from "./types";

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;
const DAY_MS = 86_400_000;
const LAPSE_DELAY_MS = 10 * 60_000;

export interface SrsState {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

export interface SrsOutcome extends SrsState {
  dueAt: number;
}

export function initialSrsState(): SrsState {
  return {
    repetitions: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    intervalDays: 0,
  };
}

export function applyReview(
  state: SrsState,
  grade: Grade,
  now: number = Date.now(),
): SrsOutcome {
  const q = grade;

  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  if (q < 3) {
    return {
      repetitions: 0,
      easeFactor,
      intervalDays: 0,
      dueAt: now + LAPSE_DELAY_MS,
    };
  }

  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) {
    intervalDays = 1;
  } else if (repetitions === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(state.intervalDays * easeFactor);
  }

  return {
    repetitions,
    easeFactor,
    intervalDays,
    dueAt: now + intervalDays * DAY_MS,
  };
}

export function isLearned(intervalDays: number): boolean {
  return intervalDays >= 21;
}
