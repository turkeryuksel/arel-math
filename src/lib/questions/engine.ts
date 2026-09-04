import { Question, QuestionCategory, SkillId } from "./types";
import { SeededRandom } from "./seed";
import { generateMentalMathQuestion } from "./mentalMath";
import { generateOperationQuestion } from "./operations";
import { generateWordProblemQuestion, ProblemSkill } from "./wordProblems";
import { generateLogicQuestion } from "./logic";
import { generateTableQuestion } from "./multiplicationTable";
import { generateCurriculumQuestion } from "./curriculum";
import { STATIC_QUESTION_BANK } from "@/data/questions/bank";

export interface GenerateOptions {
  category?: QuestionCategory;
  difficulty?: number;
  seed?: string | number;
  troubledSkills?: string[];
  recentSignatures?: Set<string>;
  curriculumGrade?: 3 | 4;
  curriculumStandardCode?: string;
  operationType?: "addition" | "subtraction" | "multiplication" | "division";
  problemSkill?: ProblemSkill;
  targetSkill?: SkillId;
}

export function generateQuestion(options: GenerateOptions = {}): Question {
  const {
    category,
    difficulty = 3,
    seed = Math.random(),
    troubledSkills = [],
    recentSignatures = new Set<string>(),
    curriculumGrade = 3,
    curriculumStandardCode,
    operationType,
    problemSkill,
    targetSkill,
  } = options;

  const rng = new SeededRandom(seed);
  let attempts = 0;
  let question: Question;

  do {
    const chosenCategory: QuestionCategory =
      category ||
      rng.pick(["mental-math", "operations", "problems", "brain-training"]);

    // If there is a troubled skill matching multiplication table
    const troubledTable = troubledSkills.find((s) => s.startsWith("multiplication.table."));
    const targetTable = targetSkill?.startsWith("multiplication.table.") ? targetSkill : undefined;
    if ((targetTable || troubledTable) && (chosenCategory === "operations" || chosenCategory === "mental-math") && (Boolean(targetTable) || rng.next() < 0.4)) {
      const tableNum = parseInt((targetTable || troubledTable || "multiplication.table.7").replace("multiplication.table.", ""), 10) || 7;
      question = generateTableQuestion(tableNum, difficulty, rng);
    } else {
      switch (chosenCategory) {
        case "mental-math":
          question = generateMentalMathQuestion(difficulty, rng, recentSignatures);
          if (targetSkill?.startsWith("mental.")) {
            for (let targetAttempt = 0; question.skill !== targetSkill && targetAttempt < 30; targetAttempt += 1) {
              question = generateMentalMathQuestion(difficulty, rng, recentSignatures);
            }
          }
          break;
        case "operations":
          question = generateOperationQuestion(
            targetSkill?.startsWith("operations.")
              ? targetSkill.replace("operations.", "") as typeof operationType
              : operationType,
            difficulty,
            rng,
            recentSignatures
          );
          break;
        case "problems":
          question = generateWordProblemQuestion(
            difficulty,
            rng,
            recentSignatures,
            undefined,
            targetSkill?.startsWith("problem.") ? targetSkill as ProblemSkill : problemSkill
          );
          break;
        case "brain-training":
          question = generateLogicQuestion(difficulty, rng, recentSignatures);
          if (targetSkill?.startsWith("logic.")) {
            for (let targetAttempt = 0; question.skill !== targetSkill && targetAttempt < 30; targetAttempt += 1) {
              question = generateLogicQuestion(difficulty, rng, recentSignatures);
            }
          }
          break;
        case "curriculum":
          question = generateCurriculumQuestion(
            curriculumGrade,
            curriculumStandardCode,
            difficulty,
            rng,
            recentSignatures
          );
          break;
        default:
          question = generateMentalMathQuestion(difficulty, rng, recentSignatures);
      }
    }
    attempts++;
  } while (recentSignatures.has(question.signature) && attempts < 20);

  return question;
}

export function getStaticOrGeneratedQuestion(options: GenerateOptions = {}): Question {
  const rng = new SeededRandom(options.seed || Math.random());
  // 15% chance to pick from curated static bank if category matches
  if (rng.next() < 0.15 && options.category) {
    const matches = STATIC_QUESTION_BANK.filter(
      (q) => q.category === options.category && (!options.difficulty || Math.abs(q.difficulty - options.difficulty) <= 1)
    );
    if (matches.length > 0) {
      return rng.pick(matches);
    }
  }
  return generateQuestion(options);
}
