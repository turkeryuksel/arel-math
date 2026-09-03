"use client";

import { Check } from "lucide-react";

export default function WeeklyCalendar() {
  const days = [
    { label: "Pzt", status: "completed" },
    { label: "Sal", status: "completed" },
    { label: "Çar", status: "completed" },
    { label: "Per", status: "completed" },
    { label: "Cum", status: "active", count: 7 },
    { label: "Cmt", status: "pending" },
    { label: "Paz", status: "pending" },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      <h3 className="font-extrabold text-slate-800 text-base mb-4">Haftalık Takvim</h3>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">{d.label}</span>
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                d.status === "completed"
                  ? "bg-emerald-100 text-emerald-600 shadow-xs"
                  : d.status === "active"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-300 ring-4 ring-blue-100 scale-105"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {d.status === "completed" ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : d.status === "active" ? (
                <span>{d.count}</span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">Bu hafta 5/7 gün tamamlandı</span>
        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "71%" }} />
        </div>
      </div>
    </div>
  );
}
