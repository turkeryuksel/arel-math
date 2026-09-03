"use client";

import Link from "next/link";
import { Brain, Flame, Zap, Star } from "lucide-react";

export default function RecentBadges() {
  const badges = [
    {
      title: "Zihinden Usta",
      icon: Brain,
      bgColor: "bg-teal-500",
      shadowColor: "shadow-teal-200",
    },
    {
      title: "7 Gün Seri",
      icon: Star,
      bgColor: "bg-orange-500",
      shadowColor: "shadow-orange-200",
    },
    {
      title: "Hızlı İşlemci",
      icon: Zap,
      bgColor: "bg-purple-600",
      shadowColor: "shadow-purple-200",
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-800 text-base">Son Kazanılan Rozetler</h3>
        <Link href="/badges" className="text-xs font-bold text-blue-600 hover:text-blue-700">
          Tümünü Gör
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="flex flex-col items-center group cursor-pointer">
              <div
                className={`w-14 h-16 sm:w-16 sm:h-18 rounded-2xl ${b.bgColor} text-white flex items-center justify-center shadow-lg ${b.shadowColor} transform group-hover:scale-105 transition-all relative clip-shield`}
                style={{
                  clipPath: "polygon(50% 0%, 100% 15%, 100% 80%, 50% 100%, 0% 80%, 0% 15%)",
                }}
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 fill-white/80" />
                </div>
              </div>
              <span className="mt-2 text-xs font-bold text-slate-700">{b.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
