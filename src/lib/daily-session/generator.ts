import { DailySession, Question, UserProfile } from "@/lib/questions/types";
import { SeededRandom } from "@/lib/questions/seed";
import { generateQuestion } from "@/lib/questions/engine";
import { getTroubledSkills } from "@/lib/adaptive/difficulty";
import { getIstanbulDateString } from "@/lib/adaptive/streak";
import { getCurriculumDay, CurriculumDay } from "@/lib/curriculum/map";
import { getStandardsForDay } from "@/lib/curriculum/standards";
import { generateCurriculumQuestion } from "@/lib/questions/curriculum";

export interface GenerateSessionParams {
  profile: UserProfile;
  date?: string;
  targetMinutes?: number;
  customQuestions?: Question[];
  recentSignatures?: Set<string>;
}

export function generatePracticeSession(
  profile: UserProfile,
  category: Question["category"],
  count = 12,
  recentSignatures: Set<string> = new Set()
): DailySession {
  const date = getIstanbulDateString();
  const seed = `${profile.id}_practice_${category}_${Date.now()}_${Math.random()}`;
  const signatures = new Set(recentSignatures);
  const questions: Question[] = [];
  const difficulty = Math.max(1, Math.min(10, profile.skillRatings?.[category === "mental-math" ? "mental.addition" : "operations.addition"] || 3));

  for (let index = 0; index < count; index += 1) {
    const question = generateQuestion({
      category,
      difficulty,
      seed: `${seed}_${index}`,
      troubledSkills: getTroubledSkills(profile),
      recentSignatures: signatures,
    });
    signatures.delete(question.signature);
    signatures.add(question.signature);
    questions.push(question);
  }

  return {
    id: `practice_${profile.id}_${Date.now()}`,
    date,
    userId: profile.id,
    targetMinutes: count,
    estimatedMinutes: Math.max(1, Math.round(count * 0.8)),
    questions: questions.map((question, index) => ({ ...question, id: `${seed}_${index}` })),
    currentQuestionIndex: 0,
    completedQuestionIds: [],
    correctCount: 0,
    wrongCount: 0,
    earnedXp: 0,
    status: "active",
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * Determines the effective curriculum day for a profile.
 * Respects admin override if set, otherwise uses completedSessions.
 */
function getEffectiveCurriculumDay(profile?: Partial<UserProfile>): number {
  if (!profile) return 1;
  if (profile.curriculumDayOverride != null && profile.curriculumDayOverride > 0) {
    return Math.min(200, profile.curriculumDayOverride);
  }
  const completed = profile.completedSessions ?? 0;
  return Math.max(1, Math.min(200, completed + 1));
}

export function generateDailySession(params: GenerateSessionParams): DailySession {
  const { profile, date = getIstanbulDateString(), targetMinutes, customQuestions = [], recentSignatures = new Set<string>() } = params;
  const target = targetMinutes || profile.targetMinutes || 12;

  // Proportions:
  // For standard 12 min: 5 mental, 5 operations, 3 word problems, 2 logic,
  // 2 official-curriculum discovery questions = 17 questions.
  const scale = target / 12;
  let mentalCount = Math.max(3, Math.round(5 * scale));
  let opCount = Math.max(3, Math.round(5 * scale));
  let probCount = Math.max(2, Math.round(3 * scale));
  const logicCount = Math.max(1, Math.round(2 * scale));
  const curriculumCount = Math.max(1, Math.round(2 * scale));
  if (profile.subjectWeights?.problems === "high") {
    probCount += 2;
    mentalCount = Math.max(3, mentalCount - 1);
    opCount = Math.max(3, opCount - 1);
  } else if (profile.subjectWeights?.problems === "low") {
    probCount = Math.max(2, probCount - 1);
    opCount += 1;
  }

  // Get curriculum spec for today
  const curriculumDayIndex = getEffectiveCurriculumDay(profile);
  const curriculum: CurriculumDay = getCurriculumDay(curriculumDayIndex);

  const troubled = getTroubledSkills(profile);
  const seedString = `${profile.id}_${date}`;
  const rng = new SeededRandom(seedString);
  const signatures = new Set(recentSignatures);
  const questions: Question[] = [];
  const weights = profile.subjectWeights || {};
  const operationPool = (["addition", "subtraction", "multiplication", "division"] as const).flatMap(
    (operation) => Array(weights[operation] === "high" ? 4 : weights[operation] === "low" ? 1 : 2).fill(operation)
  );
  const problemPool = (["addition", "subtraction", "multiplication", "division"] as const).flatMap(
    (operation) => Array(weights[operation] === "high" ? 4 : weights[operation] === "low" ? 1 : 2).fill(`problem.${operation}` as const)
  );

  const addQuestions = (
    category: Question["category"],
    count: number,
    curriculumDiff: number
  ) => {
    for (let i = 0; i < count; i++) {
      // 60% curriculum target, 25% review (diff - 1), 15% stretch (diff + 1)
      // Adaptive: if performance is bad, bias toward easier; if great, slightly harder
      const roll = rng.next();
      let diff = curriculumDiff;

      if (roll < 0.25) {
        // Review / consolidation
        diff = Math.max(1, curriculumDiff - 1);
      } else if (roll > 0.85) {
        // Stretch / challenge
        diff = Math.min(10, curriculumDiff + 1);
      }

      const focusCandidates = curriculum.focusSkills.filter((skill) =>
        category === "mental-math" ? skill.startsWith("mental.") || skill.startsWith("multiplication.table.") :
        category === "operations" ? skill.startsWith("operations.") || skill.startsWith("multiplication.table.") :
        category === "problems" ? skill.startsWith("problem.") : skill.startsWith("logic.")
      );
      const troubledCandidates = troubled.filter((skill) =>
        category === "mental-math" ? skill.startsWith("mental.") || skill.startsWith("multiplication.table.") :
        category === "operations" ? skill.startsWith("operations.") || skill.startsWith("multiplication.table.") :
        category === "problems" ? skill.startsWith("problem.") : skill.startsWith("logic.")
      ) as Question["skill"][];
      const targetSkill = troubledCandidates.length > 0 && rng.next() < 0.6
        ? rng.pick(troubledCandidates)
        : focusCandidates.length > 0 && rng.next() < 0.55
        ? rng.pick(focusCandidates)
        : undefined;

      // Apply performance-based adaptive nudge for the actual targeted skill.
      const skillKey = targetSkill || (category === "mental-math"
        ? "mental.addition"
        : category === "operations"
        ? "operations.addition"
        : category === "problems"
        ? "problem.addition"
        : "logic.missingNumber");

      const skillRating = profile.skillRatings?.[skillKey];
      if (skillRating != null) {
        const gap = skillRating - curriculumDiff;
        if (gap > 1) {
          // User is well ahead — add one step
          diff = Math.min(10, diff + 1);
        } else if (gap < -1) {
          // User is behind curriculum — ease off a step
          diff = Math.max(1, diff - 1);
        }
      }

      const q = generateQuestion({
        category,
        difficulty: diff,
        seed: `${seedString}_${category}_${i}_${roll}`,
        troubledSkills: troubled,
        recentSignatures: signatures,
        operationType: category === "operations" ? rng.pick(operationPool) : undefined,
        problemSkill: category === "problems" ? rng.pick(problemPool) : undefined,
        targetSkill,
      });
      signatures.delete(q.signature);
      signatures.add(q.signature);
      questions.push(q);
    }
  };

  // Use curriculum difficulties as base (not raw skill ratings)
  addQuestions("mental-math", mentalCount, curriculum.mentalDiff);
  addQuestions("operations", opCount, curriculum.opsDiff);
  addQuestions("problems", probCount, curriculum.probDiff);
  addQuestions("brain-training", logicCount, curriculum.logicDiff);
  const dailyStandards = getStandardsForDay(curriculumDayIndex);
  for (let index = 0; index < curriculumCount; index += 1) {
    const troubledStandards = dailyStandards.filter((standard) => troubled.includes(standard.skill));
    const pool = troubledStandards.length > 0 && index === 0 ? troubledStandards : dailyStandards;
    const standard = pool[(curriculumDayIndex * curriculumCount + index) % pool.length];
    const question = generateCurriculumQuestion(
      standard.grade,
      standard.code,
      Math.max(1, Math.round((curriculum.opsDiff + curriculum.logicDiff) / 2)),
      rng,
      signatures
    );
    signatures.delete(question.signature);
    signatures.add(question.signature);
    questions.push(question);
  }

  if (customQuestions.length > 0) {
    const custom = customQuestions[rng.range(0, customQuestions.length - 1)];
    const replaceIndex = questions.findIndex((question) => question.category === custom.category);
    if (replaceIndex >= 0) {
      questions[replaceIndex] = {
        ...custom,
        id: `${custom.id}_${date}`,
        explanation: custom.explanation.length > 0
          ? custom.explanation
          : [`Doğru cevap ${String(custom.answer)}. Bu adımı birlikte tekrar inceleyebiliriz.`],
      };
    }
  }

  return {
    curriculumDay: curriculumDayIndex,
    id: `session_${profile.id}_${date}`,
    date,
    userId: profile.id,
    targetMinutes: target,
    estimatedMinutes: target,
    questions: questions.map((question, index) => ({ ...question, id: `daily_${profile.id}_${date}_${index}` })),
    currentQuestionIndex: 0,
    completedQuestionIds: [],
    correctCount: 0,
    wrongCount: 0,
    earnedXp: 0,
    status: "not_started",
    startedAt: undefined,
    completedAt: null,
  };
}
