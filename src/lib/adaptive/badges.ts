import { ALL_BADGES, BadgeDefinition } from "@/data/badges/badgeList";
import { UserProfile, DailySession } from "@/lib/questions/types";

export function checkNewUnlockedBadges(
  profile: UserProfile,
  completedSession?: DailySession,
  totalSolvedCount: number = 0
): BadgeDefinition[] {
  const currentUnlocked = new Set(profile.badgesUnlocked || []);
  const newlyUnlocked: BadgeDefinition[] = [];

  for (const badge of ALL_BADGES) {
    if (currentUnlocked.has(badge.id)) continue;

    let unlock = false;
    if (badge.id === "first_step" && (completedSession || totalSolvedCount > 0)) {
      unlock = true;
    } else if (badge.id === "streak_7" && profile.currentStreak >= 7) {
      unlock = true;
    } else if (badge.id === "mental_master") {
      const mentalAttempts = profile.skillStats?.["mental.addition"]?.correct || 0;
      if (mentalAttempts >= 100) unlock = true;
    } else if (badge.id === "thousand_questions" && totalSolvedCount >= 1000) {
      unlock = true;
    } else if (
      badge.id === "sharpshooter" &&
      completedSession &&
      completedSession.questions.length >= 10 &&
      completedSession.wrongCount === 0
    ) {
      unlock = true;
    }

    if (unlock) {
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}
