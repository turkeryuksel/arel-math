"use client";

import { useIstanbulDate } from "@/lib/hooks/useIstanbulDate";
import Image from "next/image";
import { Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/firebase/authContext";

export default function MotivationalBanner() {
  const { profile } = useAuth();
  const today = useIstanbulDate();
  const specialMessage = !profile.tomorrowSpecialTaskDate || profile.tomorrowSpecialTaskDate === today
    ? profile.tomorrowSpecialTask?.trim() : null;
  return (
    <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-yellow-50/90 rounded-3xl p-4 sm:p-5 border border-amber-200/60 shadow-soft flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
          <Image
            src="/avatars/mini-arel.png"
            alt="Arel"
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
            <span>{specialMessage ? "Sana özel bir not var!" : `Harika gidiyorsun ${profile.displayName || "Arel"}!`}</span>
            <span>💪</span>
          </h4>
          <p className="text-xs text-amber-800/80 font-medium">{specialMessage || "Her gün biraz daha iyiye!"}</p>
        </div>
      </div>

      <div className="text-amber-400 opacity-60">
        <Lightbulb className="w-8 h-8 stroke-[1.5]" />
      </div>
    </div>
  );
}
