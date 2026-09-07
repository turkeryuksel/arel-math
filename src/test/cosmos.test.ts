import { describe, expect, it } from "vitest";
import { COSMOS_TABLES, createCosmosQuestion, orbPosition, segmentHitsCircle } from "@/lib/games/cosmos";
import { allocateMinutes, getDailyTargetMinutes } from "@/lib/daily-session/target";

describe("Cosmos math and input", () => {
  it("produces four distinct valid answers and cycles every selected table", () => {
    const recent = new Set<string>();
    const seen = new Set<number>();
    for (let index = 0; index < 220; index++) {
      const q = createCosmosQuestion("test", index, COSMOS_TABLES, recent);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(Number(q.metadata!.table) * Number(q.metadata!.factor));
      expect(q.choices!.every(n => Number.isFinite(n) && Number(n) > 0)).toBe(true);
      expect(q.skill).toBe(`multiplication.table.${q.metadata!.table}`);
      if (index < 11) seen.add(Number(q.metadata!.table));
      recent.delete(q.signature); recent.add(q.signature);
    }
    expect(seen.size).toBe(11);
  });
  it("avoids repeated facts until a selected table is exhausted and rejects empty choices", () => {
    const recent = new Set<string>();
    for (let i = 0; i < 9; i++) {
      const q = createCosmosQuestion("run", i, [7], recent);
      expect(recent.has(q.signature)).toBe(false); recent.add(q.signature);
    }
    expect(() => createCosmosQuestion("run", 0, [], recent)).toThrow();
    expect(createCosmosQuestion("run", 10, [7, 8], recent, 8).metadata?.table).toBe(8);
  });
  it("recognizes fast swipes, taps and near misses", () => {
    expect(segmentHitsCircle({x:0,y:0},{x:100,y:0},{x:50,y:0},10)).toBe(true);
    expect(segmentHitsCircle({x:50,y:0},{x:50,y:0},{x:50,y:0},10)).toBe(true);
    expect(segmentHitsCircle({x:0,y:11},{x:100,y:11},{x:50,y:0},10)).toBe(false);
  });
  it("keeps flying targets inside a narrow phone field and stops motion on request", () => {
    for (let i = 0; i < 4; i++) for (let t = 0; t < 12; t += .1) {
      const p = orbPosition(i, 280, 300, t, "flight");
      expect(p.x).toBeGreaterThanOrEqual(30); expect(p.x).toBeLessThanOrEqual(250);
      expect(p.y).toBeGreaterThanOrEqual(30); expect(p.y).toBeLessThanOrEqual(270);
    }
    expect(orbPosition(1,280,300,0,"flight",true)).toEqual(orbPosition(1,280,300,20,"flight",true));
  });
});
describe("Daily target allocation", () => {
  it.each([5,12,20,30,45])("keeps every category total equal to the %i minute parent target", target => {
    expect(getDailyTargetMinutes({targetMinutes:target})).toBe(target);
    const parts = allocateMinutes([6,8,3,2,4], target);
    expect(parts.reduce((a,b) => a+b,0)).toBe(target);
    expect(parts.every(n => Number.isInteger(n) && n >= 0)).toBe(true);
    expect(allocateMinutes([0,0,4],target)).toEqual([0,0,target]);
  });
});
