import { Attempt, UserProfile } from "@/lib/questions/types";

export function evaluateSkillDifficulty(
  currentDifficulty: number,
  recentAttempts: Attempt[]
): { nextDifficulty: number; accuracy: number; reviewNeeded: boolean } {
  if (recentAttempts.length < 5) {
    return { nextDifficulty: currentDifficulty, accuracy: 100, reviewNeeded: false };
  }

  const sample = recentAttempts.slice(-20);
  const correctCount = sample.filter((a) => a.correct).length;
  const accuracy = Math.round((correctCount / sample.length) * 100);

  let nextDifficulty = currentDifficulty;
  let reviewNeeded = false;

  if (accuracy > 90 && sample.length >= 10) {
    nextDifficulty = Math.min(10, currentDifficulty + 1);
  } else if (accuracy < 70) {
    nextDifficulty = Math.max(1, currentDifficulty - 1);
    reviewNeeded = true;
  }

  return { nextDifficulty, accuracy, reviewNeeded };
}

export function getTroubledSkills(profile: UserProfile): string[] {
  const troubled: string[] = [];
  if (!profile.skillStats) return troubled;

  for (const [skillId, stats] of Object.entries(profile.skillStats)) {
    if (stats.attempts >= 4 && stats.accuracy < 70) {
      troubled.push(skillId);
    }
  }
  return troubled;
}
