export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  remainingXp: number;
}

const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  900,   // Level 6
  1100,  // Level 7
  1200,  // Level 8 (1200 - 1600)
  1600,  // Level 9
  2100,  // Level 10
  2700,  // Level 11
  3400,  // Level 12
  4200,  // Level 13
  5100,  // Level 14
  6100,  // Level 15
];

export function calculateLevelInfo(totalXp: number): LevelInfo {
  totalXp = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const extraLevels = totalXp >= lastThreshold ? Math.floor((totalXp - lastThreshold) / 500) : 0;
  level += extraLevels;
  const baseThreshold = level >= LEVEL_THRESHOLDS.length
    ? lastThreshold + extraLevels * 500 : LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? (baseThreshold + 500);
  const diff = nextThreshold - baseThreshold;
  const earnedInLevel = totalXp - baseThreshold;
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInLevel / diff) * 100)));
  const remainingXp = Math.max(0, nextThreshold - totalXp);

  return {
    level,
    currentLevelXp: totalXp,
    nextLevelXp: nextThreshold,
    progressPercent,
    remainingXp,
  };
}

export function calculateQuestionXp(difficulty: number, isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;
  let xp = 5;
  if (difficulty >= 5) xp = 8;
  if (difficulty >= 8) xp = 10;
  // Speed bonus if answered in under 5 seconds accurately
  if (responseTimeMs > 0 && responseTimeMs < 5000) {
    xp += 2;
  }
  return xp;
}

export const PRAISE_MESSAGES = [
  "Harika!",
  "Doğru! 🎯",
  "Güzel iş! 👏",
  "Devam! 🚀",
  "Süper! ⭐",
  "Tam isabet!",
  "Çok iyi gidiyorsun!",
  "Muhteşem bir çözüm!",
];

export const WRONG_MESSAGES = [
  "Henüz değil.",
  "Bu soru bize yeni bir şey öğretecek.",
  "Denemen değerli; çözüm yolunu keşfedelim.",
  "Birlikte bakalım.",
  "Kendi hızında ilerle; adımları birlikte inceleyelim.",
];
