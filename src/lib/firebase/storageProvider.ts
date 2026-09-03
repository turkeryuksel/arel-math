import { UserProfile, DailySession, Attempt, Question } from "@/lib/questions/types";
import { getIstanbulDateString, calculateStreakUpdate } from "@/lib/adaptive/streak";
import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { generateDailySession } from "@/lib/daily-session/generator";
import { db } from "./client";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

const STORAGE_KEY_PROFILE = "arel_math_profile_v1";
const STORAGE_KEY_SESSIONS = "arel_math_sessions_v1";
const STORAGE_KEY_ATTEMPTS = "arel_math_attempts_v1";
const STORAGE_KEY_CUSTOM_QUESTIONS = "arel_math_custom_questions_v1";

// Fresh clean profile for Arel starting from scratch (0 XP, Level 1, 0 Streak)
export const FRESH_AREL_PROFILE: UserProfile = {
  id: "arel_deniz",
  displayName: "Arel Deniz",
  grade: 4,
  xp: 0,
  level: 1,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: getIstanbulDateString(),
  targetMinutes: 12,
  badgesUnlocked: [],
  skillRatings: {
    "mental.addition": 2,
    "mental.subtraction": 2,
    "operations.addition": 2,
    "operations.subtraction": 2,
    "operations.multiplication": 2,
    "operations.division": 2,
    "problem.addition": 2,
    "logic.pyramid": 2,
    "logic.missingNumber": 2,
  },
  skillStats: {},
  subjectWeights: {
    addition: "normal",
    subtraction: "normal",
    multiplication: "normal",
    division: "normal",
    problems: "normal",
  },
  parentPin: "1907",
  tomorrowSpecialTask: null,
  completedSessions: 0,
  startDate: undefined,
  curriculumDayOverride: null,
};

export const DEFAULT_AREL_PROFILE = FRESH_AREL_PROFILE;


export class AppStorage {
  static getProfile(): UserProfile {
    if (typeof window === "undefined") return FRESH_AREL_PROFILE;
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) {
      this.saveProfile(FRESH_AREL_PROFILE);
      return FRESH_AREL_PROFILE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return FRESH_AREL_PROFILE;
    }
  }

  static saveProfile(profile: UserProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));

    if (db) {
      try {
        const userRef = doc(db, "users", profile.id);
        setDoc(userRef, profile, { merge: true }).catch((err) => {
          console.warn("Firestore profile sync notice:", err);
        });
      } catch (err) {
        console.warn("Firestore profile save skipped:", err);
      }
    }
  }

  static resetArelProfile(): UserProfile {
    const fresh = { ...FRESH_AREL_PROFILE, lastActiveDate: getIstanbulDateString() };
    this.saveProfile(fresh);
    if (typeof window !== "undefined") {
      // Clear today's sessions and attempts
      const today = getIstanbulDateString();
      localStorage.removeItem(`${STORAGE_KEY_SESSIONS}_${today}`);
      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    }
    return fresh;
  }

  static createCustomProfile(custom: Partial<UserProfile>): UserProfile {
    const profile: UserProfile = {
      ...FRESH_AREL_PROFILE,
      ...custom,
      id: custom.id || "arel_deniz",
    };
    this.saveProfile(profile);
    return profile;
  }

  static getDailySession(dateStr: string = getIstanbulDateString()): DailySession {
    const profile = this.getProfile();
    const storageKey = `${STORAGE_KEY_SESSIONS}_${dateStr}`;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }

    const newSession = generateDailySession({ profile, date: dateStr });
    this.saveDailySession(newSession);
    return newSession;
  }

  static saveDailySession(session: DailySession): void {
    if (typeof window === "undefined") return;
    const storageKey = `${STORAGE_KEY_SESSIONS}_${session.date}`;
    localStorage.setItem(storageKey, JSON.stringify(session));

    if (db) {
      try {
        const sessionRef = doc(db, "users", session.userId, "dailySessions", session.date);
        setDoc(sessionRef, session, { merge: true }).catch((err) => {
          console.warn("Firestore session sync notice:", err);
        });
      } catch (err) {
        console.warn("Firestore session save skipped:", err);
      }
    }
  }

  static getAttempts(): Attempt[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveAttempt(attempt: Attempt): void {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS) || "[]";
    let attempts: Attempt[] = [];
    try {
      attempts = JSON.parse(raw);
    } catch {}
    attempts.push(attempt);
    if (attempts.length > 500) attempts = attempts.slice(-500);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attempts));

    if (db) {
      try {
        const attemptRef = doc(db, "users", "arel_deniz", "attempts", attempt.id);
        setDoc(attemptRef, attempt).catch((err) => {
          console.warn("Firestore attempt sync notice:", err);
        });
      } catch (err) {
        console.warn("Firestore attempt save skipped:", err);
      }
    }
  }

  static clearAttempts(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
  }

  static getCustomQuestions(): Question[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveCustomQuestion(q: Question): void {
    if (typeof window === "undefined") return;
    const list = this.getCustomQuestions();
    list.unshift(q);
    localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(list));
  }

  static deleteCustomQuestion(id: string): void {
    if (typeof window === "undefined") return;
    const list = this.getCustomQuestions().filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(list));
  }

  static recordAnswer(params: {
    questionId: string;
    isCorrect: boolean;
    earnedXp: number;
    responseTimeMs: number;
  }): { session: DailySession; profile: UserProfile } {
    const today = getIstanbulDateString();
    const session = this.getDailySession(today);
    const profile = this.getProfile();

    if (!session.completedQuestionIds.includes(params.questionId)) {
      session.completedQuestionIds.push(params.questionId);
      if (params.isCorrect) {
        session.correctCount += 1;
      } else {
        session.wrongCount += 1;
      }
      session.earnedXp += params.earnedXp;
      session.currentQuestionIndex = session.completedQuestionIds.length;

      // Update profile XP & Level
      profile.xp += params.earnedXp;
      const levelInfo = calculateLevelInfo(profile.xp);
      profile.level = levelInfo.level;

      // Check if session completed
      if (session.completedQuestionIds.length >= session.questions.length) {
        session.status = "completed";
        session.completedAt = new Date().toISOString();

        // Increment curriculum day counter
        profile.completedSessions = (profile.completedSessions ?? 0) + 1;
        if (!profile.startDate) {
          profile.startDate = today;
        }

        // Update streak
        const streakResult = calculateStreakUpdate(
          profile.lastActiveDate,
          profile.currentStreak,
          profile.bestStreak,
          today
        );
        profile.currentStreak = streakResult.newStreak;
        profile.bestStreak = streakResult.newBest;
        profile.lastActiveDate = today;
      }

      this.saveDailySession(session);
      this.saveProfile(profile);
    }

    return { session, profile };
  }

  /** Manually set the curriculum day override (admin use) */
  static setCurriculumDayOverride(day: number | null): void {
    const profile = this.getProfile();
    profile.curriculumDayOverride = day;
    this.saveProfile(profile);
  }

  /** Increment completedSessions manually (e.g., from training page) */
  static incrementCompletedSessions(): void {
    const profile = this.getProfile();
    profile.completedSessions = (profile.completedSessions ?? 0) + 1;
    if (!profile.startDate) {
      profile.startDate = getIstanbulDateString();
    }
    this.saveProfile(profile);
  }
}
