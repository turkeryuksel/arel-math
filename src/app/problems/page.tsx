"use client";

import { useState } from "react";
import { Puzzle, Sparkles, Play } from "lucide-react";
import { generateWordProblemQuestion } from "@/lib/questions/wordProblems";
import { Question } from "@/lib/questions/types";
import QuestionCard from "@/components/training/QuestionCard";

export default function ProblemsPage() {
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [seenSignatures, setSeenSignatures] = useState<Set<string>>(new Set());
  const [activeTheme, setActiveTheme] = useState<string | undefined>();

  const startPractice = (theme?: string) => {
    setActiveTheme(theme);
    const q = generateWordProblemQuestion(3, undefined, seenSignatures, theme);
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const handleNext = () => {
    setSolvedCount((prev) => prev + 1);
    const q = generateWordProblemQuestion(3, undefined, seenSignatures, activeTheme);
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const themes = [
    { title: "Yüzme ve Spor", desc: "Kulvarlar, turlar, yarışlar ve maç skorları", icon: "🏊‍♂️" },
    { title: "Kitap ve Kütüphane", desc: "Sayfa hesapları, okuma süreleri, raflar", icon: "📚" },
    { title: "Lego ve Oyuncaklar", desc: "Parça birleştirme, kutu adetleri, figürler", icon: "🧱" },
    { title: "Çıkartma Koleksiyonu", desc: "Albüm doldurma, takas, yeni paketler", icon: "🃏" },
    { title: "Kırtasiye ve Okul", desc: "Kalemler, defterler, sıra ve sınıf düzeni", icon: "✏️" },
    { title: "Kumbaram ve Harçlık", desc: "Tasarruf, hedef birikim, alışveriş", icon: "🪙" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Puzzle className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Problemler</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Günlük hayattan eğlenceli ve mantık dolu matematik hikayeleri.
            </p>
          </div>
        </div>
      </div>

      {activeQuestion ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl">
              Problem Çözümü (Çözülen: {solvedCount})
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
            totalQuestions={solvedCount + 4}
            onAnswerSubmit={() => {}}
            onNextQuestion={handleNext}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map((theme, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft hover-lift space-y-2 cursor-pointer"
                onClick={() => startPractice(theme.title)}
              >
                <div className="text-3xl">{theme.icon}</div>
                <h3 className="font-extrabold text-slate-800 text-base">{theme.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{theme.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => startPractice()}
            className="w-full min-h-[56px] bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all text-base"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Rastgele Problem Çözmeye Başla</span>
          </button>
        </div>
      )}
    </div>
  );
}
