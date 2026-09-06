import { UserProfile, DailySession, Attempt, Question } from "@/lib/questions/types";
import {
  getIstanbulDateString,
  calculateStreakFromCompletedDates,
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
  runTransaction,
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
  gameStats: {},
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
  const gameStats = { ...(remote.gameStats || {}) };
  for (const [gameId, localGame] of Object.entries(local.gameStats || {})) {
    const remoteGame = gameStats[gameId];
    if (!remoteGame) {
      gameStats[gameId] = localGame;
      continue;
    }
    const bestMoves = [remoteGame.bestMoves, localGame.bestMoves]
      .filter((value): value is number => value != null)
      .sort((a, b) => a - b)[0] ?? null;
    gameStats[gameId] = {
      plays: Math.max(remoteGame.plays, localGame.plays),
      completions: Math.max(remoteGame.completions, localGame.completions),
      bestMoves,
      lastPlayedAt: [remoteGame.lastPlayedAt, localGame.lastPlayedAt].sort().at(-1) || "",
    };
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
    gameStats,
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

  static async updateLearningSettings(settings: Pick<UserProfile, "targetMinutes" | "subjectWeights" | "tomorrowSpecialTask" | "tomorrowSpecialTaskDate">): Promise<void> {
    await this.updatePlanSettings(settings);
  }

  private static async updatePlanSettings(settings: Partial<UserProfile>): Promise<void> {
    const profileId = this.getProfile().id;
    const today = getIstanbulDateString();
    const firestore = requireDb();
    const profileRef = doc(firestore, "users", profileId);
    const sessionRef = doc(firestore, "users", profileId, "dailySessions", today);
    const result = await runTransaction(firestore, async (transaction) => {
      const savedProfile = await transaction.get(profileRef);
      const savedSession = await transaction.get(sessionRef);
      if (!savedProfile.exists()) throw new Error("Öğrenci profili bulunamadı.");
      const profile = { ...savedProfile.data() as UserProfile, ...settings };
      const previous = savedSession.exists() ? savedSession.data() as DailySession : null;
      const session = previous && previous.completedQuestionIds.length === 0 && previous.status !== "completed"
        ? generateDailySession({ profile, date: today, customQuestions: customQuestionsCache, recentSignatures: this.getRecentSignatures() })
        : previous;
      transaction.set(profileRef, profile);
      if (session && session !== previous) transaction.set(sessionRef, session);
      return { profile, session };
    });
    if (activeProfile?.id === profileId) {
      activeProfile = result.profile;
      updateStudentCache(result.profile);
      if (result.session) sessionsCache.set(today, result.session);
      notifyProfileUpdated();
    }
  }

  static async recordGameResult(gameId: string, moves: number): Promise<void> {
    const profile = this.getProfile();
    const previous = profile.gameStats?.[gameId];
    const updated: UserProfile = {
      ...profile,
      xp: profile.xp + 15,
      gameStats: {
        ...(profile.gameStats || {}),
        [gameId]: {
          plays: (previous?.plays || 0) + 1,
          completions: (previous?.completions || 0) + 1,
          bestMoves: previous?.bestMoves == null ? moves : Math.min(previous.bestMoves, moves),
          lastPlayedAt: new Date().toISOString(),
        },
      },
    };
    updated.level = calculateLevelInfo(updated.xp).level;
    const newBadges = checkNewUnlockedBadges(updated, undefined, attemptsCache);
    if (newBadges.length > 0) {
      updated.badgesUnlocked = [
        ...(updated.badgesUnlocked || []),
        ...newBadges.map((badge) => badge.id),
      ];
    }
    await this.saveProfile(updated);
    notifyBadgesUnlocked(newBadges);
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
      gameStats: {},
      lastActiveDate: getIstanbulDateString(),
      startDate: undefined,
      curriculumDayOverride: null,
      skillRatings: { ...FRESH_AREL_PROFILE.skillRatings },
    };
    await this.deleteProgress(current.id);
    await this.saveProfile(fresh);
    return fresh;
  }

  static async saveStudent(student: UserProfile): Promise<void> {
    const normalized = { ...student, level: calculateLevelInfo(student.xp).level };
    await setDoc(doc(requireDb(), "users", normalized.id), normalized, { merge: true });
    updateStudentCache(normalized);
    if (activeProfile?.id === student.id) {
      activeProfile = normalized;
      notifyProfileUpdated();
    }
  }

  static async resetStudentProgress(student: UserProfile): Promise<UserProfile> {
    await this.deleteProgress(student.id);
    const fresh: UserProfile = {
      ...student,
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      completedSessions: 0,
      badgesUnlocked: [],
      skillStats: {},
      gameStats: {},
      startDate: undefined,
      curriculumDayOverride: null,
      skillRatings: { ...FRESH_AREL_PROFILE.skillRatings },
      lastActiveDate: getIstanbulDateString(),
    };
    await this.saveStudent(fresh);
    return fresh;
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
    const profile = this.getProfile();
    const ref = doc(requireDb(), "users", profile.id, "dailySessions", dateStr);
    const session = await runTransaction(requireDb(), async (transaction) => {
      const saved = await transaction.get(ref);
      if (saved.exists()) return saved.data() as DailySession;
      const profileSnapshot = await transaction.get(doc(requireDb(), "users", profile.id));
      const newSession = generateDailySession({
        profile: profileSnapshot.exists() ? profileSnapshot.data() as UserProfile : profile,
        date: dateStr,
        customQuestions: customQuestionsCache,
        recentSignatures: this.getRecentSignatures(),
      });
      transaction.set(ref, newSession);
      return newSession;
    });
    if (activeProfile?.id === profile.id) sessionsCache.set(dateStr, session);
    return session;
  }

  static getRecentSignatures(): Set<string> {
    const recent = new Set<string>();
    for (const attempt of attemptsCache.slice(-200)) {
      if (!attempt.signature) continue;
      const signature = attempt.signature.replace(/^(table_\d+x\d+)_\d+$/, "$1");
      recent.delete(signature);
      recent.add(signature);
    }
    return recent;
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
    attemptsCache = attempts.docs.map((item) => item.data() as Attempt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    customQuestionsCache = customQuestions.docs.map((item) => item.data() as Question);
    const completedSessions = Array.from(sessionsCache.values())
      .filter((session) => session.status === "completed")
    const completedDates = completedSessions.map((session) => session.date);
    const recoveredStreak = calculateStreakFromCompletedDates(completedDates);
    const recoveredSkillStats = { ...activeProfile.skillStats };
    for (const skill of new Set(attemptsCache.map((attempt) => attempt.skill))) {
      const skillAttempts = attemptsCache.filter((attempt) => attempt.skill === skill);
      const correct = skillAttempts.filter((attempt) => attempt.correct).length;
      const existing = recoveredSkillStats[skill];
      if (!existing || skillAttempts.length > existing.attempts) {
        recoveredSkillStats[skill] = {
          attempts: skillAttempts.length,
          correct,
          wrong: skillAttempts.length - correct,
          accuracy: skillAttempts.length ? Math.round((correct / skillAttempts.length) * 100) : 0,
          level: existing?.level || activeProfile.skillRatings[skill] || 2,
        };
      }
    }
    const streakNeedsRepair =
      activeProfile.currentStreak !== recoveredStreak.currentStreak ||
      activeProfile.bestStreak < recoveredStreak.bestStreak ||
      (recoveredStreak.lastCompletedDate != null &&
        activeProfile.lastActiveDate !== recoveredStreak.lastCompletedDate);
    const historyNeedsRepair =
      (activeProfile.completedSessions || 0) < completedSessions.length ||
      Object.keys(recoveredSkillStats).some((skill) =>
        recoveredSkillStats[skill].attempts !== activeProfile?.skillStats?.[skill]?.attempts
      );
    if (streakNeedsRepair || historyNeedsRepair) {
      activeProfile = {
        ...activeProfile,
        currentStreak: recoveredStreak.currentStreak,
        bestStreak: Math.max(activeProfile.bestStreak || 0, recoveredStreak.bestStreak),
        lastActiveDate: recoveredStreak.lastCompletedDate || activeProfile.lastActiveDate,
        completedSessions: Math.max(activeProfile.completedSessions || 0, completedSessions.length),
        skillStats: recoveredSkillStats,
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
    if (streakNeedsRepair || historyNeedsRepair || historicalBadges.length > 0) {
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
  }): Promise<{ session: DailySession; profile: UserProfile; attempt: Attempt | null }> {
    const today = getIstanbulDateString();
    const suppliedSession = params.session || (await this.getDailySession(today));
    const profileId = this.getProfile().id;
    if (suppliedSession.userId !== profileId) throw new Error("Öğrenci değişti. Antrenmanı yeniden açın.");
    const isDailySession = suppliedSession.id === `session_${profileId}_${suppliedSession.date}`;
    const firestore = requireDb();
    const profileRef = doc(firestore, "users", profileId);
    const sessionRef = doc(firestore, "users", profileId, "dailySessions", suppliedSession.date);
    const attemptId = `attempt_${suppliedSession.id}_${params.questionId}`;
    const attemptRef = doc(firestore, "users", profileId, "attempts", attemptId);
    const result = await runTransaction(firestore, async (transaction) => {
      const profileSnapshot = await transaction.get(profileRef);
      const savedAttempt = await transaction.get(attemptRef);
      const savedSession = isDailySession ? await transaction.get(sessionRef) : null;
      if (!profileSnapshot.exists()) throw new Error("Öğrenci profili bulunamadı.");
      if (isDailySession && !savedSession?.exists()) throw new Error("Görev sıfırlandı. Antrenmanı yeniden açın.");
      const currentProfile = profileSnapshot.data() as UserProfile;
      const currentSession = savedSession?.exists()
        ? savedSession.data() as DailySession : suppliedSession;
      if (!currentSession.questions.some((question) => question.id === params.questionId && question.signature === params.question.signature)) {
        throw new Error("Bu soru artık görevde bulunmuyor. Antrenmanı yeniden açın.");
      }
      if (savedAttempt.exists() || currentSession.completedQuestionIds.includes(params.questionId)) {
        return { session: currentSession, profile: currentProfile, attempt: savedAttempt.exists() ? savedAttempt.data() as Attempt : null, newBadges: [] };
      }

      const session: DailySession = {
        ...currentSession,
        status: "active",
        startedAt: currentSession.startedAt || new Date().toISOString(),
        completedQuestionIds: [...currentSession.completedQuestionIds, params.questionId],
        correctCount: currentSession.correctCount + (params.isCorrect ? 1 : 0),
        wrongCount: currentSession.wrongCount + (params.isCorrect ? 0 : 1),
        earnedXp: currentSession.earnedXp + params.earnedXp,
        currentQuestionIndex: currentSession.completedQuestionIds.length + 1,
        durationSeconds: Math.round(
          (currentSession.durationSeconds || 0) + Math.min(180, Math.max(1, params.responseTimeMs / 1000))
        ),
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
      if (skillStat.attempts % 5 === 0) {
        const currentRating = profile.skillRatings[params.question.skill] || params.question.difficulty;
        const recentForSkill = attemptsCache
          .filter((attempt) => attempt.skill === params.question.skill)
          .slice(-19)
          .map((attempt) => attempt.correct)
          .concat(params.isCorrect);
        const recentAccuracy = Math.round(
          (recentForSkill.filter(Boolean).length / recentForSkill.length) * 100
        );
        if (recentAccuracy >= 85) {
          profile.skillRatings[params.question.skill] = Math.min(10, currentRating + 1);
        } else if (recentAccuracy < 65) {
          profile.skillRatings[params.question.skill] = Math.max(1, currentRating - 1);
        }
      }
      profile.level = calculateLevelInfo(profile.xp).level;

      if (session.questions.every((question) => session.completedQuestionIds.includes(question.id))) {
        session.status = "completed";
        session.completedAt = new Date().toISOString();
        if (isDailySession && currentSession.status !== "completed") {
          profile.completedSessions = (profile.completedSessions ?? 0) + 1;
          profile.startDate ||= session.date;
          if (profile.curriculumDayOverride != null) {
            profile.curriculumDayOverride = Math.min(200, profile.curriculumDayOverride + 1);
          }
          const streak = calculateStreakFromCompletedDates([
            ...Array.from(sessionsCache.values())
              .filter((item) => item.status === "completed").map((item) => item.date),
            ...Array.from({ length: currentProfile.currentStreak }, (_, index) =>
              new Date(Date.parse(`${currentProfile.lastActiveDate}T12:00:00Z`) - index * 86400000).toISOString().slice(0, 10)
            ),
            session.date,
          ], today);
          profile.currentStreak = streak.currentStreak;
          profile.bestStreak = Math.max(profile.bestStreak, streak.bestStreak);
          profile.lastActiveDate = streak.lastCompletedDate || session.date;
        }
      }

      const attempt: Attempt = {
        id: attemptId,
        sessionId: session.id,
        questionId: params.questionId,
        category: params.question.category,
        skill: params.question.skill,
        difficulty: params.question.difficulty,
        question: params.question.prompt,
        answer: params.question.answer,
        userAnswer: params.userAnswer,
        correct: params.isCorrect,
        responseTimeMs: params.responseTimeMs,
        date: isDailySession ? session.date : today,
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

      transaction.set(profileRef, profile, { merge: true });
      if (isDailySession) transaction.set(sessionRef, session);
      transaction.set(attemptRef, attempt);
      return { session, profile, attempt, newBadges };
    });

    if (activeProfile?.id === profileId) {
      activeProfile = result.profile;
      updateStudentCache(result.profile);
      if (isDailySession) sessionsCache.set(result.session.date, result.session);
      if (result.attempt && !attemptsCache.some((attempt) => attempt.id === result.attempt!.id)) {
        attemptsCache.push(result.attempt);
        attemptsCache.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      }
      notifyProfileUpdated();
      notifyBadgesUnlocked(result.newBadges);
    }
    return { session: result.session, profile: result.profile, attempt: result.attempt };
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
        id: `practice_${this.getProfile().id}_${question.id}`,
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
    await this.updatePlanSettings({ curriculumDayOverride: day == null ? null : Math.max(1, Math.min(200, Math.round(day))) });
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
