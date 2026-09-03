"use client";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  progressBar?: {
    current: number;
    total: number;
    color: string;
  };
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  progressBar,
}: MetricCardProps) {
  const percent = progressBar ? Math.min(100, Math.round((progressBar.current / progressBar.total) * 100)) : 0;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft hover-lift flex flex-col justify-between">
      <div className="flex items-start gap-3.5">
        <div className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">{value}</h3>
          <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      {progressBar && (
        <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressBar.color} rounded-full transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
