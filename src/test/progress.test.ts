import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const remote = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  fail: false,
  queue: Promise.resolve() as Promise<unknown>,
}));
vi.mock("@/lib/firebase/client", () => ({ db: {} }));
vi.mock("firebase/firestore", () => {
  const snapshot = (path: string) => ({
    exists: () => remote.data.has(path),
    data: () => structuredClone(remote.data.get(path)),
  });
  return {
    doc: (_: unknown, ...parts: string[]) => parts.join("/"),
    collection: (_: unknown, ...parts: string[]) => parts.join("/"),
    getDoc: async (path: string) => snapshot(path),
    getDocs: async (path: string) => ({
      docs: [...remote.data.keys()].filter((key) =>
        key.startsWith(path + "/") && !key.slice(path.length + 1).includes("/")
      ).map((key) => ({ ...snapshot(key), id: key.split("/").at(-1) })),
    }),
    setDoc: async (path: string, value: unknown) => { remote.data.set(path, structuredClone(value)); },
    deleteDoc: vi.fn(),
    writeBatch: vi.fn(),
    runTransaction: (_: unknown, callback: (tx: unknown) => Promise<unknown>) => {
      const result = remote.queue.catch(() => {}).then(async () => {
        const writes = new Map<string, unknown>();
        const value = await callback({
          get: async (path: string) => snapshot(path),
          set: (path: string, data: unknown) => writes.set(path, structuredClone(data)),
        });
        if (remote.fail) throw new Error("offline");
        writes.forEach((data, path) => remote.data.set(path, data));
        return value;
      });
      remote.queue = result;
      return result;
    },
  };
});

import { AppStorage, FRESH_AREL_PROFILE } from "@/lib/firebase/storageProvider";
import { generateDailySession, generatePracticeSession } from "@/lib/daily-session/generator";
import { getLearningAnalytics } from "@/lib/analytics";
import { calculateCurriculumDay, getCurriculumProgressPercent } from "@/lib/curriculum/progress";
import { getNextUnansweredIndex } from "@/lib/daily-session/progress";
import { generateTableQuestion } from "@/lib/questions/multiplicationTable";
import { SeededRandom } from "@/lib/questions/seed";
import type { DailySession } from "@/lib/questions/types";

const profilePath = "users/arel_deniz";
function answer(session: DailySession, index = 0) {
  const question = session.questions[index];
  return AppStorage.recordAnswer({
    session, question, questionId: question.id, userAnswer: question.answer,
    isCorrect: true, earnedXp: 10, responseTimeMs: 60000,
  });
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
  remote.data.clear();
  remote.fail = false;
  remote.queue = Promise.resolve();
  remote.data.set(profilePath, structuredClone(FRESH_AREL_PROFILE));
  await AppStorage.hydrateFromFirestore("arel_deniz");
});

afterEach(() => vi.useRealTimers());

