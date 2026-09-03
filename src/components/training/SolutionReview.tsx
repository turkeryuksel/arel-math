"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, Lightbulb, BookOpen, Home, X } from "lucide-react";
import { Question } from "@/lib/questions/types";

export interface AnsweredQuestion {
  question: Question;
  userAnswer: number | string;
  isCorrect: boolean;
  responseTimeMs: number;
}

interface SolutionReviewProps {
  answeredQuestions: AnsweredQuestion[];
  onClose: () => void;
}

/** Animated step reveal for one explanation step */
function StepLine({ text, index }: { text: string; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 420);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`flex items-start gap-2.5 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-black flex-shrink-0">
        {index + 1}
      </span>
      <p className="text-sm font-semibold text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

/** Full solution walkthrough for a single question */
function QuestionSolution({ aq, questionIndex, total }: { aq: AnsweredQuestion; questionIndex: number; total: number }) {
  const [stepsVisible, setStepsVisible] = useState(false);
  const showSolution = aq.question.difficulty >= 4 || !aq.isCorrect;

  useEffect(() => {
    const t = setTimeout(() => setStepsVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const difficultyLabel = aq.question.difficulty <= 3 ? "Kolay" : aq.question.difficulty <= 6 ? "Orta" : "Zor";
  const difficultyColor = aq.question.difficulty <= 3 ? "text-emerald-600 bg-emerald-50" : aq.question.difficulty <= 6 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50";

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">
          Soru {questionIndex + 1} / {total}
        </span>
        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${difficultyColor}`}>
          {difficultyLabel} · Zorluk {aq.question.difficulty}
        </span>
      </div>

      {/* Category label */}
      <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
        {aq.question.categoryTitle}
      </p>

      {/* Question prompt */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-lg font-black text-slate-800 leading-relaxed">{aq.question.prompt}</p>
        {aq.question.subtext && (
          <p className="text-sm text-slate-500 font-medium mt-1">{aq.question.subtext}</p>
        )}
      </div>

      {/* Answer comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`p-3.5 rounded-2xl border text-center ${
            aq.isCorrect
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-rose-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {aq.isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
            <span className="text-[11px] font-bold text-slate-500">Senin Cevabın</span>
          </div>
          <p className={`text-xl font-black ${aq.isCorrect ? "text-emerald-700" : "text-rose-600"}`}>
            {aq.userAnswer === "" || aq.userAnswer === null ? "—" : String(aq.userAnswer)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl border bg-blue-50 border-blue-200 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-bold text-slate-500">Doğru Cevap</span>
          </div>
          <p className="text-xl font-black text-blue-700">
            {String(aq.question.answer)}
          </p>
        </div>
      </div>

      {/* Hint if exists */}
      {aq.question.hint && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-800">{aq.question.hint}</p>
        </div>
      )}

      {/* Step-by-step animated solution */}
      {showSolution && aq.question.explanation && aq.question.explanation.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-indigo-50">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-extrabold text-indigo-700">
              {aq.isCorrect ? "Çözüm Adımları (Pekiştirme)" : "Doğru Çözüm Yolu"}
            </p>
          </div>
          <div className="space-y-3">
            {stepsVisible &&
              aq.question.explanation.map((step, i) => (
                <StepLine key={i} text={step} index={i} />
              ))}
          </div>
        </div>
      )}

      {/* Performance note */}
      <div className="text-center">
        <span className="text-[11px] font-semibold text-slate-400">
          Süre: {(aq.responseTimeMs / 1000).toFixed(1)}s
          {aq.responseTimeMs < 5000 && aq.isCorrect && " ⚡ Hızlı çözdün!"}
        </span>
      </div>
    </div>
  );
}

export default function SolutionReview({ answeredQuestions, onClose }: SolutionReviewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const correctCount = answeredQuestions.filter((a) => a.isCorrect).length;
  const wrongOnes = answeredQuestions.filter((a) => !a.isCorrect);

  // Start from first wrong answer if any
  useEffect(() => {
    if (wrongOnes.length > 0) {
      const firstWrongIdx = answeredQuestions.findIndex((a) => !a.isCorrect);
      setCurrentIdx(firstWrongIdx);
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const current = answeredQuestions[currentIdx];
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === answeredQuestions.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-4xl sm:rounded-4xl w-full sm:max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-800">Çözüm İncelemesi</h2>
            <p className="text-xs text-slate-400 font-medium">
              {correctCount} / {answeredQuestions.length} doğru
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dot navigation */}
            <div className="flex items-center gap-1.5">
              {answeredQuestions.map((aq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentIdx
                      ? "bg-indigo-600 scale-125"
                      : aq.isCorrect
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                  }`}
                  title={`Soru ${i + 1}`}
                />
              ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors ml-1"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5">
          {current && (
            <QuestionSolution
              key={currentIdx}
              aq={current}
              questionIndex={currentIdx}
              total={answeredQuestions.length}
            />
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center gap-3 p-4 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={isFirst}
            className="w-11 h-11 rounded-2xl border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          {isLast ? (
            <Link
              href="/"
              onClick={onClose}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm shadow-blue-300 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIdx((p) => Math.min(answeredQuestions.length - 1, p + 1))}
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Sonraki Soru</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
