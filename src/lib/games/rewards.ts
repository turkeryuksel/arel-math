import type { UserProfile } from "@/lib/questions/types";

export const GAME_DAILY_XP_LIMIT = 60;
export const GAME_XP_LIMIT = 20;
export const GAME_REWARD_TEXT = "Her oyunda günün ilk turu 15 XP, ikinci turu 5 XP. Oyunlardan günde toplam en fazla 60 XP. Sonraki turlar da gelişimine ve rozetlerine sayılır.";
export const REWARDED_GAMES = ["cosmos", "memory", "symmetry", "ocean", "race", "basketball", "swimming"] as const;

export function gameReward(profile: UserProfile, gameId: string, date: string, correctSpeedAnswer = false) {
  const saved = profile.gameXpDaily;
  const budget = saved && saved.date >= date
    ? { ...saved, games: { ...saved.games } }
    : { date, total: 0, games: {} as Record<string, { xp: number; completions: number }> };
  const previous = budget.games[gameId] || { xp: 0, completions: 0 };
  const requested = gameId === "speed-run"
    ? (correctSpeedAnswer ? 1 : 0)
    : previous.completions === 0 ? 15 : previous.completions === 1 ? 5 : 0;
  const earnedXp = Math.max(0, Math.min(requested, GAME_XP_LIMIT - previous.xp, GAME_DAILY_XP_LIMIT - budget.total));
  budget.total += earnedXp;
  budget.games[gameId] = { xp: previous.xp + earnedXp, completions: previous.completions + (gameId === "speed-run" ? 0 : 1) };
  return { earnedXp, budget };
}