describe("Progress persistence regressions", () => {
  it("creates only one daily session for concurrent starts", async () => {
    const [a, b] = await Promise.all([AppStorage.getDailySession(), AppStorage.getDailySession()]);
    expect(a).toEqual(b);
    expect(a.questions.map((q) => q.id)).toEqual(generateDailySession({
      profile: FRESH_AREL_PROFILE, date: "2026-09-06",
    }).questions.map((q) => q.id));
  });

  it("counts a duplicate submission once even with a stale session", async () => {
    const session = await AppStorage.getDailySession();
    await Promise.all([answer(session), answer(session)]);
    expect(AppStorage.getProfile().xp).toBe(10);
    expect(AppStorage.getAttempts()).toHaveLength(1);
    expect((await AppStorage.getDailySession()).completedQuestionIds).toHaveLength(1);
  });

  it("merges answers from stale category sessions without losing progress", async () => {
    const session = await AppStorage.getDailySession();
    await Promise.all(session.questions.map((_, index) => answer(session, index)));
    const completed = await AppStorage.getDailySession();
    expect(completed.status).toBe("completed");
    expect(completed.completedQuestionIds).toHaveLength(session.questions.length);
    expect(AppStorage.getProfile().completedSessions).toBe(1);
    expect(AppStorage.getProfile().currentStreak).toBe(1);
    await answer(session);
    expect(AppStorage.getProfile().completedSessions).toBe(1);
  });

  it("saves a midnight-crossing task to its original day", async () => {
    vi.setSystemTime(new Date("2026-09-06T20:59:00Z"));
    const session = await AppStorage.getDailySession();
    vi.setSystemTime(new Date("2026-09-06T21:01:00Z"));
    for (let i = 0; i < session.questions.length; i++) await answer(session, i);
    expect((await AppStorage.getDailySession("2026-09-06")).status).toBe("completed");
    expect(AppStorage.getAttempts().every((a) => a.date === "2026-09-06")).toBe(true);
    expect(AppStorage.getProfile().completedSessions).toBe(1);
    expect((await AppStorage.getDailySession()).date).toBe("2026-09-07");
    expect((await AppStorage.getDailySession()).curriculumDay).toBe(2);
  });

  it("does not mutate local progress on failure and supports retry", async () => {
    const session = await AppStorage.getDailySession();
    remote.fail = true;
    await expect(answer(session)).rejects.toThrow("offline");
    expect(AppStorage.getProfile().xp).toBe(0);
    expect(AppStorage.getAttempts()).toHaveLength(0);
    remote.fail = false;
    await answer(session);
    expect(AppStorage.getProfile().xp).toBe(10);
  });

  it("includes extra practice minutes without completing the daily plan", async () => {
    const practice = generatePracticeSession(AppStorage.getProfile(), "mental-math", 1);
    await answer(practice);
    const analytics = getLearningAnalytics(AppStorage.getProfile());
    expect(analytics.minutes).toBe(1);
    expect(analytics.totalAttempts).toBe(1);
    expect(AppStorage.getProfile().completedSessions).toBe(0);
    expect(AppStorage.getDailySessions()).toHaveLength(0);
  });

  it("regenerates an untouched plan after a parent setting change, preserving started work", async () => {
    const first = await AppStorage.getDailySession();
    await AppStorage.updateLearningSettings({ targetMinutes: 20, subjectWeights: {}, tomorrowSpecialTask: null });
    const revised = await AppStorage.getDailySession();
    expect(revised.questions.length).toBeGreaterThan(first.questions.length);
    await answer(revised);
    await AppStorage.updateLearningSettings({ targetMinutes: 5, subjectWeights: {}, tomorrowSpecialTask: null });
    expect((await AppStorage.getDailySession()).questions).toEqual(revised.questions);
    expect((await AppStorage.getDailySession()).completedQuestionIds).toHaveLength(1);
    expect(AppStorage.getProfile().xp).toBe(10);
  });

  it("advances an overridden curriculum day only on full daily completion", async () => {
    await AppStorage.setCurriculumDayOverride(35);
    const session = await AppStorage.getDailySession();
    expect(session.curriculumDay).toBe(35);
    for (let i = 0; i < session.questions.length; i++) await answer(session, i);
    expect(calculateCurriculumDay(AppStorage.getProfile())).toBe(36);
    await answer(session);
    expect(calculateCurriculumDay(AppStorage.getProfile())).toBe(36);
  });

  it("restores chronological history after reload", async () => {
    const session = await AppStorage.getDailySession();
    await answer(session, 0);
    vi.advanceTimersByTime(1000);
    await answer(session, 1);
    await AppStorage.hydrateFromFirestore("arel_deniz");
    expect(AppStorage.getAttempts()[0].questionId).toBe(session.questions[0].id);
    expect(AppStorage.getProfile().xp).toBe(20);
  });
});

