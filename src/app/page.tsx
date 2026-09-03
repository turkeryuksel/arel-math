"use client";

import { useEffect, useState } from "react";
import HeroGreeting from "@/components/dashboard/HeroGreeting";
import MetricCard from "@/components/dashboard/MetricCard";
import DailyTrainingPlan from "@/components/dashboard/DailyTrainingPlan";
import NumberPyramidCard from "@/components/dashboard/NumberPyramidCard";
import WeeklyCalendar from "@/components/dashboard/WeeklyCalendar";
import GrowthSummary from "@/components/dashboard/GrowthSummary";
import RecentBadges from "@/components/dashboard/RecentBadges";
import MotivationalBanner from "@/components/dashboard/MotivationalBanner";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { DailySession, UserProfile } from "@/lib/questions/types";
import { getCurriculumSummary } from "@/lib/curriculum/progress";
import { Clock, Star, Target, Calendar, Map, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [session, setSession] = useState<DailySession>(AppStorage.getDailySession());

  useEffect(() => {
    setProfile(AppStorage.getProfile());
    setSession(AppStorage.getDailySession());
  }, []);

  const curriculum = getCurriculumSummary(profile);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Hero Greeting Banner */}
      <HeroGreeting profile={profile} />

      {/* 2. Curriculum Journey Card */}
      <div
        className="rounded-3xl p-4 sm:p-5 border shadow-sm relative overflow-hidden"
        style={{ borderColor: curriculum.phaseColor + "30", background: curriculum.phaseColor + "0D" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ backgroundColor: curriculum.phaseColor + "20" }}
            >
              <Map className="w-5 h-5" style={{ color: curriculum.phaseColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-lg"
                  style={{ backgroundColor: curriculum.phaseColor + "20", color: curriculum.phaseColor }}
                >
                  Faz {curriculum.phaseNum} / 5 — {curriculum.phaseName}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{curriculum.dayTheme}</p>
              <p className="text-xs text-slate-400 font-medium">
                Toplam: Gün {curriculum.day} / {curriculum.totalDays} · Bu fazda %{curriculum.phasePercent} tamamlandı
              </p>
            </div>
          </div>

          <Link
            href="/stats"
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <span className="hidden sm:inline">Detay</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${curriculum.overallPercent}%`,
                backgroundColor: curriculum.phaseColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
            <span>3. Sınıf Başı</span>
            <span>4. Sınıf Sonu</span>
          </div>
        </div>
      </div>

      {/* 3. Four Key Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Bugünkü Hedef"
          value={`${profile.targetMinutes} dk`}
          subtitle="8 dk tamamlandı"
          icon={Clock}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          progressBar={{ current: 8, total: profile.targetMinutes, color: "bg-emerald-500" }}
        />
        <MetricCard
          title="Toplam XP"
          value={profile.xp}
          subtitle="Sonraki seviye: 160 XP"
          icon={Star}
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
        />
        <MetricCard
          title="Doğru Oranı"
          value="%86"
          subtitle="Son 10 antrenman"
          icon={Target}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Bugünkü Seri"
          value={`${profile.currentStreak} gün`}
          subtitle={`En iyi: ${profile.bestStreak} gün`}
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      {/* 4. Main Split Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Training Plan + Pyramid */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <DailyTrainingPlan session={session} />
          <NumberPyramidCard />
        </div>

        {/* Right Column (5 cols): Calendar, Stats, Badges, Banner */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <WeeklyCalendar />
          <GrowthSummary />
          <RecentBadges />
          <MotivationalBanner />
        </div>
      </div>
    </div>
  );
}
