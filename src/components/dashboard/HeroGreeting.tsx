"use client";

import Image from "next/image";
import { Flame, Star, Shield } from "lucide-react";
import { UserProfile } from "@/lib/questions/types";

interface HeroGreetingProps {
  profile: UserProfile;
}

export default function HeroGreeting({ profile }: HeroGreetingProps) {
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
            Bugünkü 4. sınıf matematik antrenmanın seni bekliyor. Adım adım, eğlenerek ilerle!
          </p>
        </div>

        {/* Hero Arel studying illustration - clean & uncropped */}
        <div className="relative w-full max-w-sm sm:max-w-md h-40 sm:h-48 md:h-52 flex-shrink-0">
          <Image
            src="/illustrations/hero-arel-clean.png"
            alt="Arel Matematik Antrenmanı"
            fill
            sizes="(max-width: 768px) 100vw, 450px"
            className="object-contain object-right-bottom drop-shadow-xs"
            priority
          />
        </div>
      </div>
    </div>
  );
}
