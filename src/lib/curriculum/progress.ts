/**
 * Curriculum Progress Utilities
 * Calculates curriculum day from profile and provides progress helpers.
 */

import { UserProfile } from "@/lib/questions/types";
import { getCurriculumDay, PHASES, Phase, CurriculumDay } from "./map";

export const CURRICULUM_TOTAL_DAYS = 200;

/**
 * Determines which curriculum day a user is on.
 * Based on completedSessions (not calendar days) so missed days don't skip content.
 */
export function calculateCurriculumDay(profile: UserProfile): number {
  if (profile.curriculumDayOverride != null) return Math.max(1, Math.min(CURRICULUM_TOTAL_DAYS, profile.curriculumDayOverride));
  const completed = profile.completedSessions ?? 0;
  return Math.max(1, Math.min(CURRICULUM_TOTAL_DAYS, completed + 1));
}

/** Returns overall progress (0–100) across the 200-day curriculum */
export function getCurriculumProgressPercent(profile: UserProfile): number {
  return Math.round((Math.max(0, Math.min(CURRICULUM_TOTAL_DAYS, profile.completedSessions ?? 0)) / CURRICULUM_TOTAL_DAYS) * 100);
}

/** Returns the current CurriculumDay for a profile */
export function getCurrentCurriculumDay(profile: UserProfile): CurriculumDay {
  const day = calculateCurriculumDay(profile);
  return getCurriculumDay(day);
}

/** Returns the current phase for a profile */
export function getCurrentPhase(profile: UserProfile): Phase {
  const curr = getCurrentCurriculumDay(profile);
  return PHASES.find((p) => p.id === curr.phase) || PHASES[0];
}

/** How many days remain in the current phase */
export function getDaysRemainingInPhase(profile: UserProfile): number {
  const curr = getCurrentCurriculumDay(profile);
  const phase = PHASES.find((p) => p.id === curr.phase);
  if (!phase) return 0;
  return Math.max(0, phase.endDay - curr.day);
}

/** Returns progress within the current phase (0–100) */
export function getPhaseProgressPercent(profile: UserProfile): number {
  const curr = getCurrentCurriculumDay(profile);
  const phase = PHASES.find((p) => p.id === curr.phase);
  if (!phase) return 100;
  const phaseLength = phase.endDay - phase.startDay + 1;
  const dayInPhase = curr.day - phase.startDay + 1;
  return Math.min(100, Math.round((dayInPhase / phaseLength) * 100));
}

/** Returns a human-readable summary for the dashboard */
export function getCurriculumSummary(profile: UserProfile): {
  day: number;
  totalDays: number;
  phaseName: string;
  phaseColor: string;
  phaseNum: number;
  dayTheme: string;
  overallPercent: number;
  phasePercent: number;
  daysRemainingInPhase: number;
} {
  const curr = getCurrentCurriculumDay(profile);
  return {
    day: curr.day,
    totalDays: CURRICULUM_TOTAL_DAYS,
    phaseName: curr.phaseName,
    phaseColor: curr.phaseColor,
    phaseNum: curr.phase,
    dayTheme: curr.dayTheme,
    overallPercent: getCurriculumProgressPercent(profile),
    phasePercent: getPhaseProgressPercent(profile),
    daysRemainingInPhase: getDaysRemainingInPhase(profile),
  };
}
