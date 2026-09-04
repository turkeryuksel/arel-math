import { describe, it, expect } from "vitest";
import { generateMentalMathQuestion } from "@/lib/questions/mentalMath";
import { generateOperationQuestion } from "@/lib/questions/operations";
import { generateWordProblemQuestion } from "@/lib/questions/wordProblems";
import { generateLogicQuestion } from "@/lib/questions/logic";
import { generateDailySession } from "@/lib/daily-session/generator";
import {
  DEFAULT_AREL_PROFILE,
  mergeProfilesForMigration,
  mergeSessionsForMigration,
} from "@/lib/firebase/storageProvider";
import { calculateStreakUpdate } from "@/lib/adaptive/streak";
import { calculateLevelInfo, calculateQuestionXp } from "@/lib/adaptive/scoring";

describe("Question Generators Integrity", () => {
  it("should generate valid mental math questions with positive answers and explanation", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateMentalMathQuestion(3);
      expect(q.prompt).toBeDefined();
      expect(typeof q.answer === "number" || typeof q.answer === "string").toBe(true);
      expect(q.explanation.length).toBeGreaterThan(0);
      if (typeof q.answer === "number") {
        expect(q.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("should generate valid operations questions with exact integers and no division by zero", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateOperationQuestion(undefined, 3);
      expect(q.prompt).toBeDefined();
      expect(typeof q.answer).toBe("number");
      expect(Number.isInteger(q.answer)).toBe(true);
      expect((q.answer as number)).toBeGreaterThanOrEqual(0);
    }
  });

  it("should generate word problems with valid answers and explanation steps", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateWordProblemQuestion(3);
      expect(q.prompt.length).toBeGreaterThan(10);
      expect(typeof q.answer).toBe("number");
      expect((q.answer as number)).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it("should generate logic questions with valid answers", () => {
    for (let i = 0; i < 20; i++) {
      const q = generateLogicQuestion(3);
      expect(q.prompt).toBeDefined();
      expect(q.answer).toBeDefined();
    }
  });
});

describe("Deterministic Daily Session Generator", () => {
  it("should generate identical daily questions for the same date and user", () => {
    const session1 = generateDailySession({
      profile: DEFAULT_AREL_PROFILE,
      date: "2026-09-03",
      targetMinutes: 12,
    });
    const session2 = generateDailySession({
      profile: DEFAULT_AREL_PROFILE,
      date: "2026-09-03",
      targetMinutes: 12,
    });

    expect(session1.questions.length).toBe(session2.questions.length);
    expect(session1.questions[0].prompt).toBe(session2.questions[0].prompt);
    expect(session1.questions[0].answer).toBe(session2.questions[0].answer);
  });
});

describe("Streak and Scoring Logic", () => {
  it("should maintain consecutive day streak", () => {
    const res = calculateStreakUpdate("2026-09-02", 7, 10, "2026-09-03");
    expect(res.newStreak).toBe(8);
    expect(res.isStreakMaintained).toBe(true);
  });

  it("should reset streak gently on gap without error", () => {
    const res = calculateStreakUpdate("2026-08-30", 7, 12, "2026-09-03");
    expect(res.newStreak).toBe(1);
    expect(res.streakReset).toBe(true);
    expect(res.newBest).toBe(12);
  });

  it("should calculate correct level information", () => {
    const lvl = calculateLevelInfo(1240);
    expect(lvl.level).toBe(8);
    expect(lvl.progressPercent).toBeGreaterThanOrEqual(0);
  });

  it("should award appropriate question XP", () => {
    expect(calculateQuestionXp(3, true, 3000)).toBe(7); // 5 + 2 speed bonus
    expect(calculateQuestionXp(3, false, 3000)).toBe(0);
  });
});

describe("Legacy Firebase Migration", () => {
  it("keeps the furthest profile progress without dropping badges", () => {
    const remote = {
      ...DEFAULT_AREL_PROFILE,
      xp: 80,
      completedSessions: 3,
      badgesUnlocked: ["remote_badge"],
      lastActiveDate: "2026-09-03",
    };
    const local = {
      ...DEFAULT_AREL_PROFILE,
      xp: 140,
      completedSessions: 5,
      badgesUnlocked: ["local_badge"],
      lastActiveDate: "2026-09-04",
    };

    const merged = mergeProfilesForMigration(remote, local);
    expect(merged.xp).toBe(140);
    expect(merged.completedSessions).toBe(5);
    expect(merged.lastActiveDate).toBe("2026-09-04");
    expect(merged.badgesUnlocked).toEqual(expect.arrayContaining(["remote_badge", "local_badge"]));
  });

  it("unions completed questions from local and Firebase sessions", () => {
    const base = generateDailySession({
      profile: DEFAULT_AREL_PROFILE,
      date: "2026-09-04",
      targetMinutes: 12,
    });
    const remote = { ...base, completedQuestionIds: [base.questions[0].id], correctCount: 1 };
    const local = { ...base, completedQuestionIds: [base.questions[1].id], wrongCount: 1 };

    const merged = mergeSessionsForMigration(remote, local);
    expect(merged.completedQuestionIds).toEqual(
      expect.arrayContaining([base.questions[0].id, base.questions[1].id])
    );
    expect(merged.currentQuestionIndex).toBe(2);
  });
});
