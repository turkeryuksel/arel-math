"use client";

import { useState, useEffect } from "react";
import { Zap, Play, RotateCcw, ArrowRight } from "lucide-react";
import { generateMentalMathQuestion } from "@/lib/questions/mentalMath";
import { Question } from "@/lib/questions/types";
import confetti from "canvas-confetti";
import NumericKeypad from "@/components/training/NumericKeypad";

export default function SpeedRunPage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const startGame = () => {
    setIsPlaying(true);
    setIsFinished(false);
    setTimeLeft(60);
    setScore(0);
    setInputValue("");
    setCurrentQ(generateMentalMathQuestion(2));
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) {
      setIsPlaying(false);
      setIsFinished(true);
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch {}
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleSubmit = () => {
    if (!currentQ || !isPlaying) return;
    if (String(inputValue).trim() === String(currentQ.answer).trim()) {
      setScore((s) => s + 1);
    }
    setInputValue("");
    setCurrentQ(generateMentalMathQuestion(2));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto space-y-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
        <Zap className="w-8 h-8 stroke-[2.2] fill-purple-200" />
      </div>

      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hız Turu ⚡</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          60 saniyede yapabildiğin kadar çok zihinden işlem çöz!
        </p>
      </div>

      {!isPlaying && !isFinished && (
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-soft space-y-6">
          <p className="text-slate-600 text-sm font-medium">
            Hızlı, pratik ve eğlenceli. Hazır olduğunda başla butonuna dokun!
          </p>
          <button
            onClick={startGame}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all text-base"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>60 Saniyelik Hız Turunu Başlat</span>
          </button>
        </div>
      )}

      {isPlaying && currentQ && (
        <div className="bg-white p-6 sm:p-8 rounded-4xl border border-slate-100 shadow-soft space-y-6">
          <div className="flex justify-between items-center text-sm font-black">
            <span className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl">
              Skor: {score} Doğru
            </span>
            <span className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl">
              Kalan: {timeLeft}s
            </span>
          </div>

          <div className="py-4">
            <p className="text-4xl font-black text-slate-800">{currentQ.prompt} = ?</p>
          </div>

          <div className="w-48 mx-auto">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="?"
              className="w-full h-14 text-center text-3xl font-black text-slate-800 bg-slate-50 border-2 border-purple-400 rounded-2xl outline-none"
            />
          </div>

          <NumericKeypad
            onKeyPress={(k) => setInputValue((prev) => prev + k)}
            onDelete={() => setInputValue((prev) => prev.slice(0, -1))}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {isFinished && (
        <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-soft space-y-5 animate-fadeIn">
          <h2 className="text-2xl font-black text-slate-800">Süre Doldu! 🏁</h2>
          <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Toplam Skorun</p>
            <p className="text-5xl font-black text-slate-800 my-2">{score}</p>
            <p className="text-sm font-semibold text-purple-700">60 saniyede harika refleks!</p>
          </div>
          <button
            onClick={startGame}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all text-base"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      )}
    </div>
  );
}
