"use client";

import { useState } from "react";
import { Calculator, Plus, Minus, X, Divide, Play, ArrowRight } from "lucide-react";
import { generateOperationQuestion } from "@/lib/questions/operations";
import { generateTableQuestion } from "@/lib/questions/multiplicationTable";
import { Question } from "@/lib/questions/types";
import QuestionCard from "@/components/training/QuestionCard";
import { AppStorage } from "@/lib/firebase/storageProvider";

export default function OperationsPage() {
  const [selectedOp, setSelectedOp] = useState<"addition" | "subtraction" | "multiplication" | "division">("addition");
  const [selectedLevel, setSelectedLevel] = useState<number>(3);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [seenSignatures, setSeenSignatures] = useState<Set<string>>(new Set());

  const startPractice = () => {
    let q: Question;
    if (selectedTable) {
      q = generateTableQuestion(selectedTable, selectedLevel, undefined, seenSignatures);
    } else {
      q = generateOperationQuestion(selectedOp, selectedLevel, undefined, seenSignatures);
    }
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const handleNext = () => {
    setSolvedCount((prev) => prev + 1);
    let q: Question;
    if (selectedTable) {
      q = generateTableQuestion(selectedTable, selectedLevel, undefined, seenSignatures);
    } else {
      q = generateOperationQuestion(selectedOp, selectedLevel, undefined, seenSignatures);
    }
    setSeenSignatures((prev) => new Set(prev).add(q.signature));
    setActiveQuestion(q);
  };

  const ops = [
    { id: "addition" as const, title: "Toplama", icon: Plus, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "subtraction" as const, title: "Çıkarma", icon: Minus, color: "text-amber-600", bg: "bg-amber-50" },
    { id: "multiplication" as const, title: "Çarpma", icon: X, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "division" as const, title: "Bölme", icon: Divide, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Calculator className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">4 İşlem</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Toplama, çıkarma, çarpma, bölme ve çarpım tablosu antrenmanları.
            </p>
          </div>
        </div>
      </div>

      {activeQuestion ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
              {selectedTable ? `${selectedTable}'ler Çarpım Tablosu` : ops.find(o => o.id === selectedOp)?.title} (Çözülen: {solvedCount})
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
        <div className="space-y-6">
          {/* Operation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ops.map((op) => {
              const Icon = op.icon;
              const isSelected = selectedOp === op.id && !selectedTable;
              return (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedOp(op.id);
                    setSelectedTable(null);
                  }}
                  className={`p-4 rounded-3xl border-2 flex items-center gap-3 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/60 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${op.bg} ${op.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm">{op.title}</span>
                </button>
              );
            })}
          </div>

          {/* Level Selection */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">İşlem Seviyesi</h2>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`h-12 rounded-2xl font-black text-sm transition-all ${
                    selectedLevel === lvl
                      ? "bg-blue-600 text-white shadow-md shadow-blue-300"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  Seviye {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Multiplication Table Practice Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Özel Çarpım Tablosu Antrenmanı
              </h2>
              {selectedTable && (
                <button
                  onClick={() => setSelectedTable(null)}
                  className="text-xs font-bold text-blue-600"
                >
                  Tablo Filtresini Kaldır
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setSelectedTable(num);
                    setSelectedOp("multiplication");
                  }}
                  className={`h-12 rounded-2xl font-black text-sm transition-all ${
                    selectedTable === num
                      ? "bg-amber-500 text-white shadow-md shadow-amber-300 scale-105"
                      : "bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 border border-amber-200"
                  }`}
                >
                  {num}&apos;ler
                </button>
              ))}
            </div>
          </div>

          {/* Big Start Button */}
          <button
            onClick={startPractice}
            className="w-full min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all text-base"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>
              {selectedTable
                ? `${selectedTable}'ler Çarpım Tablosu Antrenmanına Başla`
                : `${ops.find((o) => o.id === selectedOp)?.title} Seviye ${selectedLevel} Egzersizine Başla`}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
