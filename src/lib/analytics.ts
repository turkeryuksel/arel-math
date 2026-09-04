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
  allTimeAttempts: number;
  allTimeCorrect: number;
  allTimeAccuracy: number;
  completedGames: number;
}

const topicDefinitions = [
  { matches: (a: Attempt) => a.skill === "mental.addition", title: "Zihinden Toplama", color: "bg-emerald-500" },
  { matches: (a: Attempt) => a.skill === "mental.subtraction", title: "Zihinden Çıkarma", color: "bg-teal-500" },
  { matches: (a: Attempt) => a.skill === "operations.addition", title: "Toplama", color: "bg-blue-500" },
  { matches: (a: Attempt) => a.skill === "operations.subtraction", title: "Çıkarma", color: "bg-indigo-500" },
  { matches: (a: Attempt) => a.skill.includes("multiplication") || a.skill.includes("table."), title: "Çarpma ve Çarpım Tablosu", color: "bg-amber-500" },
  { matches: (a: Attempt) => a.skill.includes("division"), title: "Bölme İşlemleri", color: "bg-rose-500" },
  { matches: (a: Attempt) => a.category === "problems" || a.skill.startsWith("problem."), title: "Hikâyeli Problemler", color: "bg-orange-500" },
  { matches: (a: Attempt) => a.category === "brain-training" || a.skill.startsWith("logic."), title: "Mantık ve Akıl Yürütme", color: "bg-violet-500" },
  { matches: (a: Attempt) => a.skill.startsWith("numbers."), title: "Sayılar ve Basamaklar", color: "bg-sky-500" },
  { matches: (a: Attempt) => a.skill.startsWith("fractions."), title: "Kesirler", color: "bg-pink-500" },
  { matches: (a: Attempt) => a.skill.startsWith("measurement."), title: "Ölçme", color: "bg-lime-500" },
  { matches: (a: Attempt) => a.skill.startsWith("geometry."), title: "Geometri", color: "bg-fuchsia-500" },
  { matches: (a: Attempt) => a.skill.startsWith("data.") || a.skill.startsWith("probability."), title: "Veri ve Olasılık", color: "bg-cyan-500" },
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
  const topics = topicDefinitions.map(({ matches, title, color }) => {
    const topicAttempts = allAttempts.filter(matches);
    const correct = topicAttempts.filter((attempt) => attempt.correct).length;
    return {
      title,
      attempts: topicAttempts.length,
      accuracy: topicAttempts.length ? Math.round((correct / topicAttempts.length) * 100) : 0,
      color,
    };
  });
  const allTimeCorrect = allAttempts.filter((attempt) => attempt.correct).length;
  const completedGames = Object.values(profile.gameStats || {}).reduce(
    (total, game) => total + game.completions,
    0
  );

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
    allTimeAttempts: allAttempts.length,
    allTimeCorrect,
    allTimeAccuracy: allAttempts.length
      ? Math.round((allTimeCorrect / allAttempts.length) * 100)
      : 0,
    completedGames,
  };
}

export function getWeeklyTargetMinutes(profile: UserProfile): number {
  return profile.targetMinutes * 7;
}
