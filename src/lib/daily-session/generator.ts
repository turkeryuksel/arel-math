import { DailySession, Question, UserProfile } from "@/lib/questions/types";
import { SeededRandom } from "@/lib/questions/seed";
import { generateQuestion } from "@/lib/questions/engine";
import { getTroubledSkills } from "@/lib/adaptive/difficulty";
import { getIstanbulDateString } from "@/lib/adaptive/streak";

export interface GenerateSessionParams {
  profile: UserProfile;
  date?: string;
  targetMinutes?: number;
}

export function generateDailySession(params: GenerateSessionParams): DailySession {
  const { profile, date = getIstanbulDateString(), targetMinutes } = params;
  const target = targetMinutes || profile.targetMinutes || 12;

  // Proportions:
  // For standard 12 min: 6 mental, 6 operations, 3 word problems, 2 logic = 17 questions
  const scale = target / 12;
  const mentalCount = Math.max(3, Math.round(6 * scale));
  const opCount = Math.max(3, Math.round(6 * scale));
  const probCount = Math.max(2, Math.round(3 * scale));
  const logicCount = Math.max(1, Math.round(2 * scale));

  const troubled = getTroubledSkills(profile);
  const seedString = `${profile.id}_${date}`;
  const rng = new SeededRandom(seedString);
  const signatures = new Set<string>();
  const questions: Question[] = [];

  const addQuestions = (category: Question["category"], count: number, baseDiff: number) => {
    for (let i = 0; i < count; i++) {
      // 60% current level, 25% troubled/review (diff - 1), 15% stretch (diff + 1)
      const roll = rng.next();
      let diff = baseDiff;
      if (roll < 0.25) {
        diff = Math.max(1, baseDiff - 1);
      } else if (roll > 0.85) {
        diff = Math.min(10, baseDiff + 1);
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

  const mentalDiff = profile.skillRatings?.["mental.addition"] || 3;
  const opDiff = profile.skillRatings?.["operations.addition"] || 3;
  const probDiff = profile.skillRatings?.["problem.addition"] || 3;
  const logicDiff = profile.skillRatings?.["logic.missingNumber"] || 3;

  addQuestions("mental-math", mentalCount, mentalDiff);
  addQuestions("operations", opCount, opDiff);
  addQuestions("problems", probCount, probDiff);
  addQuestions("brain-training", logicCount, logicDiff);

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
