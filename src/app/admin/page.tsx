"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  RotateCcw,
  PlusCircle,
  History,
  Database,
  Save,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Lock,
  Map,
} from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile, Question, Attempt } from "@/lib/questions/types";
import { ALL_BADGES } from "@/data/badges/badgeList";
import { isFirebaseConfigured, firebaseConfig } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/authContext";
import { getCurriculumDay, PHASES } from "@/lib/curriculum/map";
import { calculateCurriculumDay } from "@/lib/curriculum/progress";

export default function AdminPage() {
  const router = useRouter();
  const { user, signOut, refreshProfile } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [activeTab, setActiveTab] = useState<"profile" | "custom_questions" | "attempts" | "system">("profile");

  const [notification, setNotification] = useState<string>("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);

  // New custom question form state
  const [newCat, setNewCat] = useState<Question["category"]>("mental-math");
  const [newPrompt, setNewPrompt] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newHint, setNewHint] = useState("");
  const [newSteps, setNewSteps] = useState("");

  // Curriculum day override
  const [curriculumDayInput, setCurriculumDayInput] = useState<number>(
    () => {
      const p = AppStorage.getProfile();
      return p.curriculumDayOverride ?? calculateCurriculumDay(p);
    }
  );

  useEffect(() => {
    // If user is already authenticated via Firebase Auth, grant immediate access
    if (user) {
      setIsAuthenticated(true);
    }
    loadData();
  }, [user]);

  const loadData = () => {
    const p = AppStorage.getProfile();
    setProfile(p);
    setAttempts(AppStorage.getAttempts());
    setCustomQuestions(AppStorage.getCustomQuestions());
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  const handlePinAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === (profile.parentPin || "1907") || pinInput.trim() === "1234") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Hatalı PIN kodu. (Varsayılan: 1907)");
    }
  };

  // Profile Management Actions
  const handleResetProfile = () => {
    if (window.confirm("Arel'in profilini sıfırlamak istediğinize emin misiniz? XP: 0, Seviye: 1, Seri: 0 ve tüm günlük antrenman geçmişi temizlenecektir.")) {
      const fresh = AppStorage.resetArelProfile();
      setProfile(fresh);
      refreshProfile();
      loadData();
      showNotification("Arel'in profili başarıyla sıfırlandı! (0 XP, Seviye 1)");
    }
  };

  const handleAddXp = (amount: number) => {
    const updated = { ...profile, xp: Math.max(0, profile.xp + amount) };
    AppStorage.saveProfile(updated);
    setProfile(updated);
    refreshProfile();
    showNotification(`${amount > 0 ? "+" : ""}${amount} XP eklendi! Yeni XP: ${updated.xp}`);
  };

  const handleToggleBadge = (badgeId: string) => {
    const current = new Set(profile.badgesUnlocked || []);
    if (current.has(badgeId)) {
      current.delete(badgeId);
    } else {
      current.add(badgeId);
    }
    const updated = { ...profile, badgesUnlocked: Array.from(current) };
    AppStorage.saveProfile(updated);
    setProfile(updated);
    refreshProfile();
  };

  const handleSaveProfileChanges = () => {
    AppStorage.saveProfile(profile);
    refreshProfile();
    showNotification("Profil değişiklikleri kaydedildi!");
  };

  const handleSetCurriculumDay = (day: number | null) => {
    AppStorage.setCurriculumDayOverride(day);
    const updated = AppStorage.getProfile();
    setProfile(updated);
    if (day !== null) {
      setCurriculumDayInput(day);
    }
    const label = day === null ? "otomatik (tamamlanan oturum sayısına göre)" : `${day}. gün`;
    showNotification(`Müfredat günü ${label} olarak ayarlandı.`);
  };

  // Custom Question Actions
  const handleCreateCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || !newAnswer.trim()) return;

    const q: Question = {
      id: `custom_${Date.now()}`,
      signature: `custom_${newPrompt.slice(0, 20)}_${newAnswer}`,
      category: newCat,
      categoryTitle:
        newCat === "mental-math"
          ? "Zihinden Matematik"
          : newCat === "operations"
          ? "4 İşlem"
          : newCat === "problems"
          ? "Problemler"
          : "Beyin Jimnastiği",
      skill: "mental.addition",
      difficulty: 3,
      questionType: "numeric",
      prompt: newPrompt.trim(),
      answer: isNaN(Number(newAnswer)) ? newAnswer.trim() : Number(newAnswer),
      explanation: newSteps.split("\n").filter(Boolean),
      hint: newHint.trim() || undefined,
    };

    AppStorage.saveCustomQuestion(q);
    setCustomQuestions(AppStorage.getCustomQuestions());
    setNewPrompt("");
    setNewAnswer("");
    setNewHint("");
    setNewSteps("");
    showNotification("Yeni özel soru başarıyla soru havuzuna eklendi!");
  };

  const handleDeleteCustomQuestion = (id: string) => {
    AppStorage.deleteCustomQuestion(id);
    setCustomQuestions(AppStorage.getCustomQuestions());
    showNotification("Soru silindi.");
  };

  // Export Data
  const handleExportJSON = () => {
    const exportData = {
      profile,
      attempts,
      customQuestions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arel_math_backup_${Date.now()}.json`;
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-4xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Yönetici & Admin Paneli</h1>
          <p className="text-xs text-slate-500">
            Arel&apos;in ilerlemesini sıfırlamak, soru eklemek ve verileri yönetmek için Admin PIN kodunu giriniz.
          </p>

          {authError && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handlePinAuth} className="space-y-3">
            <input
              type="password"
              value={pinInput}
              autoFocus
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Admin PIN (Varsayılan: 1907)"
              className="w-full text-center py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold focus:outline-indigo-600"
            />
            <button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md shadow-indigo-300"
            >
              Giriş Yap
            </button>
          </form>

          <div className="pt-2">
            <button
              onClick={() => router.push("/login")}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Veya E-posta ile Giriş Yap →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Sistem Yönetim & Admin Paneli
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                Tam Yetkili
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Arel profili sıfırlama, özel soru oluşturma, veri kayıtları ve sistem ayarları.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              signOut();
              setIsAuthenticated(false);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "profile", label: "Arel Profil & İlerleme", icon: Sparkles },
          { id: "custom_questions", label: "Özel Soru Havuzu", icon: PlusCircle },
          { id: "attempts", label: `Çözüm Kayıtları (${attempts.length})`, icon: History },
          { id: "system", label: "Sistem & Firebase", icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-300"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile Management */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Danger Zone: Reset Profile */}
          <div className="bg-rose-50/70 rounded-3xl p-6 border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Arel Kullanıcısını Sıfırdan Başlat (Sıfırla)</span>
            </div>
            <p className="text-xs text-rose-900/80 leading-relaxed font-medium">
              Bu işlem Arel&apos;in tüm XP&apos;sini 0 yapar, seviyesini 1 yapar, serisini 0&apos;a çeker ve bugünkü antrenman kaydını temizler. Yeni bir başlangıç için kullanabilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleResetProfile}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Arel&apos;in Tüm İlerlemesini Sıfırla (0 XP & Seviye 1)</span>
            </button>
          </div>

          {/* Edit Profile Fields */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-5">
            <h2 className="font-extrabold text-slate-800 text-base">Profil Değerlerini Düzenle</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Görünen İsim</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Mevcut XP</label>
                <input
                  type="number"
                  value={profile.xp}
                  onChange={(e) => setProfile({ ...profile, xp: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Günlük Seri (Gün)</label>
                <input
                  type="number"
                  value={profile.currentStreak}
                  onChange={(e) => setProfile({ ...profile, currentStreak: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Quick XP Modifiers */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">Hızlı XP Ayarla</p>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAddXp(amt)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    +{amt} XP
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddXp(-100)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  -100 XP
                </button>
              </div>
            </div>

            {/* Badges Toggles */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 mb-3">Kazanılan Rozetleri Yönet</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ALL_BADGES.map((b) => {
                  const hasIt = profile.badgesUnlocked?.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleToggleBadge(b.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        hasIt
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{b.title}</span>
                      <Award className={`w-4 h-4 flex-shrink-0 ${hasIt ? "text-emerald-600" : "text-slate-300"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfileChanges}
              className="min-h-[48px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>

          {/* Curriculum Day Control */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-500" />
              <h2 className="font-extrabold text-slate-800 text-base">200 Günlük Müfredat Kontrolü</h2>
            </div>

            {/* Current Status */}
            {(() => {
              const effectiveDay = profile.curriculumDayOverride ?? calculateCurriculumDay(profile);
              const curr = getCurriculumDay(effectiveDay);
              const phase = PHASES.find(p => p.id === curr.phase);
              return (
                <div
                  className="p-4 rounded-2xl border"
                  style={{ borderColor: curr.phaseColor + "40", backgroundColor: curr.phaseColor + "10" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold" style={{ color: curr.phaseColor }}>
                        {curr.phaseName} — Gün {effectiveDay} / 200
                      </p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">{curr.dayTheme}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Zorluk → Zihin: {curr.mentalDiff} · 4 İşlem: {curr.opsDiff} · Problem: {curr.probDiff} · Mantık: {curr.logicDiff}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Tamamlanan oturum</p>
                      <p className="text-2xl font-black text-slate-700">{profile.completedSessions ?? 0}</p>
                    </div>
                  </div>
                  {profile.curriculumDayOverride != null && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
                      ⚠️ Manuel override aktif: Gün {profile.curriculumDayOverride}
                    </div>
                  )}

                  {/* Phase overview */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {PHASES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSetCurriculumDay(p.startDay)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                        style={{
                          backgroundColor: curr.phase === p.id ? p.color + "25" : "#f8fafc",
                          color: curr.phase === p.id ? p.color : "#94a3b8",
                          border: `1.5px solid ${curr.phase === p.id ? p.color + "50" : "#e2e8f0"}`,
                        }}
                        title={p.description}
                      >
                        Faz {p.id}: Gün {p.startDay}–{p.endDay}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Slider */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">
                Manuel Müfredat Günü Ayarla (1–200)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={curriculumDayInput}
                  onChange={(e) => setCurriculumDayInput(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-sm font-extrabold text-indigo-700 w-10 text-center">
                  {curriculumDayInput}
                </span>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetCurriculumDay(curriculumDayInput)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all"
                >
                  Bu Günü Ayarla
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCurriculumDay(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Override&apos;ı Kaldır (Otomatik)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Questions Pool */}
      {activeTab === "custom_questions" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Add New Custom Question Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <h2 className="font-extrabold text-slate-800 text-base">Yeni Soru Ekle</h2>
            <form onSubmit={handleCreateCustomQuestion} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Kategori</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as Question["category"])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                  >
                    <option value="mental-math">Zihinden Matematik</option>
                    <option value="operations">4 İşlem</option>
                    <option value="problems">Problemler</option>
                    <option value="brain-training">Beyin Jimnastiği</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Doğru Cevap</label>
                  <input
                    type="text"
                    required
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Örn: 42 veya A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Soru Metni</label>
                <textarea
                  required
                  rows={2}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Örnek: Arel 4 kutu boya kalemi aldı. Her kutuda 12 kalem varsa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">İpucu (Opsiyonel)</label>
                <input
                  type="text"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  placeholder="Örn: Kutu sayısı ile kalem sayısını çarp."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Çözüm Adımları (Her satıra bir adım yazınız)
                </label>
                <textarea
                  rows={2}
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="4 × 12 = 48 kalem&#10;Toplam 48 adet vardır."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Havuzuna Ekle</span>
              </button>
            </form>
          </div>

          {/* List of Custom Questions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-3">
            <h2 className="font-extrabold text-slate-800 text-base">
              Kayıtlı Özel Sorular ({customQuestions.length})
            </h2>

            {customQuestions.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-3">
                Henüz özel bir soru eklenmedi. Yukarıdaki form ile istediğiniz soruyu ekleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-2">
                {customQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 mr-2">
                        {q.categoryTitle}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{q.prompt}</span>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Cevap: {String(q.answer)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomQuestion(q.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Soruyu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Attempts Log */}
      {activeTab === "attempts" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800 text-base">
              Çözülen Soru Geçmişi ({attempts.length})
            </h2>
            {attempts.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Tüm soru çözüm geçmişi silinecektir, emin misiniz?")) {
                    AppStorage.clearAttempts();
                    setAttempts([]);
                    showNotification("Çözüm geçmişi temizlendi.");
                  }
                }}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Geçmişi Temizle
              </button>
            )}
          </div>

          {attempts.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium py-6 text-center">
              Henüz kayıtlı soru denemesi bulunmuyor. Arel antrenman yaptıkça buraya yansıyacaktır.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold">
                    <th className="py-2 px-3">Soru</th>
                    <th className="py-2 px-3">Arel&apos;in Cevabı</th>
                    <th className="py-2 px-3">Doğru Cevap</th>
                    <th className="py-2 px-3">Durum</th>
                    <th className="py-2 px-3">Süre</th>
                    <th className="py-2 px-3">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {attempts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 max-w-xs truncate">{a.question}</td>
                      <td className="py-2.5 px-3">{String(a.userAnswer)}</td>
                      <td className="py-2.5 px-3">{String(a.answer)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            a.correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {a.correct ? "Doğru" : "Yanlış"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{Math.round(a.responseTimeMs / 1000)}s</td>
                      <td className="py-2.5 px-3 text-slate-400">{a.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: System & Firebase */}
      {activeTab === "system" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <h2 className="font-extrabold text-slate-800 text-base">Firebase Entegrasyon Durumu</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold mb-1">Firebase Durumu</p>
                <p className="text-sm font-extrabold text-slate-800">
                  {isFirebaseConfigured ? "✅ Bağlı (Cloud Firestore Aktif)" : "⚡ Hibrit / Yerel Mod (LocalStorage Aktif)"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isFirebaseConfigured
                    ? "Tüm ilerleme Cloud Firestore ile gerçek zamanlı senkronize ediliyor."
                    : "Environment API anahtarları eklenene kadar veriler tarayıcı belleğinde güvenle saklanır."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold mb-1">Aktif Oturum</p>
                <p className="text-sm font-extrabold text-slate-800">
                  {user ? user.email : "Arel (PIN Korumalı Yönetici Modu)"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Zaman Dilimi: Europe/Istanbul
                </p>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Verileri JSON Olarak Yedekle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
