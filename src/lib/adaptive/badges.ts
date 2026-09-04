import { ALL_BADGES, BadgeDefinition, BadgeMetric } from "@/data/badges/badgeList";
import { Attempt, UserProfile, DailySession } from "@/lib/questions/types";

export function checkNewUnlockedBadges(
  profile: UserProfile,
  completedSession?: DailySession,
  attempts: Attempt[] = []
): BadgeDefinition[] {
  const currentUnlocked = new Set(profile.badgesUnlocked || []);
  const correctAttempts = attempts.filter((attempt) => attempt.correct);
  const metrics: Record<BadgeMetric, number> = {
    totalAttempts: attempts.length,
    currentStreak: profile.currentStreak,
    mentalCorrect: correctAttempts.filter((attempt) => attempt.skill.startsWith("mental.")).length,
    fastCorrect: correctAttempts.filter((attempt) => attempt.responseTimeMs <= 10_000).length,
    multiplicationAttempts: attempts.filter((attempt) =>
      attempt.skill.includes("multiplication") || attempt.skill.includes("table.")
    ).length,
    problemCorrect: correctAttempts.filter((attempt) => attempt.category === "problems").length,
    perfectDaily: completedSession && completedSession.questions.length >= 10 && completedSession.wrongCount === 0 ? 1 : 0,
    divisionCorrect: correctAttempts.filter((attempt) => attempt.skill.includes("division")).length,
    completedSessions: profile.completedSessions,
    gameCompletions: Object.values(profile.gameStats || {}).reduce(
      (total, game) => total + game.completions,
      0
    ),
    curriculumCorrect: correctAttempts.filter((attempt) => attempt.category === "curriculum").length,
    fractionsCorrect: correctAttempts.filter((attempt) => attempt.skill.startsWith("fractions.")).length,
    geometryCorrect: correctAttempts.filter((attempt) => attempt.skill.startsWith("geometry.")).length,
    measurementCorrect: correctAttempts.filter((attempt) => attempt.skill.startsWith("measurement.")).length,
    dataCorrect: correctAttempts.filter((attempt) => attempt.skill.startsWith("data.") || attempt.skill.startsWith("probability.")).length,
    raceCompletions: profile.gameStats?.race?.completions || 0,
    basketballCompletions: profile.gameStats?.basketball?.completions || 0,
    swimmingCompletions: profile.gameStats?.swimming?.completions || 0,
  };

  return ALL_BADGES.filter(
    (badge) => !currentUnlocked.has(badge.id) && metrics[badge.metric] >= badge.threshold
  );
}
