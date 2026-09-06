"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { DailySession, Question } from "@/lib/questions/types";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { getNextUnansweredIndex } from "@/lib/daily-session/progress";
import { generatePracticeSession } from "@/lib/daily-session/generator";
import { calculateQuestionXp } from "@/lib/adaptive/scoring";
import QuestionCard from "./QuestionCard";
import CompletionModal from "./CompletionModal";
import SolutionReview, { AnsweredQuestion } from "./SolutionReview";

export default function TrainingSessionView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const isDailyMode = searchParams.get("mode") === "daily" || !categoryFilter;

  const [session, setSession] = useState<DailySession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [answeredList, setAnsweredList] = useState<AnsweredQuestion[]>([]);
  const [showSolutionReview, setShowSolutionReview] = useState<boolean>(false);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsCompleted(false);
    setCurrentIndex(0);
    setAnsweredList([]);
    setElapsedSeconds(0);
    setShowSolutionReview(false);
    setSession(null);
    setLoadError("");
    void (async () => {
      const daily = isDailyMode
        ? await AppStorage.getDailySession()
        : generatePracticeSession(AppStorage.getProfile(), categoryFilter as Question["category"], 12, AppStorage.getRecentSignatures());
      if (cancelled) return;
      setSession(daily);
      const history = AppStorage.getAttempts();
      setAnsweredList(daily.questions.flatMap((question) => {
        const attempt = history.find((item) => item.questionId === question.id &&
          (item.sessionId === daily.id || (!item.sessionId && item.date === daily.date)));
        return attempt ? [{ question, userAnswer: attempt.userAnswer,
          isCorrect: attempt.correct, responseTimeMs: attempt.responseTimeMs }] : [];
      }));
      const filtered = isDailyMode && categoryFilter
        ? daily.questions.filter((q) => q.category === categoryFilter)
        : daily.questions;
      setQuestions(filtered);
      if (filtered.length === 0) setLoadError("Bu bölümde bugün soru bulunmuyor.");
      const firstUnanswered = getNextUnansweredIndex(filtered, daily);
      if (firstUnanswered !== -1) setCurrentIndex(firstUnanswered);
      else if (filtered.length > 0) setIsCompleted(true);
    })().catch((error) => {
      if (!cancelled) setLoadError(error instanceof Error ? error.message : "Antrenman yüklenemedi.");
    });
    return () => {
      cancelled = true;
    };
  }, [categoryFilter, isDailyMode]);

  // Peaceful timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (session && !isCompleted && document.visibilityState === "visible") setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session, isCompleted]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleAnswer = async (userAnswer: number | string, isCorrect: boolean, responseTimeMs: number) => {
    if (!session || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    const earnedXp = calculateQuestionXp(currentQ.difficulty, isCorrect, responseTimeMs);

    const result = await AppStorage.recordAnswer({
      session,
      question: currentQ,
      questionId: currentQ.id,
      isCorrect,
      userAnswer,
      earnedXp,
      responseTimeMs,
      elapsedSeconds,
    });
    // Track for animated solution review
    setAnsweredList((prev) => {
      const filtered = prev.filter((a) => a.question.id !== currentQ.id);
      return [
        ...filtered,
        {
          question: currentQ,
          userAnswer: result.attempt?.userAnswer ?? userAnswer,
          isCorrect: result.attempt?.correct ?? isCorrect,
          responseTimeMs: result.attempt?.responseTimeMs ?? responseTimeMs,
        },
      ];
    });

    setSession(result.session);
  };

  const handleNext = () => {
    if (!session) return;
    const nextIndex = getNextUnansweredIndex(questions, session);
    if (nextIndex >= 0) setCurrentIndex(nextIndex);
    else setIsCompleted(true);
  };

  if (loadError) return <div className="p-8 text-center text-red-600">{loadError} <Link href="/">Ana sayfaya dön</Link></div>;

  if (!session || questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 font-medium">Antrenman yükleniyor...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const reviewed = answeredList.filter((item) => questions.some((question) => question.id === item.question.id));

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto flex flex-col justify-between">
      {/* Top Bar with Peaceful Timer and Exit */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/70">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Vazgeç ve Çık</span>
        </Link>

        {/* Peaceful non-stressful timer */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs text-xs sm:text-sm font-bold text-slate-600">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Main Question Display */}
      <div className="py-6 sm:py-10 flex-1 flex items-center justify-center">
        {currentQ && !isCompleted && (
          <QuestionCard
            key={currentQ.id}
            question={currentQ}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswerSubmit={handleAnswer}
            onNextQuestion={handleNext}
          />
        )}
      </div>

      {/* Completion Modal & Animated Solution Review */}
      {isCompleted && !showSolutionReview && (
        <CompletionModal
          questionCount={questions.length}
          correctCount={reviewed.filter((item) => item.isCorrect).length}
          durationSeconds={reviewed.reduce((total, item) => total + Math.min(180, Math.max(1, item.responseTimeMs / 1000)), 0)}
          earnedXp={reviewed.reduce((total, item) => total + calculateQuestionXp(item.question.difficulty, item.isCorrect, item.responseTimeMs), 0)}
          onClose={() => router.push("/")}
          onReviewSolutions={() => setShowSolutionReview(true)}
        />
      )}

      {showSolutionReview && (
        <SolutionReview
          answeredQuestions={reviewed}
          onClose={() => setShowSolutionReview(false)}
        />
      )}
    </div>
  );
}
