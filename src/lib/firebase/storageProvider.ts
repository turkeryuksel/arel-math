import { UserProfile, DailySession, Attempt, Question } from "@/lib/questions/types";
import {
  getIstanbulDateString,
  calculateStreakFromCompletedDates,
  calculateStreakUpdate,
} from "@/lib/adaptive/streak";
import { calculateLevelInfo, calculateQuestionXp } from "@/lib/adaptive/scoring";
import { generateDailySession } from "@/lib/daily-session/generator";
import { checkNewUnlockedBadges } from "@/lib/adaptive/badges";
import { BadgeDefinition } from "@/data/badges/badgeList";
import { db } from "./client";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

// Firestore is the only persistent store. These values are only an in-memory
// view used by React after authentication and disappear when the page closes.
let activeProfile: UserProfile | null = null;
let studentsCache: UserProfile[] = [];
let sessionsCache = new Map<string, DailySession>();
let attemptsCache: Attempt[] = [];
let customQuestionsCache: Question[] = [];
let pendingBadgeCelebrations: BadgeDefinition[] = [];

const LEGACY_PROFILE_KEY = "arel_math_profile_v1";
const LEGACY_STUDENTS_KEY = "arel_math_students_list_v1";
const LEGACY_SESSIONS_PREFIX = "arel_math_sessions_v1_";
const LEGACY_ATTEMPTS_KEY = "arel_math_attempts_v1";
const LEGACY_CUSTOM_QUESTIONS_KEY = "arel_math_custom_questions_v1";

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

function requireDb() {
  if (!db) throw new Error("Firebase yapılandırması bulunamadı. İşlem kaydedilemedi.");
  return db;
}

function updateStudentCache(profile: UserProfile) {
  const index = studentsCache.findIndex((student) => student.id === profile.id);
  if (index >= 0) studentsCache[index] = profile;
  else studentsCache.push(profile);
}

function notifyProfileUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("arel-profile-updated"));
  }
}

function notifyBadgesUnlocked(badges: BadgeDefinition[]) {
  if (typeof window !== "undefined" && badges.length > 0) {
    pendingBadgeCelebrations = badges;
    window.dispatchEvent(new CustomEvent("arel-badges-unlocked", { detail: badges }));
  }
}

function parseLegacy<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function mergeProfilesForMigration(
  remote: UserProfile | null,
  local: UserProfile
): UserProfile {
  if (!remote) return local;
  const earliestStart = [remote.startDate, local.startDate].filter(Boolean).sort()[0];
  const latestActive =
    [remote.lastActiveDate, local.lastActiveDate].filter(Boolean).sort().at(-1) ||
    getIstanbulDateString();
  const xp = Math.max(remote.xp || 0, local.xp || 0);
  const skillRatings = { ...remote.skillRatings };
  for (const [skill, rating] of Object.entries(local.skillRatings || {})) {
    skillRatings[skill] = Math.max(skillRatings[skill] || 1, rating);
  }
  const skillStats = { ...remote.skillStats };
  for (const [skill, stats] of Object.entries(local.skillStats || {})) {
    const remoteStats = skillStats[skill];
    if (!remoteStats || stats.attempts > remoteStats.attempts) skillStats[skill] = stats;
  }
  return {
    ...local,
    ...remote,
    xp,
    level: calculateLevelInfo(xp).level,
    currentStreak: Math.max(remote.currentStreak || 0, local.currentStreak || 0),
    bestStreak: Math.max(remote.bestStreak || 0, local.bestStreak || 0),
    completedSessions: Math.max(remote.completedSessions || 0, local.completedSessions || 0),
    badgesUnlocked: Array.from(
      new Set([...(remote.badgesUnlocked || []), ...(local.badgesUnlocked || [])])
    ),
    skillRatings,
    skillStats,
    startDate: earliestStart,
    lastActiveDate: latestActive,
  };
}

export function mergeSessionsForMigration(a: DailySession, b: DailySession): DailySession {
  const base = a.completedQuestionIds.length >= b.completedQuestionIds.length ? a : b;
  const completedQuestionIds = Array.from(
    new Set([...a.completedQuestionIds, ...b.completedQuestionIds])
  );
  const questions = Array.from(
    new Map([...a.questions, ...b.questions].map((question) => [question.id, question])).values()
  );
  const isCompleted =
    a.status === "completed" ||
    b.status === "completed" ||
    completedQuestionIds.length >= questions.length;
  return {
    ...base,
    questions,
    completedQuestionIds,
    currentQuestionIndex: completedQuestionIds.length,
    correctCount: Math.max(a.correctCount, b.correctCount),
    wrongCount: Math.max(a.wrongCount, b.wrongCount),
    earnedXp: Math.max(a.earnedXp, b.earnedXp),
    durationSeconds: Math.max(a.durationSeconds || 0, b.durationSeconds || 0),
    status: isCompleted ? "completed" : base.status,
    completedAt: [a.completedAt, b.completedAt].filter(Boolean).sort().at(-1) || null,
  };
}

