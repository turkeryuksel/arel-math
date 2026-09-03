import { AppStorage } from "@/lib/firebase/storageProvider";
import { Attempt, UserProfile } from "@/lib/questions/types";
import { getIstanbulDateString } from "@/lib/adaptive/streak";

export interface DailyLearningStat {
  date: string;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number;
  minutes: number;
  completed: boolean;
}

export interface LearningAnalytics {
  days: DailyLearningStat[];
  attempts: Attempt[];
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  minutes: number;
  previousAccuracy: number | null;
  topics: Array<{ title: string; attempts: number; accuracy: number; color: string }>;
}

const topicDefinitions = [
  { skill: "mental.addition", title: "Zihinden Toplama", color: "bg-emerald-500" },
  { skill: "mental.subtraction", title: "Zihinden Çıkarma", color: "bg-teal-500" },
  { skill: "operations.addition", title: "4 İşlem Toplama", color: "bg-blue-500" },
  { skill: "operations.subtraction", title: "4 İşlem Çıkarma", color: "bg-indigo-500" },
  { skill: "operations.multiplication", title: "Çarpma ve Çarpım Tablosu", color: "bg-amber-500" },
  { skill: "operations.division", title: "Bölme İşlemleri", color: "bg-rose-500" },
  { skill: "problem.addition", title: "Problemler", color: "bg-orange-500" },
];

function getDayLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

function getDateKeys(days: number): Array<{ date: string; label: string }> {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getTime() - (days - index - 1) * 24 * 60 * 60 * 1000);
    return { date: getIstanbulDateString(date), label: getDayLabel(date) };
  });
}

export function getLearningAnalytics(profile: UserProfile): LearningAnalytics {
  const allAttempts = AppStorage.getAttempts();
  const sessions = AppStorage.getDailySessions();
  const dateKeys = getDateKeys(7);
  const dateSet = new Set(dateKeys.map((item) => item.date));
  const attempts = allAttempts.filter((attempt) => dateSet.has(attempt.date));
  const previousDateSet = new Set(getDateKeys(14).slice(0, 7).map((item) => item.date));
  const previousAttempts = allAttempts.filter((attempt) => previousDateSet.has(attempt.date));

  const days = dateKeys.map(({ date, label }) => {
    const dayAttempts = attempts.filter((attempt) => attempt.date === date);
    const daySession = sessions.find((session) => session.date === date);
    const correct = dayAttempts.filter((attempt) => attempt.correct).length;
    return {
      date,
      label,
      attempts: dayAttempts.length,
      correct,
      accuracy: dayAttempts.length ? Math.round((correct / dayAttempts.length) * 100) : 0,
      minutes: Math.round((daySession?.durationSeconds || 0) / 60),
      completed: daySession?.status === "completed",
    };
  });

  const totalCorrect = attempts.filter((attempt) => attempt.correct).length;
  const previousCorrect = previousAttempts.filter((attempt) => attempt.correct).length;
  const topics = topicDefinitions.map(({ skill, title, color }) => {
    const topicAttempts = attempts.filter((attempt) => attempt.skill === skill);
    const correct = topicAttempts.filter((attempt) => attempt.correct).length;
    return {
      title,
      attempts: topicAttempts.length,
      accuracy: topicAttempts.length ? Math.round((correct / topicAttempts.length) * 100) : 0,
      color,
    };
  });

  return {
    days,
    attempts,
    totalAttempts: attempts.length,
    totalCorrect,
    accuracy: attempts.length ? Math.round((totalCorrect / attempts.length) * 100) : 0,
    minutes: days.reduce((total, day) => total + day.minutes, 0),
    previousAccuracy: previousAttempts.length
      ? Math.round((previousCorrect / previousAttempts.length) * 100)
      : null,
    topics,
  };
}

export function getWeeklyTargetMinutes(profile: UserProfile): number {
  return profile.targetMinutes * 7;
}
