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

import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { useAuth } from "@/lib/firebase/authContext";

export default function HomePage() {
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(authProfile);
  const [session, setSession] = useState<DailySession>(AppStorage.getDailySession());
  const [accuracy, setAccuracy] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  useEffect(() => {
    const p = AppStorage.getProfile();
    const s = AppStorage.getDailySession();
    const atts = AppStorage.getAttempts();
    setProfile(p);
    setSession(s);
    setAttemptCount(atts.length);
    if (atts.length > 0) {
      const correct = atts.filter((a) => a.correct).length;
      setAccuracy(Math.round((correct / atts.length) * 100));
    } else {
      setAccuracy(0);
    }
  }, [authProfile]);

  const curriculum = getCurriculumSummary(profile);
  const levelInfo = calculateLevelInfo(profile.xp);
  const completedMins = session.status === "completed"
    ? profile.targetMinutes
    : Math.min(profile.targetMinutes, Math.round(session.completedQuestionIds.length * 0.8));

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

      {/* 3. Four Key Metric Cards Row - 100% Real Live Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Bugünkü Hedef"
          value={`${profile.targetMinutes} dk`}
          subtitle={completedMins > 0 ? `${completedMins} dk tamamlandı` : "Henüz başlanmadı"}
          icon={Clock}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          progressBar={{
            current: completedMins,
            total: profile.targetMinutes,
            color: "bg-emerald-500",
          }}
        />
        <MetricCard
          title="Toplam XP"
          value={profile.xp}
          subtitle={`Sonraki seviye: ${levelInfo.nextLevelXp} XP`}
          icon={Star}
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
        />
        <MetricCard
          title="Doğru Oranı"
          value={attemptCount > 0 ? `%${accuracy}` : "%0"}
          subtitle={attemptCount > 0 ? `${attemptCount} soru çözüldü` : "İlk antrenmanına başla"}
          icon={Target}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Bugünkü Seri"
          value={`${profile.currentStreak} gün`}
          subtitle={profile.bestStreak > 0 ? `En iyi: ${profile.bestStreak} gün` : "Bugün serini başlat!"}
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
