import { UserProfile, DailySession, Attempt } from "@/lib/questions/types";
import { getIstanbulDateString, calculateStreakUpdate } from "@/lib/adaptive/streak";
import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { generateDailySession } from "@/lib/daily-session/generator";
import { db } from "./client";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORAGE_KEY_PROFILE = "arel_math_profile_v1";
const STORAGE_KEY_SESSIONS = "arel_math_sessions_v1";
const STORAGE_KEY_ATTEMPTS = "arel_math_attempts_v1";

export const DEFAULT_AREL_PROFILE: UserProfile = {
  id: "arel_deniz",
  displayName: "Arel Deniz",
  grade: 4,
  xp: 1240,
  level: 8,
  currentStreak: 7,
  bestStreak: 12,
  lastActiveDate: getIstanbulDateString(),
  targetMinutes: 12,
  badgesUnlocked: ["first_step", "streak_7", "mental_master", "speed_processor"],
  skillRatings: {
    "mental.addition": 4,
    "mental.subtraction": 3,
    "operations.addition": 5,
    "operations.subtraction": 4,
    "operations.multiplication": 4,
    "operations.division": 3,
    "problem.addition": 4,
    "logic.pyramid": 4,
    "logic.missingNumber": 3,
  },
  skillStats: {
    "mental.addition": { attempts: 64, correct: 58, wrong: 6, accuracy: 91, level: 4 },
    "mental.subtraction": { attempts: 45, correct: 38, wrong: 7, accuracy: 84, level: 3 },
    "operations.addition": { attempts: 52, correct: 48, wrong: 4, accuracy: 92, level: 5 },
    "operations.multiplication": { attempts: 40, correct: 31, wrong: 9, accuracy: 78, level: 4 },
    "operations.division": { attempts: 35, correct: 25, wrong: 10, accuracy: 71, level: 3 },
    "problem.addition": { attempts: 28, correct: 24, wrong: 4, accuracy: 86, level: 4 },
  },
  subjectWeights: {
    addition: "normal",
    subtraction: "normal",
    multiplication: "high",
    division: "normal",
    problems: "high",
  },
  parentPin: "1907", // Default parent PIN (subtle Fenerbahçe founding year tribute or 1234)
  tomorrowSpecialTask: null,
};

export class AppStorage {
  static getProfile(): UserProfile {
    if (typeof window === "undefined") return DEFAULT_AREL_PROFILE;
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) {
      this.saveProfile(DEFAULT_AREL_PROFILE);
      return DEFAULT_AREL_PROFILE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_AREL_PROFILE;
    }
  }

  static saveProfile(profile: UserProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));

    // Async sync to Firestore if configured
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

    // Generate new deterministic session for this date
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

  static saveAttempt(attempt: Attempt): void {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS) || "[]";
    let attempts: Attempt[] = [];
    try {
      attempts = JSON.parse(raw);
    } catch {}
    attempts.push(attempt);
    // Keep last 300 attempts
    if (attempts.length > 300) attempts = attempts.slice(-300);
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
}
