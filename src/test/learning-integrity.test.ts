import { describe, expect, it } from "vitest";
import { isAnswerCorrect, isValidNumericAnswer } from "@/lib/questions/answers";
import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { generateCurriculumQuestion } from "@/lib/questions/curriculum";
import { CURRICULUM_STANDARDS } from "@/lib/curriculum/standards";
import { SeededRandom } from "@/lib/questions/seed";

describe("Answer fairness", () => {
  it("does not turn incomplete input into a recorded wrong answer", () => {
    for (const input of ["", " ", "-", "--2", "2,", "NaN", "Infinity", "0x10"]) expect(isValidNumericAnswer(input)).toBe(false);
    for (const input of ["0", "007", "-2", "2,5"]) expect(isValidNumericAnswer(input)).toBe(true);
  });
  it.each([["007", 7], [" 42 ", 42], ["1,5", 1.5], ["-02", -2], ["EŞİT", "Eşit"]])("accepts equivalent answer %s", (given, expected) => {
    expect(isAnswerCorrect(given, expected)).toBe(true);
  });
  it.each([["", 0], [" ", 0], ["0x10", 16], ["1e2", 100], ["12abc", 12], ["43", 42]])("rejects invalid or wrong answer %s", (given, expected) => {
    expect(isAnswerCorrect(given, expected)).toBe(false);
  });
});

describe("Continuing progression", () => {
  it("continues leveling after the last listed level", () => {
    expect(calculateLevelInfo(6100)).toMatchObject({ level: 15, remainingXp: 500 });
    expect(calculateLevelInfo(6600)).toMatchObject({ level: 16, progressPercent: 0, remainingXp: 500 });
    expect(calculateLevelInfo(7350)).toMatchObject({ level: 17, progressPercent: 50, remainingXp: 250 });
  });
  it("keeps malformed XP from corrupting the progress display", () => {
    for (const xp of [-100, NaN, Infinity]) expect(calculateLevelInfo(xp)).toMatchObject({ level: 1, currentLevelXp: 0, remainingXp: 100 });
  });
});

describe("Unambiguous curriculum questions", () => {
  it("has exactly one mathematically correct fraction option across seeded examples", () => {
    const standards = CURRICULUM_STANDARDS.filter((s) => s.skill === "fractions.parts" || s.skill === "fractions.operations");
    for (const standard of standards) {
      for (let seed = 0; seed < 300; seed++) {
        const q = generateCurriculumQuestion(standard.grade, standard.code, 3, new SeededRandom(seed));
        const [n, d] = String(q.answer).split("/").map(Number);
        const correctChoices = q.choices!.filter((choice) => {
          const [cn, cd] = String(choice).split("/").map(Number);
          return cn * d === n * cd;
        });
        expect(correctChoices, q.prompt).toHaveLength(1);
        expect(new Set(q.choices).size).toBe(4);
      }
    }
  });
  it("identifies the requested position even when digits repeat", () => {
    for (const standard of CURRICULUM_STANDARDS.filter((s) => s.skill === "numbers.placeValue")) {
      for (let seed = 0; seed < 100; seed++) {
        const q = generateCurriculumQuestion(standard.grade, standard.code, 3, new SeededRandom(seed));
        expect(q.prompt).toMatch(/basamağındaki rakamın/);
        const number = Number(q.prompt.split(" ")[0].replaceAll(".", ""));
        const place = q.prompt.includes("on binler") ? 10000 : q.prompt.includes("binler") ? 1000 : q.prompt.includes("yüzler") ? 100 : q.prompt.includes("onlar") ? 10 : 1;
        expect(q.answer).toBe((Math.floor(number / place) % 10) * place);
      }
    }
  });
});
