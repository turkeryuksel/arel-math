import { Question } from "@/lib/questions/types";

export function createGameChoices(question: Question): Array<number | string> {
  if (question.choices && question.choices.length >= 3) return question.choices;
  if (typeof question.answer !== "number") return [question.answer];

  const answer = question.answer;
  const step = Math.max(1, Math.round(Math.abs(answer) * 0.08), question.difficulty);
  const candidates = [answer, answer + step, Math.max(0, answer - step), answer + step * 2];
  const unique = Array.from(new Set(candidates));
  while (unique.length < 4) unique.push(answer + unique.length + step);

  const shift = Math.abs(Math.round(answer)) % unique.length;
  return [...unique.slice(shift), ...unique.slice(0, shift)];
}
