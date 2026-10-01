"use client";

import { useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";

export default function StreakShieldNotice() {
  const [event, setEvent] = useState<"earned" | "consumed" | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (next: "earned" | "consumed" | null) => {
      if (!next) return;
      setEvent(next);
      timer = setTimeout(() => setEvent(null), 6500);
    };
    const handle = (value: Event) => show((value as CustomEvent<"earned" | "consumed">).detail);
    window.addEventListener("arel-streak-shield", handle);
    show(AppStorage.consumePendingStreakShieldEvent());
    return () => {
      window.removeEventListener("arel-streak-shield", handle);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!event) return null;
  const earned = event === "earned";
  return <div className="fixed inset-x-3 bottom-24 z-[69] mx-auto max-w-sm md:bottom-6 md:right-6 md:left-auto md:mx-0" role="status" aria-live="polite">
    <div className="relative rounded-3xl border border-blue-200 bg-white p-5 shadow-2xl shadow-blue-900/15">
      <button type="button" aria-label="Seri Kalkanı mesajını kapat" onClick={() => setEvent(null)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3 pr-8">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Shield className="h-8 w-8 fill-blue-500" /></span>
        <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">{earned ? "Seri Kalkanı kazandın!" : "Kalkanın serini korudu!"}</p><p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">{earned ? "Üç gerçek çalışma gününü tamamladın. Bir gün çalışamazsan kalkanın serini koruyacak." : "Bir gün çalışamadın ama serin devam ediyor."}</p></div>
      </div>
    </div>
  </div>;
}
