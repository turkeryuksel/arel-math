// Returns YYYY-MM-DD for Europe/Istanbul timezone
export function getIstanbulDateString(d: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

export function calculateStreakUpdate(
  lastActiveDate: string | null | undefined,
  currentStreak: number,
  bestStreak: number,
  todayStr: string = getIstanbulDateString()
): { newStreak: number; newBest: number; isStreakMaintained: boolean; streakReset: boolean } {
  if (!lastActiveDate) {
    return {
      newStreak: 1,
      newBest: Math.max(1, bestStreak),
      isStreakMaintained: true,
      streakReset: false,
    };
  }

  if (lastActiveDate === todayStr) {
    // Already active today
    return {
      newStreak: currentStreak,
      newBest: bestStreak,
      isStreakMaintained: true,
      streakReset: false,
    };
  }

  const today = new Date(todayStr);
  const last = new Date(lastActiveDate);
  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 1) {
    // Consecutive day
    const updated = currentStreak + 1;
    return {
      newStreak: updated,
      newBest: Math.max(updated, bestStreak),
      isStreakMaintained: true,
      streakReset: false,
    };
  } else if (diffDays > 1) {
    // Gap occurred
    return {
      newStreak: 1,
      newBest: bestStreak,
      isStreakMaintained: false,
      streakReset: true,
    };
  }

  return {
    newStreak: currentStreak,
    newBest: bestStreak,
    isStreakMaintained: true,
    streakReset: false,
  };
}

function dateDistance(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export interface StreakShieldState {
  count: number;
  progress: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  event: "earned" | "consumed" | null;
  protectedDays: number;
}

/**
 * Applies one canonical meaningful learning day to the V1 shield ledger.
 * The caller must invoke this only when a daily session is truly completed.
 */
export function applyStreakShieldWorkday(input: {
  lastActiveDate: string | null | undefined;
  currentStreak: number;
  bestStreak: number;
  shieldCount?: number;
  shieldProgress?: number;
  activatedAt?: string;
  workday: string;
}): StreakShieldState {
  const count = Math.max(0, Math.min(3, Math.trunc(input.shieldCount ?? 0)));
  let progress = Math.max(0, Math.min(2, Math.trunc(input.shieldProgress ?? 0)));
  let currentStreak = Math.max(0, Math.trunc(input.currentStreak || 0));
  let bestStreak = Math.max(0, Math.trunc(input.bestStreak || 0));
  let nextCount = count;
  let event: StreakShieldState["event"] = null;
  let protectedDays = 0;

  if (!input.activatedAt) {
    progress = (progress + 1) % 3;
    nextCount = count < 3 && progress === 0 ? count + 1 : count;
    if (nextCount > count) event = "earned";
    currentStreak = Math.max(1, currentStreak || 0);
    bestStreak = Math.max(bestStreak, currentStreak);
    return { count: nextCount, progress, currentStreak, bestStreak, lastActiveDate: input.workday, event, protectedDays };
  }

  const gap = input.lastActiveDate ? Math.max(0, dateDistance(input.lastActiveDate, input.workday) - 1) : 0;
  protectedDays = Math.min(nextCount, gap);
  nextCount -= protectedDays;
  if (gap > protectedDays) {
    currentStreak = 1;
  } else if (input.lastActiveDate && dateDistance(input.lastActiveDate, input.workday) === 1) {
    currentStreak = Math.max(1, currentStreak) + 1;
  } else if (!input.lastActiveDate) {
    currentStreak = 1;
  } else {
    currentStreak = Math.max(1, currentStreak) + 1;
  }
  bestStreak = Math.max(bestStreak, currentStreak);
  progress = (progress + 1) % 3;
  if (nextCount < 3 && progress === 0) {
    nextCount += 1;
    event = "earned";
  }
  if (protectedDays > 0) event = "consumed";
  return { count: nextCount, progress, currentStreak, bestStreak, lastActiveDate: input.workday, event, protectedDays };
}

export function calculateStreakFromCompletedDates(
  completedDates: string[],
  todayStr: string = getIstanbulDateString()
): { currentStreak: number; bestStreak: number; lastCompletedDate: string | null } {
  const dates = Array.from(new Set(completedDates))
    .filter((date) => date <= todayStr)
    .sort();
  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null };
  }

  let bestStreak = 1;
  let runningStreak = 1;
  for (let index = 1; index < dates.length; index += 1) {
    if (dateDistance(dates[index - 1], dates[index]) === 1) {
      runningStreak += 1;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  const lastCompletedDate = dates.at(-1) || null;
  const isStillActive = lastCompletedDate != null && dateDistance(lastCompletedDate, todayStr) <= 1;
  let currentStreak = isStillActive ? 1 : 0;
  if (isStillActive) {
    for (let index = dates.length - 1; index > 0; index -= 1) {
      if (dateDistance(dates[index - 1], dates[index]) !== 1) break;
      currentStreak += 1;
    }
  }

  return { currentStreak, bestStreak, lastCompletedDate };
}

export const ENCOURAGING_STREAK_MESSAGES = [
  "Harika bir seri! Aynen böyle devam!",
  "Her gün biraz matematik seni şampiyon yapıyor!",
  "Serini koru, hedefine bir adım daha yaklaş!",
  "Yeni bir başlangıç için harika bir gün!",
  "Bugün de buradasın, tebrikler Arel!",
];