async function deleteDocuments(paths: Array<{ collectionPath: string; id: string }>) {
  const firestore = requireDb();
  for (let start = 0; start < paths.length; start += 450) {
    const batch = writeBatch(firestore);
    for (const item of paths.slice(start, start + 450)) {
      batch.delete(doc(firestore, item.collectionPath, item.id));
    }
    await batch.commit();
  }
}

export class AppStorage {
  static getProfile(): UserProfile {
    return activeProfile || FRESH_AREL_PROFILE;
  }

  static getStudents(): UserProfile[] {
    return [...studentsCache];
  }

  static async loadStudentsFromFirestore(): Promise<UserProfile[]> {
    const snapshot = await getDocs(collection(requireDb(), "users"));
    studentsCache = snapshot.docs.map((item) => item.data() as UserProfile);
    return this.getStudents();
  }

  static async saveProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(requireDb(), "users", profile.id), profile, { merge: true });
    activeProfile = profile;
    updateStudentCache(profile);
    notifyProfileUpdated();
  }

  static async resetArelProfile(): Promise<UserProfile> {
    const current = this.getProfile();
    const fresh: UserProfile = {
      ...current,
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      completedSessions: 0,
      badgesUnlocked: [],
      skillStats: {},
      lastActiveDate: getIstanbulDateString(),
      startDate: undefined,
    };
    await this.deleteProgress(current.id);
    await this.saveProfile(fresh);
    return fresh;
  }

  static async saveStudent(student: UserProfile): Promise<void> {
    await setDoc(doc(requireDb(), "users", student.id), student, { merge: true });
    updateStudentCache(student);
    if (activeProfile?.id === student.id) {
      activeProfile = student;
      notifyProfileUpdated();
    }
  }

  static async addStudent(student: UserProfile): Promise<UserProfile> {
    await this.saveStudent(student);
    return student;
  }

  static async deleteStudent(studentId: string): Promise<void> {
    if (studentsCache.length <= 1) {
      throw new Error("Sistemde en az bir öğrenci hesabı bulunmalıdır.");
    }
    await this.deleteProgress(studentId);
    await deleteDoc(doc(requireDb(), "users", studentId));
    studentsCache = studentsCache.filter((student) => student.id !== studentId);
    if (activeProfile?.id === studentId && studentsCache.length > 0) {
      await this.setActiveStudent(studentsCache[0].id);
    }
  }

  static async setActiveStudent(studentId: string): Promise<UserProfile> {
    await this.hydrateFromFirestore(studentId);
    return this.getProfile();
  }

  static getStudentByEmail(email: string): UserProfile | null {
    return (
      studentsCache.find(
        (student) => student.email?.trim().toLowerCase() === email.trim().toLowerCase()
      ) || null
    );
  }

  static createCustomProfile(custom: Partial<UserProfile>): UserProfile {
    return {
      ...FRESH_AREL_PROFILE,
      ...custom,
      id: custom.id || `student_${Date.now()}`,
      skillRatings: { ...FRESH_AREL_PROFILE.skillRatings, ...custom.skillRatings },
      skillStats: custom.skillStats || {},
      subjectWeights: { ...FRESH_AREL_PROFILE.subjectWeights, ...custom.subjectWeights },
      badgesUnlocked: custom.badgesUnlocked || [],
    };
  }

  static async getDailySession(dateStr: string = getIstanbulDateString()): Promise<DailySession> {
    const existing = sessionsCache.get(dateStr);
    if (existing) return existing;
    const newSession = generateDailySession({ profile: this.getProfile(), date: dateStr });
    await this.saveDailySession(newSession);
    return newSession;
  }

  static async hydrateFromFirestore(
    profileId: string,
    migrateAdminQuestions = false
  ): Promise<void> {
    const firestore = requireDb();
    await this.migrateLegacyData(profileId, migrateAdminQuestions);
    const profileSnapshot = await getDoc(doc(firestore, "users", profileId));
    if (!profileSnapshot.exists()) {
      throw new Error("Firebase üzerinde bu kullanıcıya ait profil bulunamadı.");
    }
    const [sessions, attempts, customQuestions] = await Promise.all([
      getDocs(collection(firestore, "users", profileId, "dailySessions")),
      getDocs(collection(firestore, "users", profileId, "attempts")),
      getDocs(collection(firestore, "customQuestions")),
    ]);
    activeProfile = profileSnapshot.data() as UserProfile;
    updateStudentCache(activeProfile);
    sessionsCache = new Map(
      sessions.docs.map((item) => {
        const session = item.data() as DailySession;
        return [session.date, session];
      })
    );
    attemptsCache = attempts.docs.map((item) => item.data() as Attempt);
    customQuestionsCache = customQuestions.docs.map((item) => item.data() as Question);
    const completedDates = Array.from(sessionsCache.values())
      .filter((session) => session.status === "completed")
      .map((session) => session.date);
    const recoveredStreak = calculateStreakFromCompletedDates(completedDates);
    const streakNeedsRepair =
      activeProfile.currentStreak !== recoveredStreak.currentStreak ||
      activeProfile.bestStreak < recoveredStreak.bestStreak ||
      (recoveredStreak.lastCompletedDate != null &&
        activeProfile.lastActiveDate !== recoveredStreak.lastCompletedDate);
    if (streakNeedsRepair) {
      activeProfile = {
        ...activeProfile,
        currentStreak: recoveredStreak.currentStreak,
        bestStreak: Math.max(activeProfile.bestStreak || 0, recoveredStreak.bestStreak),
        lastActiveDate: recoveredStreak.lastCompletedDate || activeProfile.lastActiveDate,
      };
    }
    const perfectPastSession = Array.from(sessionsCache.values()).find(
      (session) => session.status === "completed" && session.questions.length >= 10 && session.wrongCount === 0
    );
    const historicalBadges = checkNewUnlockedBadges(activeProfile, perfectPastSession, attemptsCache);
    if (historicalBadges.length > 0) {
      activeProfile = {
        ...activeProfile,
        badgesUnlocked: [
          ...(activeProfile.badgesUnlocked || []),
          ...historicalBadges.map((badge) => badge.id),
        ],
      };
      notifyBadgesUnlocked(historicalBadges);
    }
    if (streakNeedsRepair || historicalBadges.length > 0) {
      await setDoc(doc(firestore, "users", profileId), activeProfile, { merge: true });
    }
    updateStudentCache(activeProfile);
    notifyProfileUpdated();
  }

  static consumePendingBadgeCelebrations(): BadgeDefinition[] {
    const pending = pendingBadgeCelebrations;
    pendingBadgeCelebrations = [];
    return pending;
  }

  static async saveDailySession(session: DailySession): Promise<void> {
    await setDoc(
      doc(requireDb(), "users", session.userId, "dailySessions", session.date),
      session,
      { merge: true }
    );
    sessionsCache.set(session.date, session);
  }

  static getAttempts(): Attempt[] {
    return [...attemptsCache];
  }

  static getDailySessions(): DailySession[] {
    return Array.from(sessionsCache.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static async clearAttempts(): Promise<void> {
    const profile = this.getProfile();
    const snapshot = await getDocs(collection(requireDb(), "users", profile.id, "attempts"));
    await deleteDocuments(
      snapshot.docs.map((item) => ({
        collectionPath: `users/${profile.id}/attempts`,
        id: item.id,
      }))
    );
    attemptsCache = [];
  }

  static getCustomQuestions(): Question[] {
    return [...customQuestionsCache];
  }

  static async saveCustomQuestion(question: Question): Promise<void> {
    await setDoc(doc(requireDb(), "customQuestions", question.id), question);
    customQuestionsCache = [question, ...customQuestionsCache.filter((item) => item.id !== question.id)];
  }

  static async deleteCustomQuestion(id: string): Promise<void> {
    await deleteDoc(doc(requireDb(), "customQuestions", id));
    customQuestionsCache = customQuestionsCache.filter((question) => question.id !== id);
  }

  static async recordAnswer(params: {
    session?: DailySession;
    question: Question;
    questionId: string;
    isCorrect: boolean;
    userAnswer: number | string;
    earnedXp: number;
    responseTimeMs: number;
    elapsedSeconds?: number;
  }): Promise<{ session: DailySession; profile: UserProfile }> {
    const today = getIstanbulDateString();
    const currentSession = params.session || (await this.getDailySession(today));
    const currentProfile = this.getProfile();
    if (currentSession.completedQuestionIds.includes(params.questionId)) {
      return { session: currentSession, profile: currentProfile };
    }

    const session: DailySession = {
      ...currentSession,
      completedQuestionIds: [...currentSession.completedQuestionIds, params.questionId],
      correctCount: currentSession.correctCount + (params.isCorrect ? 1 : 0),
      wrongCount: currentSession.wrongCount + (params.isCorrect ? 0 : 1),
      earnedXp: currentSession.earnedXp + params.earnedXp,
      currentQuestionIndex: currentSession.completedQuestionIds.length + 1,
      durationSeconds: params.elapsedSeconds ?? currentSession.durationSeconds,
    };
    const profile: UserProfile = {
      ...currentProfile,
      skillStats: { ...currentProfile.skillStats },
      skillRatings: { ...currentProfile.skillRatings },
      xp: currentProfile.xp + params.earnedXp,
    };
    const previousStat = profile.skillStats[params.question.skill] || {
      attempts: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      level: profile.skillRatings[params.question.skill] || 2,
    };
    const skillStat = {
      ...previousStat,
      attempts: previousStat.attempts + 1,
      correct: previousStat.correct + (params.isCorrect ? 1 : 0),
      wrong: previousStat.wrong + (params.isCorrect ? 0 : 1),
    };
    skillStat.accuracy = Math.round((skillStat.correct / skillStat.attempts) * 100);
    profile.skillStats[params.question.skill] = skillStat;
    if (skillStat.attempts % 10 === 0) {
      const currentRating = profile.skillRatings[params.question.skill] || params.question.difficulty;
      if (skillStat.accuracy >= 85) {
        profile.skillRatings[params.question.skill] = Math.min(10, currentRating + 1);
      } else if (skillStat.accuracy < 60) {
        profile.skillRatings[params.question.skill] = Math.max(1, currentRating - 1);
      }
    }
    profile.level = calculateLevelInfo(profile.xp).level;

    const isDailySession = session.id === `session_${profile.id}_${today}`;
    if (session.completedQuestionIds.length >= session.questions.length) {
      session.status = "completed";
      session.completedAt = new Date().toISOString();
      if (isDailySession) {
        profile.completedSessions = (profile.completedSessions ?? 0) + 1;
        profile.startDate ||= today;
        const streak = calculateStreakUpdate(
          profile.lastActiveDate,
          profile.currentStreak,
          profile.bestStreak,
          today
        );
        profile.currentStreak = streak.newStreak;
        profile.bestStreak = streak.newBest;
        profile.lastActiveDate = today;
      }
    }

    const attempt: Attempt = {
      id: `attempt_${Date.now()}_${params.questionId}`,
      questionId: params.questionId,
      category: params.question.category,
      skill: params.question.skill,
      difficulty: params.question.difficulty,
      question: params.question.prompt,
      answer: params.question.answer,
      userAnswer: params.userAnswer,
      correct: params.isCorrect,
      responseTimeMs: params.responseTimeMs,
      date: today,
      createdAt: new Date().toISOString(),
      signature: params.question.signature,
    };
    const newBadges = checkNewUnlockedBadges(
      profile,
      isDailySession && session.status === "completed" ? session : undefined,
      [...attemptsCache, attempt]
    );
    if (newBadges.length > 0) {
      profile.badgesUnlocked = [
        ...(profile.badgesUnlocked || []),
        ...newBadges.map((badge) => badge.id),
      ];
    }

    const firestore = requireDb();
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, "users", profile.id), profile, { merge: true });
    if (isDailySession) {
      batch.set(doc(firestore, "users", profile.id, "dailySessions", session.date), session, {
        merge: true,
      });
    }
    batch.set(doc(firestore, "users", profile.id, "attempts", attempt.id), attempt);
    await batch.commit();

    activeProfile = profile;
    updateStudentCache(profile);
    if (isDailySession) sessionsCache.set(session.date, session);
    attemptsCache.push(attempt);
    notifyProfileUpdated();
    notifyBadgesUnlocked(newBadges);
    return { session, profile };
  }

  static async recordPracticeAnswer(
    question: Question,
    userAnswer: number | string,
    isCorrect: boolean,
    responseTimeMs: number
  ): Promise<void> {
    const today = getIstanbulDateString();
    await this.recordAnswer({
      session: {
        id: `practice_${this.getProfile().id}_${Date.now()}`,
        date: today,
        userId: this.getProfile().id,
        targetMinutes: 0,
        estimatedMinutes: 0,
        questions: [question],
        currentQuestionIndex: 0,
        completedQuestionIds: [],
        correctCount: 0,
        wrongCount: 0,
        earnedXp: 0,
        status: "active",
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
      question,
      questionId: question.id,
      isCorrect,
      userAnswer,
      earnedXp: calculateQuestionXp(question.difficulty, isCorrect, responseTimeMs),
      responseTimeMs,
    });
  }

  static async setCurriculumDayOverride(day: number | null): Promise<void> {
    await this.saveProfile({ ...this.getProfile(), curriculumDayOverride: day });
  }

  static async incrementCompletedSessions(): Promise<void> {
    const profile = this.getProfile();
    await this.saveProfile({
      ...profile,
      completedSessions: (profile.completedSessions ?? 0) + 1,
      startDate: profile.startDate || getIstanbulDateString(),
    });
  }

  private static async deleteProgress(profileId: string): Promise<void> {
    const firestore = requireDb();
    const [sessions, attempts] = await Promise.all([
      getDocs(collection(firestore, "users", profileId, "dailySessions")),
      getDocs(collection(firestore, "users", profileId, "attempts")),
    ]);
    await deleteDocuments([
      ...sessions.docs.map((item) => ({
        collectionPath: `users/${profileId}/dailySessions`, id: item.id,
      })),
      ...attempts.docs.map((item) => ({
        collectionPath: `users/${profileId}/attempts`, id: item.id,
      })),
    ]);
    if (activeProfile?.id === profileId) {
      sessionsCache.clear();
      attemptsCache = [];
    }
  }

  /** One-time, lossless import from the previous browser-local implementation. */
  private static async migrateLegacyData(
    profileId: string,
    migrateAdminQuestions: boolean
  ): Promise<void> {
    if (typeof window === "undefined") return;
    const localProfile = parseLegacy<UserProfile>(LEGACY_PROFILE_KEY);
    if (!localProfile || localProfile.id !== profileId) return;

    const firestore = requireDb();
    const [remoteProfileSnap, remoteSessionsSnap, remoteAttemptsSnap] = await Promise.all([
      getDoc(doc(firestore, "users", profileId)),
      getDocs(collection(firestore, "users", profileId, "dailySessions")),
      getDocs(collection(firestore, "users", profileId, "attempts")),
    ]);
    const mergedProfile = mergeProfilesForMigration(
      remoteProfileSnap.exists() ? (remoteProfileSnap.data() as UserProfile) : null,
      localProfile
    );

    const mergedSessions = new Map<string, DailySession>();
    remoteSessionsSnap.docs.forEach((item) => {
      const session = item.data() as DailySession;
      mergedSessions.set(session.date, session);
    });
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(LEGACY_SESSIONS_PREFIX))
      .forEach((key) => {
        const session = parseLegacy<DailySession>(key);
        if (!session || session.userId !== profileId) return;
        const remote = mergedSessions.get(session.date);
        mergedSessions.set(session.date, remote ? mergeSessionsForMigration(remote, session) : session);
      });

    const remoteAttemptIds = new Set<string>();
    remoteAttemptsSnap.docs.forEach((item) => {
      const attempt = item.data() as Attempt;
      remoteAttemptIds.add(attempt.id);
    });
    const attemptsToImport = (parseLegacy<Attempt[]>(LEGACY_ATTEMPTS_KEY) || []).filter(
      (attempt) => !remoteAttemptIds.has(attempt.id)
    );

    const localQuestions = migrateAdminQuestions
      ? parseLegacy<Question[]>(LEGACY_CUSTOM_QUESTIONS_KEY) || []
      : [];
    const writes = [
      { path: `users/${profileId}`, id: "", value: mergedProfile },
      ...Array.from(mergedSessions.values()).map((value) => ({
        path: `users/${profileId}/dailySessions`, id: value.date, value,
      })),
      ...attemptsToImport.map((value) => ({
        path: `users/${profileId}/attempts`, id: value.id, value,
      })),
      ...localQuestions.map((value) => ({ path: "customQuestions", id: value.id, value })),
    ];

    for (let start = 0; start < writes.length; start += 450) {
      const batch = writeBatch(firestore);
      for (const item of writes.slice(start, start + 450)) {
        const ref = item.id ? doc(firestore, item.path, item.id) : doc(firestore, item.path);
        batch.set(ref, item.value, { merge: true });
      }
      await batch.commit();
    }

    window.localStorage.removeItem(LEGACY_PROFILE_KEY);
    window.localStorage.removeItem(LEGACY_STUDENTS_KEY);
    window.localStorage.removeItem(LEGACY_ATTEMPTS_KEY);
    window.localStorage.removeItem("arel_math_fresh_start_v2");
    window.localStorage.removeItem("arel_math_auth_session");
    if (migrateAdminQuestions) {
      window.localStorage.removeItem(LEGACY_CUSTOM_QUESTIONS_KEY);
    }
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(LEGACY_SESSIONS_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  }
}
