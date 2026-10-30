import { addDays } from "./dates";
import type { Grade, Srs } from "./types";

const START_EASE = 2.5;
const MIN_EASE = 1.3;
const EASE_STEP: Record<Grade, number> = { again: -0.2, hard: -0.15, easy: 0.1 };

export const LEARNED_DAYS = 21;

export const nextInterval = (srs: Srs | undefined, grade: Grade): number => {
  if (grade === "again") return 1;
  const reps = srs?.reps ?? 0;
  const prev = srs?.interval ?? 0;
  const ease = srs?.ease ?? START_EASE;
  if (reps === 0) return grade === "easy" ? 3 : 1;
  if (reps === 1) return grade === "easy" ? 6 : 3;
  if (grade === "hard") return Math.max(prev + 1, Math.round(prev * 1.2));
  return Math.max(prev + 1, Math.round(prev * ease));
};

export const schedule = (srs: Srs | undefined, grade: Grade, today: string): Srs => {
  const interval = nextInterval(srs, grade);
  const ease = Math.max(MIN_EASE, +((srs?.ease ?? START_EASE) + EASE_STEP[grade]).toFixed(2));
  return {
    due: addDays(today, interval),
    interval,
    ease,
    reps: grade === "again" ? 0 : (srs?.reps ?? 0) + 1,
    lapses: (srs?.lapses ?? 0) + (grade === "again" ? 1 : 0),
    last: today,
  };
};

export type CardState = "new" | "learning" | "learned";

export const stateOf = (srs: Srs | undefined): CardState =>
  !srs ? "new" : srs.interval >= LEARNED_DAYS ? "learned" : "learning";
