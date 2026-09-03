import { UserProfile, DailySession, Attempt, Question } from "@/lib/questions/types";
import { getIstanbulDateString, calculateStreakUpdate } from "@/lib/adaptive/streak";
import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { generateDailySession } from "@/lib/daily-session/generator";
import { db } from "./client";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

const STORAGE_KEY_PROFILE = "arel_math_profile_v1";
const STORAGE_KEY_STUDENTS = "arel_math_students_list_v1";
const STORAGE_KEY_SESSIONS = "arel_math_sessions_v1";
const STORAGE_KEY_ATTEMPTS = "arel_math_attempts_v1";
const STORAGE_KEY_CUSTOM_QUESTIONS = "arel_math_custom_questions_v1";
const FRESH_START_MIGRATION_KEY = "arel_math_fresh_start_v1";

// Fresh clean profile for Arel starting from scratch (0 XP, Level 1, 0 Streak)
export const FRESH_AREL_PROFILE: UserProfile = {
  id: "arel_deniz",
  displayName: "Arel Deniz",
  email: "areldenizyuksel@icloud.com",
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
  tomorrowSpecialTask: null,
  completedSessions: 0,
  startDate: undefined,
  curriculumDayOverride: null,
};

export const DEFAULT_AREL_PROFILE = FRESH_AREL_PROFILE;

