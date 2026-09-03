"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Clock3 } from "lucide-react";
import { getLearningAnalytics } from "@/lib/analytics";
import { useAuth } from "@/lib/firebase/authContext";

export default function GrowthSummary() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState(() =>
    getLearningAnalytics(profile)
  );

  useEffect(() => {
    setAnalytics(getLearningAnalytics(profile));
  }, [profile]);

  const accuracyChange = analytics.previousAccuracy === null
    ? null
    : analytics.accuracy - analytics.previousAccuracy;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-800 text-base">Gelişim Özeti</h3>
        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
          Bu Hafta
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Çözülen Soru */}
        <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400">Çözülen Soru</p>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-800">{analytics.totalAttempts}</span>
          </div>
          <div className="flex items-center justify-center text-purple-500">
            <BarChart3 className="w-4 h-4" />
          </div>
        </div>

        {/* Doğru Oranı */}
        <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400">Doğru Oranı</p>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-800">%{analytics.accuracy}</span>
          </div>
          <div className="flex items-center justify-center gap-0.5 text-emerald-500 text-[11px] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {accuracyChange === null ? "Yeni" : `${accuracyChange >= 0 ? "+" : ""}%${accuracyChange}`}
            </span>
          </div>
        </div>

        {/* Çalışma Süresi */}
        <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400">Çalışma Süresi</p>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-black text-slate-800">{analytics.minutes}</span>
            <span className="text-xs font-bold text-slate-500 ml-0.5">dk</span>
          </div>
          <div className="flex items-center justify-center text-blue-500">
            <Clock3 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
