"use client";

import { useState } from "react";
import { Lightbulb, Triangle, Hash, ArrowRightLeft, GitFork, Play } from "lucide-react";
import { generateLogicQuestion } from "@/lib/questions/logic";
import { Question } from "@/lib/questions/types";
import QuestionCard from "@/components/training/QuestionCard";
import { AppStorage } from "@/lib/firebase/storageProvider";

export default function BrainTrainingPage() {
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [seenSignatures, setSeenSignatures] = useState<Set<string>>(new Set());

  const startPractice = () => {
    const q = generateLogicQuestion(3, undefined, seenSignatures);
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const handleNext = () => {
    setSolvedCount((prev) => prev + 1);
    const q = generateLogicQuestion(3, undefined, seenSignatures);
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const games = [
    { title: "Sayı Piramidi", desc: "Tabandan tepeye sayı bloklarını topla.", icon: Triangle, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Eksik Sayı", desc: "? + 17 = 43 gibi gizli sayıları keşfet.", icon: Hash, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Hızlı Karşılaştırma", desc: "İki işlemden hangisinin sonucu daha büyük?", icon: ArrowRightLeft, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "İşlem Zinciri", desc: "Adım adım kuralları takip et, sonuca ulaş.", icon: GitFork, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Lightbulb className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Beyin Jimnastiği</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Mantık oyunları, sayı piramitleri ve zihinsel akıl yürütme egzersizleri.
            </p>
          </div>
        </div>
      </div>

      {activeQuestion ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">
              Beyin Jimnastiği (Çözülen: {solvedCount})
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
            onAnswerSubmit={(answer, correct, responseTimeMs) =>
              AppStorage.recordPracticeAnswer(activeQuestion, answer, correct, responseTimeMs)
            }
            onNextQuestion={handleNext}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {games.map((g, i) => {
              const Icon = g.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white border border-slate-100 shadow-soft hover-lift flex items-start gap-4 cursor-pointer"
                  onClick={startPractice}
                >
                  <div className={`w-12 h-12 rounded-2xl ${g.bg} ${g.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{g.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{g.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={startPractice}
            className="w-full min-h-[56px] bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all text-base"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Beyin Jimnastiği Egzersizine Başla</span>
          </button>
        </div>
      )}
    </div>
  );
}