export class AppStorage {
  /** Get currently active student profile */
  static getProfile(): UserProfile {
    if (typeof window === "undefined") return FRESH_AREL_PROFILE;

    this.ensureFreshArelStart();
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

  private static ensureFreshArelStart(): void {
    if (localStorage.getItem(FRESH_START_MIGRATION_KEY)) return;

    localStorage.setItem(FRESH_START_MIGRATION_KEY, "1");

    try {
      const rawProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
      const profile = rawProfile ? (JSON.parse(rawProfile) as UserProfile) : null;
      if (!profile || profile.id === FRESH_AREL_PROFILE.id) {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(FRESH_AREL_PROFILE));
      }

      const rawStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
      const students = rawStudents ? (JSON.parse(rawStudents) as UserProfile[]) : [];
      const hasArel = students.some((student) => student.id === FRESH_AREL_PROFILE.id);
      const nextStudents = hasArel
        ? students.map((student) =>
            student.id === FRESH_AREL_PROFILE.id ? FRESH_AREL_PROFILE : student
          )
        : [FRESH_AREL_PROFILE, ...students];
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(nextStudents));
    } catch {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(FRESH_AREL_PROFILE));
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify([FRESH_AREL_PROFILE]));
    }

    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${STORAGE_KEY_SESSIONS}_`))
      .forEach((key) => localStorage.removeItem(key));
  }

  /** Save active student profile and keep students list in sync */
  static saveProfile(profile: UserProfile): void {
    if (typeof window === "undefined") return;

    const currentRaw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (currentRaw) {
      try {
        const current = JSON.parse(currentRaw) as UserProfile;
        if (current.targetMinutes !== profile.targetMinutes) {
          localStorage.removeItem(`${STORAGE_KEY_SESSIONS}_${getIstanbulDateString()}`);
        }
      } catch {}
    }

    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));

    // Also update in students list
    try {
      const rawList = localStorage.getItem(STORAGE_KEY_STUDENTS);
      let list: UserProfile[] = rawList ? JSON.parse(rawList) : [FRESH_AREL_PROFILE];
      const idx = list.findIndex((s) => s.id === profile.id);
      if (idx >= 0) {
        list[idx] = profile;
      } else {
        list.push(profile);
      }
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(list));
    } catch {}

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

  /** Reset student profile to 0 XP */
  static resetArelProfile(): UserProfile {
    const current = this.getProfile();
    const fresh: UserProfile = {
      ...current,
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      completedSessions: 0,
      badgesUnlocked: [],
      lastActiveDate: getIstanbulDateString(),
    };
    this.saveProfile(fresh);
    if (typeof window !== "undefined") {
      const today = getIstanbulDateString();
      localStorage.removeItem(`${STORAGE_KEY_SESSIONS}_${today}`);
      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    }
    return fresh;
  }

  /** List all registered students */
  static getStudents(): UserProfile[] {
    if (typeof window === "undefined") return [FRESH_AREL_PROFILE];
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (!raw) {
      const initial = [this.getProfile()];
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initial));
      return initial;
    }
    try {
      const list: UserProfile[] = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) {
        const initial = [this.getProfile()];
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(initial));
        return initial;
      }
      return list;
    } catch {
      return [FRESH_AREL_PROFILE];
    }
  }

  /** Save / update a student profile in the list */
  static saveStudent(student: UserProfile): void {
    if (typeof window === "undefined") return;
    const list = this.getStudents();
    const idx = list.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.push(student);
    }
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(list));

    const currentActive = this.getProfile();
    if (currentActive.id === student.id) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(student));
    }

    if (db) {
      try {
        const userRef = doc(db, "users", student.id);
        setDoc(userRef, student, { merge: true }).catch((err) => {
          console.warn("Firestore saveStudent notice:", err);
        });
      } catch {}
    }
  }

  /** Add a brand new student */
  static addStudent(student: UserProfile): UserProfile {
    if (typeof window === "undefined") return student;
    const list = this.getStudents();
    const existingIdx = list.findIndex(
      (s) =>
        s.id === student.id ||
        (s.email && student.email && s.email.toLowerCase() === student.email.toLowerCase())
    );
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...student };
    } else {
      list.push(student);
    }
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(list));

    if (db) {
      try {
        const userRef = doc(db, "users", student.id);
        setDoc(userRef, student, { merge: true }).catch((err) => {
          console.warn("Firestore addStudent notice:", err);
        });
      } catch {}
    }
    return student;
  }

  /** Delete a student account */
  static deleteStudent(studentId: string): void {
    if (typeof window === "undefined") return;
    let list = this.getStudents();
    if (list.length <= 1) {
      throw new Error("Sistemde en az bir öğrenci hesabı bulunmalıdır.");
    }
    list = list.filter((s) => s.id !== studentId);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(list));

    const active = this.getProfile();
    if (active.id === studentId && list.length > 0) {
      this.saveProfile(list[0]);
    }

    if (db) {
      try {
        const userRef = doc(db, "users", studentId);
        deleteDoc(userRef).catch(() => {});
      } catch {}
    }
  }

  /** Switch active student */
  static setActiveStudent(studentId: string): UserProfile {
    const list = this.getStudents();
    const target = list.find((s) => s.id === studentId);
    if (target) {
      this.saveProfile(target);
      return target;
    }
    return this.getProfile();
  }

  /** Find student profile by login email */
  static getStudentByEmail(email: string): UserProfile | null {
    const list = this.getStudents();
    return (
      list.find((s) => s.email?.trim().toLowerCase() === email.trim().toLowerCase()) || null
    );
  }

  static createCustomProfile(custom: Partial<UserProfile>): UserProfile {
    const profile: UserProfile = {
      ...FRESH_AREL_PROFILE,
      ...custom,
      id: custom.id || `student_${Date.now()}`,
    };
    this.addStudent(profile);
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
    const current = this.getAttempts();
    current.push(attempt);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(current));

    if (db) {
      try {
        const collRef = collection(db, "attempts");
        addDoc(collRef, attempt).catch((err) => {
          console.warn("Firestore attempt sync notice:", err);
        });
      } catch (err) {
        console.warn("Firestore attempt save skipped:", err);
      }
    }
  }

  static clearAttempts(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    }
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

  static saveCustomQuestion(question: Question): void {
    if (typeof window === "undefined") return;
    const list = this.getCustomQuestions();
    list.unshift(question);
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
