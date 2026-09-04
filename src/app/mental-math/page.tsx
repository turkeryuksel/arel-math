"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Sparkles, ArrowRight, Play } from "lucide-react";
import { generateMentalMathQuestion } from "@/lib/questions/mentalMath";
import { Question } from "@/lib/questions/types";
import QuestionCard from "@/components/training/QuestionCard";
import { AppStorage } from "@/lib/firebase/storageProvider";

export default function MentalMathPage() {
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(3);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [seenSignatures, setSeenSignatures] = useState<Set<string>>(new Set());

  const startPractice = () => {
    const q = generateMentalMathQuestion(selectedDifficulty, undefined, seenSignatures);
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const handleNext = () => {
    setSolvedCount((prev) => prev + 1);
    const nextQ = generateMentalMathQuestion(selectedDifficulty, undefined, seenSignatures);
    setSeenSignatures((prev) => new Set(prev).add(nextQ.signature));
    setActiveQuestion(nextQ);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Brain className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Zihinden Matematik
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Kalem kağıt kullanmadan pratik stratejilerle zihnini hızlandır.
            </p>
          </div>
        </div>

        <Link
          href="/training?category=mental-math"
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm shadow-emerald-200 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Günlük Zihinden Antrenman</span>
        </Link>
      </div>

      {activeQuestion ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
              Serbest Çalışma Modu (Çözülen: {solvedCount})
            </span>
            <button
              onClick={() => setActiveQuestion(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Modu Kapat
            </button>
          </div>

          <QuestionCard
            question={activeQuestion}
            questionNumber={solvedCount + 1}
            totalQuestions={solvedCount + 5}
            onAnswerSubmit={(answer, correct, responseTimeMs) =>
              AppStorage.recordPracticeAnswer(activeQuestion, answer, correct, responseTimeMs)
            }
            onNextQuestion={handleNext}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Level selector & instant practice card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Seviye Seç ve Başla</h2>

            <div className="grid grid-cols-3 gap-3">
              {[
                { diff: 2, label: "Temel (Seviye 2)", desc: "Temel zihinden işlem yolları" },
                { diff: 4, label: "Orta (Seviye 4)", desc: "Hızlı toplama ve çıkarma" },
                { diff: 6, label: "İleri (Seviye 6)", desc: "Çarpma, bölme ve çok basamaklı işlemler" },
              ].map((lvl) => (
                <button
                  key={lvl.diff}
                  onClick={() => setSelectedDifficulty(lvl.diff)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedDifficulty === lvl.diff
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <p className="font-extrabold text-sm text-slate-800">{lvl.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{lvl.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={startPractice}
              className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all text-base"
            >
              <span>Serbest Zihinden Egzersize Başla</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Arel&apos;e Zihinden Taktikler</span>
            </div>
            <ul className="text-xs space-y-2.5 text-emerald-900/80 font-medium">
              <li>• <strong>Onlar basamağını ayır:</strong> 47 + 28 yerine önce 47 + 20 = 67, sonra + 8 = 75 yap.</li>
              <li>• <strong>100&apos;e tamamla:</strong> 100 - 47 işleminde önce 40 çıkar (60), sonra 7 çıkar (53).</li>
              <li>• <strong>10 ile çarpma:</strong> Yanına bir sıfır eklemeyi unutma! 25 × 10 = 250.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