describe("Curriculum and repetition regressions", () => {
  it("skips previously completed sections when resuming the full plan", () => {
    const session = generateDailySession({ profile: FRESH_AREL_PROFILE, date: "2026-09-06" });
    session.completedQuestionIds = session.questions.filter((q) => q.category === "operations").map((q) => q.id);
    const visited: string[] = [];
    let next = getNextUnansweredIndex(session.questions, session);
    while (next !== -1) {
      const question = session.questions[next];
      expect(question.category).not.toBe("operations");
      visited.push(question.id);
      session.completedQuestionIds.push(question.id);
      next = getNextUnansweredIndex(session.questions, session);
    }
    expect(new Set(visited).size).toBe(visited.length);
    expect(session.completedQuestionIds).toHaveLength(session.questions.length);
  });

  it("honors the parent day selection and reaches 100 percent after day 200", () => {
    expect(calculateCurriculumDay({ ...FRESH_AREL_PROFILE, curriculumDayOverride: 35 })).toBe(35);
    expect(getCurriculumProgressPercent({ ...FRESH_AREL_PROFILE, completedSessions: 200 })).toBe(100);
  });

  it("exhausts every table fact before reusing the oldest, with a stable signature", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const question = generateTableQuestion(7, 3, new SeededRandom(i + 1), seen);
      expect(seen.has(question.signature)).toBe(false);
      seen.add(question.signature);
    }
    const repeated = generateTableQuestion(7, 3, new SeededRandom(10), seen);
    expect(repeated.signature).toBe([...seen][0]);
    expect(repeated.signature).toBe(`table_7x${Number(repeated.answer) / 7}`);
  });

  it("avoids recent daily questions when generating another plan", () => {
    const first = generateDailySession({ profile: FRESH_AREL_PROFILE, date: "2026-09-05" });
    const signatures = new Set(first.questions.map((q) => q.signature));
    const next = generateDailySession({
      profile: FRESH_AREL_PROFILE, date: "2026-09-06", recentSignatures: signatures,
    });
    expect(next.questions.filter((q) => signatures.has(q.signature))).toHaveLength(0);
  });
});

describe("Game reward persistence", () => {
  it("counts concurrent retries of one result only once", async () => {
    await Promise.all([
      AppStorage.recordGameResult("memory", 12, "run-1"),
      AppStorage.recordGameResult("memory", 12, "run-1"),
    ]);
    expect(AppStorage.getProfile().xp).toBe(15);
    expect(AppStorage.getProfile().gameStats?.memory.completions).toBe(1);
  });

  it("preserves a simultaneous training answer and game reward", async () => {
    const session = await AppStorage.getDailySession();
    await Promise.all([answer(session), AppStorage.recordGameResult("memory", 12, "run-1")]);
    expect(AppStorage.getProfile().xp).toBe(25);
    expect(AppStorage.getProfile().skillStats[session.questions[0].skill].attempts).toBe(1);
    expect(AppStorage.getProfile().gameStats?.memory.completions).toBe(1);
  });

  it("does not promise a reward when saving fails and supports a safe retry", async () => {
    remote.fail = true;
    await expect(AppStorage.recordGameResult("memory", 12, "run-1")).rejects.toThrow("offline");
    expect(AppStorage.getProfile().xp).toBe(0);
    remote.fail = false;
    await AppStorage.recordGameResult("memory", 12, "run-1");
    expect(AppStorage.getProfile().xp).toBe(15);
  });

  it("allows a new round while keeping best moves and deduplicating an earlier retry", async () => {
    await AppStorage.recordGameResult("memory", 12, "run-1");
    await AppStorage.recordGameResult("memory", 9, "run-2");
    await AppStorage.recordGameResult("memory", 12, "run-1");
    expect(AppStorage.getProfile().xp).toBe(30);
    expect(AppStorage.getProfile().gameStats?.memory).toMatchObject({ completions: 2, bestMoves: 9 });
  });
});
