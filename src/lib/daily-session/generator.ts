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
}

export function generatePracticeSession(
  profile: UserProfile,
  category: Question["category"],
  count = 12
): DailySession {
  const date = getIstanbulDateString();
  const seed = `${profile.id}_practice_${category}_${Date.now()}_${Math.random()}`;
  const rng = new SeededRandom(seed);
  const signatures = new Set<string>();
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
    signatures.add(question.signature);
    questions.push(question);
  }

  return {
    id: `practice_${profile.id}_${Date.now()}`,
    date,
    userId: profile.id,
    targetMinutes: count,
    estimatedMinutes: Math.max(1, Math.round(count * 0.8)),
    questions,
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
  const { profile, date = getIstanbulDateString(), targetMinutes } = params;
  const target = targetMinutes || profile.targetMinutes || 12;

  // Proportions:
  // For standard 12 min: 5 mental, 5 operations, 3 word problems, 2 logic,
  // 2 official-curriculum discovery questions = 17 questions.
  const scale = target / 12;
  const mentalCount = Math.max(3, Math.round(5 * scale));
  const opCount = Math.max(3, Math.round(5 * scale));
  const probCount = Math.max(2, Math.round(3 * scale));
  const logicCount = Math.max(1, Math.round(2 * scale));
  const curriculumCount = Math.max(1, Math.round(2 * scale));

  // Get curriculum spec for today
  const curriculumDayIndex = getEffectiveCurriculumDay(profile);
  const curriculum: CurriculumDay = getCurriculumDay(curriculumDayIndex);

  const troubled = getTroubledSkills(profile);
  const seedString = `${profile.id}_${date}`;
  const rng = new SeededRandom(seedString);
  const signatures = new Set<string>();
  const questions: Question[] = [];

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

      // Apply performance-based adaptive nudge from skill ratings
      const skillKey = category === "mental-math"
        ? "mental.addition"
        : category === "operations"
        ? "operations.addition"
        : category === "problems"
        ? "problem.addition"
        : "logic.missingNumber";

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
      });
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
    const standard = dailyStandards[(curriculumDayIndex * curriculumCount + index) % dailyStandards.length];
    const question = generateCurriculumQuestion(
      standard.grade,
      standard.code,
      Math.max(1, Math.round((curriculum.opsDiff + curriculum.logicDiff) / 2)),
      rng,
      signatures
    );
    signatures.add(question.signature);
    questions.push(question);
  }

  return {
    id: `session_${profile.id}_${date}`,
    date,
    userId: profile.id,
    targetMinutes: target,
    estimatedMinutes: target,
    questions,
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
