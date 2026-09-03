"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { CheckCircle2, Trophy, Clock, Star, ArrowRight, X } from "lucide-react";
import Image from "next/image";

interface CompletionModalProps {
  questionCount: number;
  correctCount: number;
  durationSeconds: number;
  earnedXp: number;
  onClose?: () => void;
  onReviewSolutions?: () => void;
}

export default function CompletionModal({
  questionCount,
  correctCount,
  durationSeconds,
  earnedXp,
  onClose,
  onReviewSolutions,
}: CompletionModalProps) {
  const accuracy = questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 100;
  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  useEffect(() => {
    // Fire festive confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
    >
      <div className="bg-white rounded-4xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        {/* Top-right close button */}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            title="Kapat"
            aria-label="Popup'ı kapat"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </Link>
        )}

        {/* Celebration header */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 p-1 shadow-lg shadow-orange-200">
            <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
              <Image
                src="/avatars/arel.png"
                alt="Arel Deniz"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Harikasın Arel! 🎉
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Bugünkü matematik antrenmanın başarıyla tamamlandı.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 text-xs font-bold mb-0.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>Soru & Doğru</span>
            </div>
            <p className="text-xl font-extrabold text-slate-800">
              {correctCount} / {questionCount}
            </p>
            <p className="text-[11px] font-semibold text-blue-600">%{accuracy} Başarı</p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-bold mb-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>Kazanılan XP</span>
            </div>
            <p className="text-xl font-extrabold text-slate-800">+{earnedXp} XP</p>
            <p className="text-[11px] font-semibold text-amber-600">Harika İlerleme</p>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center col-span-2">
            <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Toplam Süre</span>
            </div>
            <p className="text-lg font-extrabold text-slate-800">{minutes} Dakika Odaklanma</p>
          </div>
        </div>

        {/* Review Solutions Button */}
        {onReviewSolutions && (
          <button
            type="button"
            onClick={onReviewSolutions}
            className="mt-5 w-full h-13 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-700 font-black rounded-2xl flex items-center justify-center gap-2 border border-indigo-200 shadow-sm transition-all text-sm"
          >
            <span>Çözüm Yollarını ve Cevapları İncele 🎬</span>
          </button>
        )}

        {/* Action Button */}
        <Link
          href="/"
          className="mt-3 w-full h-13 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all text-base"
        >
          <span>Ana Sayfaya Dön</span>
          <ArrowRight className="w-5 h-5" />
        </Link>

        <p className="text-xs font-semibold text-slate-400 mt-4">
          Yarın yeni bir antrenmanda görüşürüz! 👋
        </p>
      </div>
    </div>
  );
}
