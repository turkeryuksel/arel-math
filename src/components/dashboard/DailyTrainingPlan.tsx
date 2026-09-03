"use client";

import Link from "next/link";
import { Brain, Calculator, Puzzle, Lightbulb, Play, Clock } from "lucide-react";
import { DailySession } from "@/lib/questions/types";

interface DailyTrainingPlanProps {
  session: DailySession;
}

export default function DailyTrainingPlan({ session }: DailyTrainingPlanProps) {
  // Calculate completed count per category
  const mentalQuestions = session.questions.filter((q) => q.category === "mental-math");
  const opQuestions = session.questions.filter((q) => q.category === "operations");
  const probQuestions = session.questions.filter((q) => q.category === "problems");
  const brainQuestions = session.questions.filter((q) => q.category === "brain-training");

  const getCompletedFor = (category: string) => {
    return session.questions.filter(
      (q) => q.category === category && session.completedQuestionIds.includes(q.id)
    ).length;
  };

  const mentalDone = getCompletedFor("mental-math");
  const opDone = getCompletedFor("operations");
  const probDone = getCompletedFor("problems");
  const brainDone = getCompletedFor("brain-training");

  const categories = [
    {
      id: "mental-math",
      title: "Zihinden Matematik",
      desc: `${mentalQuestions.length} soru  •  ~3 dakika`,
      icon: Brain,
      iconBg: "bg-emerald-500",
      progress: `${mentalDone}/${mentalQuestions.length}`,
      percent: mentalQuestions.length ? (mentalDone / mentalQuestions.length) * 100 : 0,
      href: "/training?category=mental-math",
      buttonText: mentalDone > 0 && mentalDone < mentalQuestions.length ? "Devam Et" : mentalDone >= mentalQuestions.length ? "Tamamlandı" : "Başla",
      isFinished: mentalDone >= mentalQuestions.length && mentalQuestions.length > 0,
    },
    {
      id: "operations",
      title: "4 İşlem",
      desc: `${opQuestions.length} soru  •  ~4 dakika`,
      icon: Calculator,
      iconBg: "bg-blue-500",
      progress: `${opDone}/${opQuestions.length}`,
      percent: opQuestions.length ? (opDone / opQuestions.length) * 100 : 0,
      href: "/training?category=operations",
      buttonText: opDone > 0 && opDone < opQuestions.length ? "Devam Et" : opDone >= opQuestions.length ? "Tamamlandı" : "Başla",
      isFinished: opDone >= opQuestions.length && opQuestions.length > 0,
    },
    {
      id: "problems",
      title: "Problemler",
      desc: `${probQuestions.length} soru  •  ~3 dakika`,
      icon: Puzzle,
      iconBg: "bg-amber-500",
      progress: `${probDone}/${probQuestions.length}`,
      percent: probQuestions.length ? (probDone / probQuestions.length) * 100 : 0,
      href: "/training?category=problems",
      buttonText: probDone > 0 && probDone < probQuestions.length ? "Devam Et" : probDone >= probQuestions.length ? "Tamamlandı" : "Başla",
      isFinished: probDone >= probQuestions.length && probQuestions.length > 0,
    },
    {
      id: "brain-training",
      title: "Beyin Jimnastiği",
      desc: `${brainQuestions.length} görev  •  ~2 dakika`,
      icon: Lightbulb,
      iconBg: "bg-purple-500",
      progress: `${brainDone}/${brainQuestions.length}`,
      percent: brainQuestions.length ? (brainDone / brainQuestions.length) * 100 : 0,
      href: "/training?category=brain-training",
      buttonText: brainDone > 0 && brainDone < brainQuestions.length ? "Devam Et" : brainDone >= brainQuestions.length ? "Tamamlandı" : "Başla",
      isFinished: brainDone >= brainQuestions.length && brainQuestions.length > 0,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold text-slate-800 text-lg sm:text-xl">Bugünkü Antrenman Planı</h2>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Tahmini süre: {session.estimatedMinutes} dakika</span>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-all gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-2xl ${cat.iconBg} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug truncate">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{cat.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-600">{cat.progress}</span>
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={cat.href}
                  className={`min-h-[44px] min-w-[90px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                    cat.isFinished
                      ? "bg-slate-200 text-slate-500 cursor-default"
                      : cat.buttonText === "Devam Et"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 hover:scale-[1.02]"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 hover:scale-[1.02]"
                  }`}
                >
                  {cat.buttonText}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Big Blue CTA Start Button */}
      <Link
        href="/training"
        className="mt-5 w-full min-h-[52px] bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
      >
        <Play className="w-5 h-5 fill-white" />
        <span>Antrenmana Başla</span>
        <span className="text-blue-200 text-xs font-medium">
          (Toplam ~{session.estimatedMinutes} dakika)
        </span>
      </Link>
    </div>
  );
}
