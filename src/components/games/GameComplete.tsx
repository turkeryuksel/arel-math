"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import { useAuth } from "@/lib/firebase/authContext";
import { AppStorage } from "@/lib/firebase/storageProvider";

export default function GameComplete({ gameId, title, moves, onAgain, onExit }: { gameId: string; title: string; moves: number; onAgain: () => void; onExit: () => void }) {
  const { profile } = useAuth();
  const [resultId] = useState(() => crypto.randomUUID());
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saving");
  const [retry, setRetry] = useState(0);
  const pendingSave = useRef<Promise<void> | null>(null);
  const [profileId] = useState(() => AppStorage.getProfile().id);

  useEffect(() => {
    let active = true;
    if (AppStorage.getProfile().id !== profileId) {
      setSaveState("error");
      return;
    }
    pendingSave.current ||= AppStorage.recordGameResult(gameId, moves, resultId);
    void pendingSave.current.then(() => {
      if (active) setSaveState("saved");
    }).catch(() => {
      pendingSave.current = null;
      if (active) setSaveState("error");
    });
    return () => { active = false; };
  }, [gameId, moves, resultId, retry, profileId]);

  return (
    <div className="rounded-[2rem] border border-amber-100 bg-white p-7 text-center shadow-xl sm:p-9">
      <Trophy className="mx-auto h-14 w-14 text-amber-500" />
      <h2 className="mt-3 text-2xl font-black text-slate-900">Harika oyun, {profile.displayName || "arkadaşım"}! 🎉</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">{title} tamamlandı · {moves} hamle{saveState === "saved" ? " · +15 XP" : ""}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">Burada kaybetmek yok; her tur beynini başka bir yoldan çalıştırır.</p>
      {saveState === "saving" && <p role="status" className="mt-4 text-sm text-slate-600">Oyun sonucun kaydediliyor...</p>}
      {saveState === "error" && <div role="alert" className="mt-4 text-sm text-rose-700">
        <p>Oyununu bitirdin, ancak sonucunu kaydedemedik. Bağlantını kontrol edip tekrar dene.</p>
        <button className="mt-2 min-h-13 rounded-2xl bg-rose-50 px-4 font-bold" onClick={() => { setSaveState("saving"); setRetry((value) => value + 1); }}>Kaydı Tekrar Dene</button>
      </div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button disabled={saveState !== "saved"} onClick={onAgain} className="disabled:opacity-50 min-h-13 rounded-2xl bg-blue-600 px-5 font-black text-white">Bir Tur Daha</button>
        <button disabled={saveState === "saving"} onClick={onExit} className="disabled:opacity-50 min-h-13 rounded-2xl bg-slate-100 px-5 font-black text-slate-700">Başka Oyun Seç</button>
      </div>
    </div>
  );
}

