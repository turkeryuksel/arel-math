import type { UserProfile } from "@/lib/questions/types";

export function getDailyTargetMinutes(profile: Pick<UserProfile, "targetMinutes">): number {
  return Number.isFinite(profile.targetMinutes) && profile.targetMinutes > 0
    ? Math.round(profile.targetMinutes) : 12;
}

/** Allocate whole minutes without changing the daily total. */
export function allocateMinutes(counts: number[], target: number): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (!total) return counts.map(() => 0);
  const exact = counts.map(count => count / total * target);
  const result = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, fraction: value - result[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  const remainder = target - result.reduce((sum, value) => sum + value, 0);
  for (let i = 0; i < remainder; i++) result[order[i].index]++;
  return result;
}
