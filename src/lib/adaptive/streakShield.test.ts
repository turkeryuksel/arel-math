import { describe, expect, it } from "vitest";
import { applyStreakShieldWorkday } from "./streak";

const day = (n: number) => `2026-01-${String(n).padStart(2, "0")}`;

describe("Seri Kalkanı V1", () => {
  it("earns one shield after three real workdays and caps at three", () => {
    const first = applyStreakShieldWorkday({ lastActiveDate: undefined, currentStreak: 0, bestStreak: 0, workday: day(1) });
    const second = applyStreakShieldWorkday({ lastActiveDate: first.lastActiveDate, currentStreak: first.currentStreak, bestStreak: first.bestStreak, shieldCount: first.count, shieldProgress: first.progress, activatedAt: day(1), workday: day(2) });
    const third = applyStreakShieldWorkday({ lastActiveDate: second.lastActiveDate, currentStreak: second.currentStreak, bestStreak: second.bestStreak, shieldCount: second.count, shieldProgress: second.progress, activatedAt: day(1), workday: day(3) });
    expect(third.count).toBe(1);
    let state = third;
    for (const n of [4, 5, 6, 7, 8, 9, 10, 11, 12]) state = applyStreakShieldWorkday({ lastActiveDate: state.lastActiveDate, currentStreak: state.currentStreak, bestStreak: state.bestStreak, shieldCount: state.count, shieldProgress: state.progress, activatedAt: day(1), workday: day(n) });
    expect(state.count).toBe(3);
  });

  it("does not change on login-only and consumes shields only for missed days", () => {
    const state = applyStreakShieldWorkday({ lastActiveDate: day(3), currentStreak: 3, bestStreak: 3, shieldCount: 2, shieldProgress: 0, activatedAt: day(1), workday: day(5) });
    expect(state.count).toBe(1);
    expect(state.currentStreak).toBe(4);
    expect(state.protectedDays).toBe(1);
    expect(state.progress).toBe(1);
  });

  it("breaks after more missed days than available shields", () => {
    const state = applyStreakShieldWorkday({ lastActiveDate: day(1), currentStreak: 8, bestStreak: 8, shieldCount: 2, shieldProgress: 0, activatedAt: day(1), workday: day(5) });
    expect(state.count).toBe(0);
    expect(state.currentStreak).toBe(1);
    expect(state.protectedDays).toBe(2);
  });
});
