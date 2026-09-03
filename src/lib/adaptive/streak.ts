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

export const ENCOURAGING_STREAK_MESSAGES = [
  "Harika bir seri! Aynen böyle devam!",
  "Her gün biraz matematik seni şampiyon yapıyor!",
  "Serini koru, hedefine bir adım daha yaklaş!",
  "Yeni bir başlangıç için harika bir gün!",
  "Bugün de buradasın, tebrikler Arel!",
];
