"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Settings, CheckCircle2, AlertCircle, Save, CalendarPlus, Clock } from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile } from "@/lib/questions/types";

export default function ParentPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [targetMinutes, setTargetMinutes] = useState<number>(12);
  const [tomorrowTask, setTomorrowTask] = useState<string>("");
  const [weights, setWeights] = useState<Record<string, "low" | "normal" | "high">>({
    addition: "normal",
    subtraction: "normal",
    multiplication: "high",
    division: "normal",
    problems: "high",
  });

  useEffect(() => {
    const p = AppStorage.getProfile();
    setProfile(p);
    setTargetMinutes(p.targetMinutes || 12);
    setTomorrowTask(p.tomorrowSpecialTask || "");
    if (p.subjectWeights) {
      setWeights(p.subjectWeights);
    }
  }, []);

  const handlePinSubmit = () => {
    const correctPin = profile.parentPin || "1907";
    if (pinInput.trim() === correctPin) {
      setIsAuthenticated(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Hatalı PIN kodu. (Varsayılan PIN: 1907)");
      setPinInput("");
    }
  };

  const handleSaveSettings = () => {
    const updated: UserProfile = {
      ...profile,
      targetMinutes,
      tomorrowSpecialTask: tomorrowTask.trim() || null,
      subjectWeights: weights,
    };
    AppStorage.saveProfile(updated);
    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-4xl p-6 sm:p-8 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Ebeveyn Girişi</h1>
            <p className="text-xs text-slate-500 mt-1">
              Arel&apos;in ayarlarını ve gelişim raporunu yönetmek için 4 haneli ebeveyn PIN kodunu giriniz.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                  pinInput.length > idx
                    ? "border-blue-600 bg-blue-50/50 text-blue-600"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                {pinInput.length > idx ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Tablet & Mobile Friendly Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === "C") {
                    setPinInput("");
                  } else if (key === "OK") {
                    handlePinSubmit();
                  } else if (pinInput.length < 4) {
                    const next = pinInput + key;
                    setPinInput(next);
                    if (next.length === 4) {
                      const correctPin = profile.parentPin || "1907";
                      if (next === correctPin) {
                        setIsAuthenticated(true);
                      }
                    }
                  }
                }}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 font-bold text-slate-700 text-lg border border-slate-200/60 transition-all"
              >
                {key}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 font-medium">Varsayılan PIN: 1907</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Settings className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Ebeveyn Kontrol Paneli
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Arel&apos;in günlük hedeflerini, ders ağırlıklarını ve gelişim analizini buradan yönetebilirsiniz.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
        >
          Çıkış Yap
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Ayarlar başarıyla kaydedildi!</span>
        </div>
      )}

      {/* Overview Analytics for Parents */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold text-slate-400">Bugünkü Durum</p>
          <p className="text-xl font-black text-slate-800 mt-1">Çalışma Tamamlandı</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">8 dakika odaklanıldı</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold text-slate-400">En Güçlü Konu</p>
          <p className="text-xl font-black text-slate-800 mt-1">Zihinden Toplama</p>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">%92 doğruluk oranı</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
          <p className="text-xs font-semibold text-slate-400">Destek Gereken Konu</p>
          <p className="text-xl font-black text-slate-800 mt-1">Bölme & 7&apos;ler Tablosu</p>
          <p className="text-xs font-semibold text-amber-600 mt-0.5">Sistem otomatik pekiştiriyor</p>
        </div>
      </div>

      {/* Target Minutes Setting */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Günlük Çalışma Hedefi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arel için önerilen günlük antrenman süresi (5 - 30 dakika arası)
            </p>
          </div>
          <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-2xl">
            {targetMinutes} Dakika
          </span>
        </div>

        <input
          type="range"
          min={5}
          max={30}
          step={1}
          value={targetMinutes}
          onChange={(e) => setTargetMinutes(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>5 dk (Hafif)</span>
          <span>12 dk (Önerilen)</span>
          <span>30 dk (Yoğun)</span>
        </div>
      </div>

      {/* Subject Weights */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Konu Ağırlıkları</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Günlük antrenmanda hangi konulardan daha çok veya daha az soru geleceğini belirleyin.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { id: "addition", label: "Toplama İşlemleri" },
            { id: "subtraction", label: "Çıkarma İşlemleri" },
            { id: "multiplication", label: "Çarpma & Çarpım Tablosu" },
            { id: "division", label: "Bölme İşlemleri" },
            { id: "problems", label: "Hikayeli Problemler" },
          ].map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <span className="text-sm font-bold text-slate-700">{topic.label}</span>
              <div className="flex gap-1.5">
                {(["low", "normal", "high"] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeights({ ...weights, [topic.id]: w })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      weights[topic.id] === w
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {w === "low" ? "Az" : w === "normal" ? "Normal" : "Fazla"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tomorrow Special Task */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Yarın İçin Özel Görev</h2>
            <p className="text-xs text-slate-500">
              Yarınki antrenmana özel bir odak belirleyebilirsiniz (Örn: 7&apos;ler çarpım tablosu)
            </p>
          </div>
        </div>

        <input
          type="text"
          value={tomorrowTask}
          onChange={(e) => setTomorrowTask(e.target.value)}
          placeholder="Örnek: 7'ler çarpım tablosundan 10 soru ağırlıklı gelsin"
          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-blue-500"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        className="w-full min-h-[56px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all text-base"
      >
        <Save className="w-5 h-5" />
        <span>Ayarları Kaydet</span>
      </button>
    </div>
  );
}
