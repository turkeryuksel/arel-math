"use client";

import Image from "next/image";
import { Flame, Star, Shield } from "lucide-react";
import { UserProfile } from "@/lib/questions/types";

interface HeroGreetingProps {
  profile: UserProfile;
}

export default function HeroGreeting({ profile }: HeroGreetingProps) {
  const shieldCount = Math.max(0, Math.min(3, profile.streakShieldCount ?? 0));
  const shieldProgress = Math.max(0, Math.min(2, profile.streakShieldProgress ?? 0));
  const nextShieldDays = shieldCount >= 3 ? null : Math.max(1, 3 - shieldProgress);
  return (
    <div className="relative bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft overflow-hidden">
      {/* Top right stat badges */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 mb-2 relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-2xl text-orange-600 font-bold text-xs">
          <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
          <span>{profile.currentStreak} Gün</span>
          <span className="text-[11px] font-medium text-slate-400">Seri</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 font-bold text-xs">
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>{profile.xp}</span>
          <span className="text-[11px] font-medium text-slate-400">XP</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 font-bold text-xs">
          <Shield className="w-4 h-4 fill-blue-500 text-blue-500" />
          <span>Seviye {profile.level}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-lg z-10 py-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Merhaba {profile.displayName || "Arel"}! <span className="animate-wiggle">👋</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
            Bugünkü matematik görevlerin seni bekliyor. Adım adım keşfet, eğlenerek ilerle!
          </p>
        </div>

        {/* Hero Arel studying illustration - clean & uncropped */}
        <div className="relative w-full max-w-sm sm:max-w-md h-40 sm:h-48 md:h-52 flex-shrink-0">
          <Image
            src="/illustrations/hero-arel-clean.png"
            alt="Arel'le Öğreniyorum"
            fill
            sizes="(max-width: 768px) 100vw, 450px"
            className="object-contain object-right-bottom drop-shadow-xs"
            priority
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-4 sm:p-5" aria-label="Seri Kalkanı">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Shield className="h-9 w-9 fill-blue-500 stroke-blue-700" />
              <Star className="absolute h-4 w-4 fill-amber-300 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Seri Kalkanı</p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-800">Serin çalıştıkça güçleniyor</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Bir gün kaçırırsan kalkanın serini korur.</p>
            </div>
          </div>
          <div className="min-w-[190px] rounded-2xl bg-white/80 px-4 py-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1.5" aria-label={`${shieldCount} / 3 Seri Kalkanı`}>
              {[0, 1, 2].map((slot) => <Shield key={slot} className={`h-7 w-7 ${slot < shieldCount ? "fill-blue-500 text-blue-700" : "text-slate-300"}`} />)}
              <span className="ml-1 text-sm font-black text-slate-700">{shieldCount}/3</span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {nextShieldDays === null ? "Kalkanların hazır!" : `${nextShieldDays} gerçek çalışma günü sonra yeni kalkan`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
