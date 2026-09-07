"use client";

import { useEffect, useState } from "react";
import { useIstanbulDate } from "@/lib/hooks/useIstanbulDate";
import { getDailyTargetMinutes } from "@/lib/daily-session/target";
import { getLearningAnalytics } from "@/lib/analytics";
import { calculateStreakFromCompletedDates } from "@/lib/adaptive/streak";
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
import { Clock, Star, Target, Calendar, Map, ChevronRight, Gamepad2, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";

import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { useAuth } from "@/lib/firebase/authContext";

export default function HomePage() {
  const today = useIstanbulDate();
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(authProfile);
  const [session, setSession] = useState<DailySession | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const p = AppStorage.getProfile();
    const atts = AppStorage.getAttempts();
    setProfile(p);
    setLoadError(false);
    void AppStorage.getDailySession().then((s) => {
      if (!cancelled) setSession(s);
    }).catch(() => { if (!cancelled) setLoadError(true); });
    setAttemptCount(atts.length);
    if (atts.length > 0) {
      const correct = atts.filter((a) => a.correct).length;
      setAccuracy(Math.round((correct / atts.length) * 100));
    } else {
      setAccuracy(0);
    }
    return () => {
      cancelled = true;
    };
  }, [authProfile, today]);

  if (loadError) return <div role="alert" className="p-8 text-center">Günlük plan yüklenemedi. <button onClick={() => window.location.reload()}>Tekrar dene</button></div>;

  if (!session) {
    return <div className="p-8 text-center text-slate-500 font-medium">Veriler yükleniyor...</div>;
  }

  const curriculum = getCurriculumSummary({ ...profile, curriculumDayOverride: session.curriculumDay ?? (session.status === "completed" ? Math.max(1, profile.completedSessions) : profile.curriculumDayOverride) });
  const levelInfo = calculateLevelInfo(profile.xp);
  const completedMins = getLearningAnalytics(profile).days.find((day) => day.date === today)?.minutes || 0;
  const currentStreak = calculateStreakFromCompletedDates(
    AppStorage.getDailySessions().filter((item) => item.status === "completed").map((item) => item.date), today
  ).currentStreak;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Hero Greeting Banner */}
      <HeroGreeting profile={profile} />

      <section className="relative overflow-hidden rounded-[2rem] border border-slate-700/20 bg-[#172c48] p-5 text-[#faf7ef] shadow-xl sm:p-7" aria-labelledby="cosmos-announcement">
        <Sparkles aria-hidden="true" className="absolute -right-7 -top-8 h-40 w-40 text-[#a7d3c6]/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#9fd8c8]/15 text-[#9fd8c8]"><Rocket className="h-6 w-6" /></div>
            <div>
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#9fd8c8]">YENİ · GÜNÜN OYUNU</span>
              <h2 id="cosmos-announcement" className="mt-1 text-2xl font-black tracking-tight">Çarpım <span className="text-[#e9c992]">Kozmosu ✦</span></h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">Doğru sayı yıldızını yakala, ışık izinle üç bölgeyi keşfet ve çarpım tablosunu kendi hızında öğren.</p>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2 sm:flex-shrink-0">
            <Link href="/games?game=cosmos" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#e9c992] px-4 py-2.5 text-sm font-extrabold text-[#172c48] hover:bg-[#f3d7aa]">Hemen oyna <Rocket className="h-4 w-4" /></Link>
            <Link href="/games" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10">Tüm oyunlar <Gamepad2 className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

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
          value={`${getDailyTargetMinutes(profile)} dk`}
          subtitle={completedMins > 0 ? `Çalışılan süre: ${completedMins} dk` : "Henüz başlanmadı"}
          icon={Clock}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          progressBar={{
            current: completedMins,
            total: getDailyTargetMinutes(profile),
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
          value={`${currentStreak} gün`}
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
          <DailyTrainingPlan session={session} targetMinutes={getDailyTargetMinutes(profile)} />
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
