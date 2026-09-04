import { ALL_BADGES, BadgeDefinition } from "@/data/badges/badgeList";
import { Attempt, UserProfile, DailySession } from "@/lib/questions/types";

export function checkNewUnlockedBadges(
  profile: UserProfile,
  completedSession?: DailySession,
  attempts: Attempt[] = []
): BadgeDefinition[] {
  const currentUnlocked = new Set(profile.badgesUnlocked || []);
  const newlyUnlocked: BadgeDefinition[] = [];
  const correctAttempts = attempts.filter((attempt) => attempt.correct);
  const mentalCorrect = correctAttempts.filter((attempt) => attempt.skill.startsWith("mental.")).length;
  const fastCorrect = correctAttempts.filter((attempt) => attempt.responseTimeMs <= 10_000).length;
  const multiplicationAttempts = attempts.filter((attempt) =>
    attempt.skill.includes("multiplication") || attempt.skill.includes("table.")
  ).length;
  const problemCorrect = correctAttempts.filter((attempt) => attempt.category === "problems").length;
  const divisionCorrect = correctAttempts.filter((attempt) => attempt.skill.includes("division")).length;

  for (const badge of ALL_BADGES) {
    if (currentUnlocked.has(badge.id)) continue;

    let unlock = false;
    if (badge.id === "first_step" && attempts.length > 0) {
      unlock = true;
    } else if (badge.id === "streak_7" && profile.currentStreak >= 7) {
      unlock = true;
    } else if (badge.id === "mental_master" && mentalCorrect >= 100) {
      unlock = true;
    } else if (badge.id === "speed_processor" && fastCorrect >= 20) {
      unlock = true;
    } else if (badge.id === "multiplication_champ" && multiplicationAttempts >= 100) {
      unlock = true;
    } else if (badge.id === "problem_solver" && problemCorrect >= 50) {
      unlock = true;
    } else if (badge.id === "thousand_questions" && attempts.length >= 1000) {
      unlock = true;
    } else if (
      badge.id === "sharpshooter" &&
      completedSession &&
      completedSession.questions.length >= 10 &&
      completedSession.wrongCount === 0
    ) {
      unlock = true;
    } else if (badge.id === "division_expert" && divisionCorrect >= 50) {
      unlock = true;
    } else if (badge.id === "streak_30" && profile.currentStreak >= 30) {
      unlock = true;
    } else if (badge.id === "curriculum_p1" && profile.completedSessions >= 40) {
      unlock = true;
    } else if (badge.id === "curriculum_p3" && profile.completedSessions >= 120) {
      unlock = true;
    }

    if (unlock) {
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}
