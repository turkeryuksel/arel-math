"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ChartNoAxesColumnIncreasing,
  Flame,
  Star,
  Target,
  Clock,
  Award,
} from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile } from "@/lib/questions/types";

const accuracyData = [
  { day: "Pzt", dogruluk: 82 },
  { day: "Sal", dogruluk: 85 },
  { day: "Çar", dogruluk: 89 },
  { day: "Per", dogruluk: 84 },
  { day: "Cum", dogruluk: 91 },
  { day: "Cmt", dogruluk: 88 },
  { day: "Paz", dogruluk: 86 },
];

const activityData = [
  { week: "1. Hafta", dakika: 45 },
  { week: "2. Hafta", dakika: 55 },
  { week: "3. Hafta", dakika: 62 },
  { week: "4. Hafta", dakika: 58 },
];

export default function StatsPage() {
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());

  useEffect(() => {
    setProfile(AppStorage.getProfile());
  }, []);

  const topicAccuracy = [
    { title: "Zihinden Toplama", pct: 92, color: "bg-emerald-500" },
    { title: "Zihinden Çıkarma", pct: 84, color: "bg-teal-500" },
    { title: "4 İşlem Toplama & Çıkarma", pct: 90, color: "bg-blue-500" },
    { title: "Çarpma & Çarpım Tablosu", pct: 78, color: "bg-amber-500" },
    { title: "Bölme İşlemleri", pct: 72, color: "bg-purple-500" },
    { title: "Problemler & Hikayeler", pct: 86, color: "bg-rose-500" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <ChartNoAxesColumnIncreasing className="w-7 h-7 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Gelişim ve İstatistikler
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Arel&apos;in son günlerdeki çalışma süresi, soru sayısı ve konu bazlı doğruluk oranları.
          </p>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1">
            <Target className="w-4 h-4 text-purple-500" />
            <span>Genel Doğruluk</span>
          </div>
          <p className="text-2xl font-black text-slate-800">%86</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">Son 10 antrenman ortalaması</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Aktif Seri</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{profile.currentStreak} Gün</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">En iyi seri: {profile.bestStreak} gün</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Toplam XP</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{profile.xp}</p>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">Seviye {profile.level}</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Haftalık Süre</span>
          </div>
          <p className="text-2xl font-black text-slate-800">58 dk</p>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Hedef: 60 dk</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Son 7 Gün Doğruluk */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
          <h2 className="font-extrabold text-slate-800 text-base mb-4">
            Son 7 Gün Doğruluk Oranı (%)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis domain={[60, 100]} stroke="#94A3B8" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="dogruluk"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#2563EB", strokeWidth: 2, stroke: "#EFF6FF" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Son 4 Hafta Çalışma Süresi */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
          <h2 className="font-extrabold text-slate-800 text-base mb-4">
            Haftalık Toplam Çalışma Süresi (Dakika)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="week" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="dakika" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Konu Performansı Barları */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
        <h2 className="font-extrabold text-slate-800 text-base">Konu Bazlı Başarı Oranı</h2>

        <div className="space-y-3.5">
          {topicAccuracy.map((t, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{t.title}</span>
                <span className="text-slate-500">%{t.pct}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${t.color} rounded-full transition-all duration-700`}
                  style={{ width: `${t.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
