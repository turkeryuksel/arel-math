export type QuestionCategory =
  | "mental-math"
  | "operations"
  | "problems"
  | "brain-training"
  | "curriculum"
  | "speed-run";

export type SkillId =
  | "mental.addition"
  | "mental.subtraction"
  | "mental.multiplication"
  | "mental.division"
  | "operations.addition"
  | "operations.subtraction"
  | "operations.multiplication"
  | "operations.division"
  | "multiplication.table.2"
  | "multiplication.table.3"
  | "multiplication.table.4"
  | "multiplication.table.5"
  | "multiplication.table.6"
  | "multiplication.table.7"
  | "multiplication.table.8"
  | "multiplication.table.9"
  | "multiplication.table.10"
  | "multiplication.table.11"
  | "multiplication.table.12"
  | "problem.addition"
  | "problem.subtraction"
  | "problem.multiplication"
  | "problem.division"
  | "problem.multiStep"
  | "logic.pyramid"
  | "logic.missingNumber"
  | "logic.sequence"
  | "logic.comparison"
  | "logic.chain"
  | "logic.estimate"
  | "numbers.placeValue"
  | "numbers.rounding"
  | "numbers.parity"
  | "fractions.parts"
  | "fractions.compare"
  | "fractions.operations"
  | "measurement.time"
  | "measurement.lengthMass"
  | "geometry.shapes"
  | "geometry.perimeterArea"
  | "geometry.angles"
  | "geometry.symmetry"
  | "data.reading"
  | "probability.qualitative";

export type QuestionType = "numeric" | "multipleChoice" | "comparison";

export interface Question {
  id: string;
  signature: string;
  category: QuestionCategory;
  categoryTitle: string;
  skill: SkillId;
  difficulty: number; // 1 to 10
  questionType: QuestionType;
  prompt: string;
  subtext?: string;
  answer: number | string;
  choices?: (number | string)[];
  explanation: string[];
  hint?: string;
  metadata?: Record<string, unknown>;
  curriculum?: {
    grade: 3 | 4;
    theme: number;
    themeTitle: string;
    outcomeCode: string;
    outcomeTitle: string;
  };
}

export interface Attempt {
  id: string;
  questionId: string;
  category: QuestionCategory;
  skill: SkillId;
  difficulty: number;
  question: string;
  answer: number | string;
  userAnswer: number | string;
  correct: boolean;
  responseTimeMs: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
  signature?: string;
}

export interface SkillStat {
  attempts: number;
  correct: number;
  wrong: number;
  accuracy: number;
  level: number;
}

export interface DailySession {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  targetMinutes: number;
  estimatedMinutes: number;
  questions: Question[];
  currentQuestionIndex: number;
  completedQuestionIds: string[];
  correctCount: number;
  wrongCount: number;
  earnedXp: number;
  status: "not_started" | "active" | "completed";
  startedAt?: string;
  completedAt?: string | null;
  durationSeconds?: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  grade: number;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  targetMinutes: number;
  badgesUnlocked: string[];
  skillRatings: Record<string, number>;
  skillStats: Record<string, SkillStat>;
  email?: string;
  subjectWeights?: Record<string, "low" | "normal" | "high">;
  tomorrowSpecialTask?: string | null;
  completedSessions: number; // Total completed training sessions (used for curriculum day)
  startDate?: string; // YYYY-MM-DD of first session (informational)
  curriculumDayOverride?: number | null; // Admin can manually set curriculum day
  gameStats?: Record<string, {
    plays: number;
    completions: number;
    bestMoves: number | null;
    lastPlayedAt: string;
  }>;
}
