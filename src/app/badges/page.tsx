"use client";

import { useEffect, useState } from "react";
import { ALL_BADGES } from "@/data/badges/badgeList";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile } from "@/lib/questions/types";
import { Trophy, Lock, Brain, Flame, Zap, Calculator, Puzzle, Target, Star } from "lucide-react";

export default function BadgesPage() {
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());

  useEffect(() => {
    setProfile(AppStorage.getProfile());
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "brain": return Brain;
      case "flame": return Flame;
      case "zap": return Zap;
      case "calculator": return Calculator;
      case "puzzle": return Puzzle;
      case "target": return Target;
      case "star": return Star;
      default: return Trophy;
    }
  };

  const unlockedSet = new Set(profile.badgesUnlocked || []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Trophy className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Kazanılan Rozetler
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {unlockedSet.size} / {ALL_BADGES.length} rozet tamamlandı. Matematik yolculuğunda yeni rozetlerin kilidini aç!
            </p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ALL_BADGES.map((b) => {
          const isUnlocked = unlockedSet.has(b.id);
          const Icon = getIcon(b.icon);

          return (
            <div
              key={b.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col items-center text-center justify-between ${
                isUnlocked
                  ? "bg-white border-slate-100 shadow-soft hover-lift"
                  : "bg-slate-50/70 border-slate-200/60 opacity-60"
              }`}
            >
              {/* Badge Shield */}
              <div
                className={`w-16 h-20 rounded-2xl flex items-center justify-center shadow-md relative transition-transform ${
                  isUnlocked
                    ? `bg-gradient-to-tr ${b.bgGradient} text-white`
                    : "bg-slate-200 text-slate-400"
                }`}
                style={{
                  clipPath: "polygon(50% 0%, 100% 15%, 100% 80%, 50% 100%, 0% 80%, 0% 15%)",
                }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {isUnlocked ? (
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              <div className="my-3">
                <h3 className="font-extrabold text-slate-800 text-base">{b.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{b.description}</p>
              </div>

              <div className="w-full pt-3 border-t border-slate-100/80">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                    isUnlocked
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isUnlocked ? "Kazanıldı" : b.requirement}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
