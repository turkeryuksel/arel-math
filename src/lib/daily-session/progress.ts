import { DailySession, Question } from "@/lib/questions/types";

export function getNextUnansweredIndex(questions: Question[], session: DailySession): number {
  const completed = new Set(session.completedQuestionIds);
  return questions.findIndex((question) => !completed.has(question.id));
}
