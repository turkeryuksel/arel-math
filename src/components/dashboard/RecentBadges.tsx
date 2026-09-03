"use client";

import Link from "next/link";
import { ALL_BADGES } from "@/data/badges/badgeList";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { useEffect, useState } from "react";
import { Trophy, Lock, Brain, Flame, Zap, Star } from "lucide-react";

export default function RecentBadges() {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const p = AppStorage.getProfile();
    setUnlocked(p.badgesUnlocked || []);
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "brain": return Brain;
      case "flame": return Flame;
      case "zap": return Zap;
      case "star": return Star;
      default: return Trophy;
    }
  };

  // Show unlocked badges or first 3 badges to motivate
  const displayBadges = ALL_BADGES.slice(0, 3);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-800 text-base">Rozetler</h3>
        <Link href="/badges" className="text-xs font-bold text-blue-600 hover:text-blue-700">
          Tümünü Gör →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {displayBadges.map((b) => {
          const isUnlocked = unlocked.includes(b.id);
          const Icon = getIcon(b.icon);

          return (
            <Link href="/badges" key={b.id} className="flex flex-col items-center group cursor-pointer">
              <div
                className="w-14 h-16 sm:w-16 sm:h-18 rounded-2xl flex items-center justify-center relative transform group-hover:scale-105 transition-all"
                style={{
                  background: isUnlocked ? b.gradientStyle.background : "#E2E8F0",
                  boxShadow: isUnlocked ? `0 8px 16px ${b.gradientStyle.shadow}` : "none",
                  clipPath: "polygon(50% 0%, 100% 15%, 100% 80%, 50% 100%, 0% 80%, 0% 15%)",
                }}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/25 flex items-center justify-center">
                  {isUnlocked ? (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
              <span className="mt-2 text-[11px] font-bold text-slate-700 truncate max-w-[80px]">
                {b.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
