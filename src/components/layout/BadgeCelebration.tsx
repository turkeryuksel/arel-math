"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Award, X } from "lucide-react";
import { BadgeDefinition } from "@/data/badges/badgeList";
import { AppStorage } from "@/lib/firebase/storageProvider";

export default function BadgeCelebration() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const showBadges = (unlocked: BadgeDefinition[]) => {
      if (unlocked.length === 0) return;
      setBadges(unlocked);
      try {
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.55 } });
      } catch {}
      timer = setTimeout(() => setBadges([]), 7000);
    };
    const handleUnlock = (event: Event) => {
      const unlocked = (event as CustomEvent<BadgeDefinition[]>).detail || [];
      AppStorage.consumePendingBadgeCelebrations();
      showBadges(unlocked);
    };
    window.addEventListener("arel-badges-unlocked", handleUnlock);
    showBadges(AppStorage.consumePendingBadgeCelebrations());
    return () => {
      window.removeEventListener("arel-badges-unlocked", handleUnlock);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (badges.length === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-sm animate-fadeIn md:bottom-6 md:right-6 md:left-auto md:mx-0">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-5 shadow-2xl shadow-amber-900/15">
        <button
          type="button"
          aria-label="Kutlamayı kapat"
          onClick={() => setBadges([])}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-violet-600 text-3xl text-white shadow-lg shadow-amber-200">
            {badges[0].emoji || <Award className="h-6 w-6" />}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-amber-600">Yeni rozet kazandın!</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">
              {badges.map((badge) => badge.title).join(" · ")}
            </h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
              {badges[0].description} Harika ilerliyorsun! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
