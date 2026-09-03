"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { DailySession, Question } from "@/lib/questions/types";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { calculateQuestionXp } from "@/lib/adaptive/scoring";
import QuestionCard from "./QuestionCard";
import CompletionModal from "./CompletionModal";
import SolutionReview, { AnsweredQuestion } from "./SolutionReview";

export default function TrainingSessionView() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const [session, setSession] = useState<DailySession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [answeredList, setAnsweredList] = useState<AnsweredQuestion[]>([]);
  const [showSolutionReview, setShowSolutionReview] = useState<boolean>(false);

  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const daily = AppStorage.getDailySession();
    setSession(daily);

    let filtered = daily.questions;
    if (categoryFilter) {
      filtered = daily.questions.filter((q) => q.category === categoryFilter);
    }
    setQuestions(filtered);

    // Find first unanswered question
    const firstUnanswered = filtered.findIndex((q) => !daily.completedQuestionIds.includes(q.id));
    if (firstUnanswered !== -1) {
      setCurrentIndex(firstUnanswered);
    } else if (filtered.length > 0) {
      // All questions in filter already answered
      setIsCompleted(true);
    }
  }, [categoryFilter]);

  // Peaceful timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleAnswer = (userAnswer: number | string, isCorrect: boolean) => {
    if (!session || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    const responseTimeMs = Date.now() - questionStartTimeRef.current;
    const earnedXp = calculateQuestionXp(currentQ.difficulty, isCorrect, responseTimeMs);

    // Track for animated solution review
    setAnsweredList((prev) => {
      const filtered = prev.filter((a) => a.question.id !== currentQ.id);
      return [
        ...filtered,
        {
          question: currentQ,
          userAnswer,
          isCorrect,
          responseTimeMs,
        },
      ];
    });

    const result = AppStorage.recordAnswer({
      question: currentQ,
      questionId: currentQ.id,
      isCorrect,
      userAnswer,
      earnedXp,
      responseTimeMs,
      elapsedSeconds,
    });
    setSession(result.session);
  };

  const handleNext = () => {
    questionStartTimeRef.current = Date.now();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  if (!session || questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 font-medium">Antrenman yükleniyor...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

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
        {currentQ && (
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
          correctCount={session.correctCount}
          durationSeconds={elapsedSeconds}
          earnedXp={session.earnedXp}
          onReviewSolutions={() => setShowSolutionReview(true)}
        />
      )}

      {showSolutionReview && (
        <SolutionReview
          answeredQuestions={
            answeredList.length > 0
              ? answeredList
              : questions.map((q) => ({
                  question: q,
                  userAnswer: q.answer,
                  isCorrect: true,
                  responseTimeMs: 3000,
                }))
          }
          onClose={() => setShowSolutionReview(false)}
        />
      )}
    </div>
  );
}

