"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  House,
  CalendarCheck,
  Brain,
  Calculator,
  Puzzle,
  Lightbulb,
  ChartNoAxesColumnIncreasing,
  Trophy,
  Settings,
  Shield,
  Flame,
  Gamepad2,
  BookOpenCheck,

  LogIn,
  LogOut,
} from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile } from "@/lib/questions/types";
import { calculateLevelInfo } from "@/lib/adaptive/scoring";
import { useAuth } from "@/lib/firebase/authContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, isAdmin, profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(authProfile || AppStorage.getProfile());

  useEffect(() => {
    setProfile(AppStorage.getProfile());
  }, [pathname, authProfile]);

  const levelInfo = calculateLevelInfo(profile.xp);

  const baseItems = [
    { label: "Ana Sayfa", href: "/", icon: House },
    { label: "Günlük Görevler", href: "/training", icon: CalendarCheck },
    { label: "Zihinden Matematik", href: "/mental-math", icon: Brain },
    { label: "4 İşlem", href: "/operations", icon: Calculator },
    { label: "Problem Macerası", href: "/problems", icon: Puzzle },
    { label: "Müfredat Keşfi", href: "/curriculum", icon: BookOpenCheck },
    { label: "Oyun Alanı", href: "/games", icon: Gamepad2 },
    { label: "Beyin Jimnastiği", href: "/brain", icon: Lightbulb },
    { label: "İstatistikler", href: "/stats", icon: ChartNoAxesColumnIncreasing },
    { label: "Rozetler", href: "/badges", icon: Trophy },
  ];

  // Ebeveyn Paneli yalnızca admin e-postası ile giriş yapıldığında görünür
  const navItems = isAdmin
    ? [...baseItems, { label: "Ebeveyn Paneli", href: "/parent", icon: Settings }]
    : baseItems;

  return (
    <aside className="h-full flex flex-col justify-between p-4 overflow-y-auto">
      <div>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-2 py-3 group">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-slate-800 text-base">Arel&apos;le Öğreniyorum</h1>
            <p className="text-xs font-semibold text-blue-600">Matematik</p>
          </div>
        </Link>

        {/* Profile Card */}
        <div className="mt-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-soft text-center flex flex-col items-center">
          <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-400 to-indigo-500 shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
              <Image
                src="/avatars/arel.png"
                alt={profile.displayName}
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>
          </div>

          <h2 className="mt-3 font-bold text-slate-800 text-base">{profile.displayName}</h2>
          <p className="text-xs text-slate-500 font-medium">{profile.grade}. Sınıf</p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-200">
            <Shield className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Seviye {levelInfo.level}</span>
          </div>

          <div className="w-full mt-3">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
              <span>{profile.xp} / {levelInfo.nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-bold shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                />
                <span className="text-xs sm:text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls & Streak Card */}
      <div className="mt-4 space-y-3">
        {/* Auth / Login Quick Button */}
        <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
          {user ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-indigo-700 truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="p-1 hover:text-rose-600 transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors w-full py-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Giriş Yap / Hesap Oluştur</span>
            </Link>
          )}
        </div>

        {/* 7-Day Streak Bottom Card */}
        <div className="p-3.5 rounded-3xl bg-gradient-to-br from-orange-50/90 to-amber-50/70 border border-orange-100 text-center">
          <div className="flex items-center justify-center gap-1.5 text-orange-600 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{profile.currentStreak} Günlük Seri</span>
          </div>
          <div className="flex justify-center items-center gap-1.5 mt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className={`w-2 h-2 rounded-full ${
                  day <= profile.currentStreak
                    ? "bg-emerald-500 ring-2 ring-emerald-200"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] font-medium text-slate-500 mt-1.5">
            Serini koru, devam et! 💪
          </p>
        </div>
      </div>
    </aside>
  );
}
