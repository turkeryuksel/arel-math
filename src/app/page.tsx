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
import { Clock, Star, Target, Calendar } from "lucide-react";

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [session, setSession] = useState<DailySession>(AppStorage.getDailySession());

  useEffect(() => {
    setProfile(AppStorage.getProfile());
    setSession(AppStorage.getDailySession());
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Hero Greeting Banner */}
      <HeroGreeting profile={profile} />

      {/* 2. Four Key Metric Cards Row */}
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

      {/* 3. Main Split Content Area */}
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
