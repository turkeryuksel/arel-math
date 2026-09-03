"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getLearningAnalytics } from "@/lib/analytics";
import { getWeeklyTargetMinutes } from "@/lib/analytics";
import { useAuth } from "@/lib/firebase/authContext";

export default function WeeklyCalendar() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState(() =>
    getLearningAnalytics(profile)
  );

  useEffect(() => {
    setAnalytics(getLearningAnalytics(profile));
  }, [profile]);

  const completedDays = analytics.days.filter((day) => day.completed).length;
  const targetMinutes = getWeeklyTargetMinutes(profile);
  const progress = targetMinutes ? Math.min(100, (analytics.minutes / targetMinutes) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      <h3 className="font-extrabold text-slate-800 text-base mb-4">Haftalık Takvim</h3>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {analytics.days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">{d.label}</span>
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                d.completed
                  ? "bg-emerald-100 text-emerald-600 shadow-xs"
                  : d.attempts > 0
                  ? "bg-blue-600 text-white shadow-md shadow-blue-300 ring-4 ring-blue-100 scale-105"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {d.completed ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : d.attempts > 0 ? (
                <span>{d.attempts}</span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">Bu hafta {completedDays}/7 gün tamamlandı</span>
        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
