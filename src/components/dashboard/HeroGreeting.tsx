"use client";

import Image from "next/image";
import { Flame, Star, Shield, Bell } from "lucide-react";
import { UserProfile } from "@/lib/questions/types";

interface HeroGreetingProps {
  profile: UserProfile;
}

export default function HeroGreeting({ profile }: HeroGreetingProps) {
  return (
    <div className="relative bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft overflow-hidden">
      {/* Top right stat badges */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 mb-4 md:mb-0 relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-2xl text-orange-600 font-bold text-xs">
          <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
          <span>{profile.currentStreak}</span>
          <span className="text-[11px] font-medium text-slate-500">Günlük Seri</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 font-bold text-xs">
          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>{profile.xp}</span>
          <span className="text-[11px] font-medium text-slate-500">XP</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 font-bold text-xs">
          <Shield className="w-4 h-4 fill-blue-500 text-blue-500" />
          <span>{profile.level}</span>
          <span className="text-[11px] font-medium text-slate-500">Seviye</span>
        </div>

        <div className="relative p-2 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors border border-slate-100">
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
        <div className="max-w-md z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Merhaba Arel! <span className="animate-wiggle">👋</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium">
            Bugünkü matematik antrenmanın hazır.
          </p>
        </div>

        {/* Hero Arel studying illustration */}
        <div className="relative w-full max-w-xs md:max-w-md h-36 sm:h-44 md:h-48 flex-shrink-0">
          <Image
            src="/illustrations/hero-arel.png"
            alt="Arel Matematik Antrenmanı"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </div>
  );
}
