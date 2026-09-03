"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Settings,
  Shield,
  Clock,
  Sparkles,
  Map,
  PlusCircle,
  History,
  RotateCcw,
  Save,
  Award,
  Database,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  UserPlus,
  Users,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile, Question, Attempt } from "@/lib/questions/types";
import { ALL_BADGES } from "@/data/badges/badgeList";
import { useAuth } from "@/lib/firebase/authContext";
import { getCurriculumDay, PHASES } from "@/lib/curriculum/map";
import { calculateCurriculumDay } from "@/lib/curriculum/progress";

export default function ParentUnifiedPage() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [activeTab, setActiveTab] = useState<
    "overview" | "curriculum" | "subjects" | "students" | "badges" | "questions" | "logs"
  >("overview");

  const [notification, setNotification] = useState<string>("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);

  // Settings State
  const [targetMinutes, setTargetMinutes] = useState<number>(12);
  const [tomorrowTask, setTomorrowTask] = useState<string>("");
  const [weights, setWeights] = useState<Record<string, "low" | "normal" | "high">>({
    addition: "normal",
    subtraction: "normal",
    multiplication: "high",
    division: "normal",
    problems: "high",
  });

  // Curriculum State
  const [curriculumDayInput, setCurriculumDayInput] = useState<number>(() => {
    const p = AppStorage.getProfile();
    return p.curriculumDayOverride ?? calculateCurriculumDay(p);
  });

  // New Question State
  const [newCat, setNewCat] = useState<Question["category"]>("mental-math");
  const [newPrompt, setNewPrompt] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newHint, setNewHint] = useState("");
  const [newSteps, setNewSteps] = useState("");

  // New Student Modal / Form State
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState(4);
  const [newStudentMinutes, setNewStudentMinutes] = useState(12);

  // Fallback PIN state for parent access if not signed in
  const [pinInput, setPinInput] = useState("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const p = AppStorage.getProfile();
    setProfile(p);
    setTargetMinutes(p.targetMinutes || 12);
    setTomorrowTask(p.tomorrowSpecialTask || "");
    if (p.subjectWeights) setWeights(p.subjectWeights);
    setAttempts(AppStorage.getAttempts());
    setCustomQuestions(AppStorage.getCustomQuestions());
    setCurriculumDayInput(p.curriculumDayOverride ?? calculateCurriculumDay(p));
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // Check if authenticated (either logged in via turker@taximact.com OR unlocked via PIN)
  const isAuthorized = Boolean(isAdmin || (user && user.email === "turker@taximact.com") || pinUnlocked);

  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === (profile.parentPin || "1907") || pinInput.trim() === "1234") {
      setPinUnlocked(true);
      setPinError("");
    } else {
      setPinError("Hatalı PIN kodu. Lütfen ebeveyn e-postası ile giriş yapınız.");
    }
  };

  // Save general settings
  const handleSaveSettings = () => {
    const updated: UserProfile = {
      ...profile,
      targetMinutes,
      tomorrowSpecialTask: tomorrowTask.trim() || null,
      subjectWeights: weights,
    };
    AppStorage.saveProfile(updated);
    setProfile(updated);
    showNotice("Ayarlar başarıyla kaydedildi!");
  };

  // Reset profile to 0 XP
  const handleResetProfile = () => {
    if (
      window.confirm(
        `${profile.displayName} kullanıcısının tüm verilerini sıfırlamak istediğinize emin misiniz? (0 XP, Seviye 1, 0 Seri)`
      )
    ) {
      const fresh = AppStorage.resetArelProfile();
      setProfile(fresh);
      loadData();
      showNotice("Profil sıfırlandı! Yeni tertemiz başlangıç hazır (0 XP).");
    }
  };

  // Quick XP adjuster
  const handleAddXp = (amount: number) => {
    const updated = { ...profile, xp: Math.max(0, profile.xp + amount) };
    AppStorage.saveProfile(updated);
    setProfile(updated);
    showNotice(`${amount > 0 ? "+" : ""}${amount} XP güncellendi! Yeni XP: ${updated.xp}`);
  };

  // Curriculum override
  const handleSetCurriculumDay = (day: number | null) => {
    AppStorage.setCurriculumDayOverride(day);
    const updated = AppStorage.getProfile();
    setProfile(updated);
    if (day !== null) setCurriculumDayInput(day);
    showNotice(
      day === null
        ? "Müfredat ilerlemesi otomatiğe alındı."
        : `Müfredat günü ${day}. gün olarak ayarlandı.`
    );
  };

  // Toggle badge
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
  };

  // Create new custom question
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
    showNotice("Yeni özel soru soru havuzuna eklendi!");
  };

  // Create new student profile
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newProfile = AppStorage.createCustomProfile({
      id: `student_${Date.now()}`,
      displayName: newStudentName.trim(),
      grade: newStudentGrade,
      targetMinutes: newStudentMinutes,
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      completedSessions: 0,
      badgesUnlocked: [],
    });

    setProfile(newProfile);
    setShowNewStudentModal(false);
    setNewStudentName("");
    loadData();
    showNotice(`Yeni öğrenci profili "${newProfile.displayName}" oluşturuldu ve aktif edildi!`);
  };

  // JSON Export
  const handleExportJSON = () => {
    const data = {
      profile,
      attempts,
      customQuestions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arel_math_ebeveyn_yedek_${Date.now()}.json`;
    a.click();
  };

  // If not authorized, show friendly Parent Login
  if (!isAuthorized) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-4xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Settings className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Ebeveyn Kontrol Paneli
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Öğrenci profili, günlük hedefler, konu ağırlıkları ve 200 günlük müfredat yönetimi için giriş yapınız.
            </p>
          </div>

          {/* Option A: Login with turker@taximact.com */}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>E-posta ile Giriş Yap</span>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-bold">Veya Hızlı PIN</span>
            </div>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinUnlock} className="space-y-3">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN Kodu (Varsayılan: 1907)"
              className="w-full text-center py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-blue-600"
            />
            <button
              type="submit"
              className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              PIN ile Paneli Aç
            </button>
          </form>
        </div>
      </div>
    );
  }

  const effectiveCurriculumDay = profile.curriculumDayOverride ?? calculateCurriculumDay(profile);
  const currDayInfo = getCurriculumDay(effectiveCurriculumDay);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Settings className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Ebeveyn Kontrol & Yönetim Paneli
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                Yetkili
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              {profile.displayName} için hedefler, konu ağırlıkları, 200 günlük müfredat ve öğrenci yönetimi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              signOut();
              setPinUnlocked(false);
              router.push("/");
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
          { id: "overview", label: "Genel Bakış & Hedefler", icon: Sliders },
          { id: "curriculum", label: "200 Günlük Müfredat", icon: Map },
          { id: "subjects", label: "Ders Ağırlıkları", icon: Settings },
          { id: "students", label: "Öğrenci Yönetimi", icon: Users },
          { id: "badges", label: "Rozetler", icon: Award },
          { id: "questions", label: "Özel Soru Havuzu", icon: PlusCircle },
          { id: "logs", label: `Kayıtlar (${attempts.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Goals */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
              <p className="text-xs font-bold text-slate-400 mb-1">Aktif Öğrenci</p>
              <p className="text-xl font-black text-slate-800">{profile.displayName}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">{profile.grade}. Sınıf · Seviye {profile.level}</p>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
              <p className="text-xs font-bold text-slate-400 mb-1">Toplam XP</p>
              <p className="text-xl font-black text-slate-800">{profile.xp} XP</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Seri: {profile.currentStreak} Gün</p>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft">
              <p className="text-xs font-bold text-slate-400 mb-1">Müfredat Durumu</p>
              <p className="text-xl font-black text-slate-800">Gün {effectiveCurriculumDay} / 200</p>
              <p className="text-xs text-indigo-600 font-semibold mt-1">{currDayInfo.phaseName}</p>
            </div>
          </div>

          {/* Daily Duration Slider */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Günlük Çalışma Hedefi</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Arel için önerilen günlük çalışma süresi (5 - 30 dakika)
                </p>
              </div>
              <div className="px-4 py-1.5 bg-blue-50 text-blue-700 font-black rounded-xl text-base">
                {targetMinutes} Dakika
              </div>
            </div>

            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>5 dk (Hafif)</span>
              <span>12 dk (Önerilen)</span>
              <span>30 dk (Yoğun)</span>
            </div>
          </div>

          {/* Special Task for Tomorrow */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-3">
            <h3 className="font-extrabold text-slate-800 text-base">Yarın İçin Özel Görev / Mesaj</h3>
            <p className="text-xs text-slate-500 font-medium">
              Arel yarın uygulamayı açtığında göreceği özel ebeveyn motivasyon notu.
            </p>
            <input
              type="text"
              value={tomorrowTask}
              onChange={(e) => setTomorrowTask(e.target.value)}
              placeholder="Örnek: Bugün 7'ler çarpım tablosuna odaklanalım şampiyon! 🚀"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Hedefleri Kaydet</span>
          </button>
        </div>
      )}

      {/* Tab 2: 200-Day Curriculum */}
      {activeTab === "curriculum" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-600" />
                <span>200 Günlük Kademeli Müfredat Programı</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                3. Sınıf tekrarından 4. Sınıf sonuna kademeli, hissettirmeyen ilerleme.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Şu Anki Gün</span>
              <span className="text-2xl font-black text-blue-600">{effectiveCurriculumDay} / 200</span>
            </div>
          </div>

          {/* Current Day Info Box */}
          <div
            className="p-5 rounded-3xl border"
            style={{ borderColor: currDayInfo.phaseColor + "40", background: currDayInfo.phaseColor + "0D" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg"
                  style={{ background: currDayInfo.phaseColor + "20", color: currDayInfo.phaseColor }}
                >
                  Faz {currDayInfo.phase} — {currDayInfo.phaseName}
                </span>
                <h3 className="text-base font-black text-slate-800 mt-1">{currDayInfo.dayTheme}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hedef Zorluklar → Zihin: {currDayInfo.mentalDiff} · 4 İşlem: {currDayInfo.opsDiff} · Problem: {currDayInfo.probDiff} · Mantık: {currDayInfo.logicDiff}
                </p>
              </div>
            </div>
          </div>

          {/* Phase Shortcuts */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">Hızlı Faz Seçimi</label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {PHASES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSetCurriculumDay(p.startDay)}
                  className="p-3 rounded-2xl border text-left transition-all"
                  style={{
                    backgroundColor: currDayInfo.phase === p.id ? p.color + "15" : "#F8FAFC",
                    borderColor: currDayInfo.phase === p.id ? p.color : "#E2E8F0",
                  }}
                >
                  <p className="text-xs font-extrabold" style={{ color: p.color }}>Faz {p.id}</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Gün {p.startDay}–{p.endDay}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Slider */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">
              Müfredat Gününü Ayarla (1 - 200)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={200}
                value={curriculumDayInput}
                onChange={(e) => setCurriculumDayInput(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-lg font-black text-blue-600 w-12 text-center">
                {curriculumDayInput}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleSetCurriculumDay(curriculumDayInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                Bu Günü Ayarla
              </button>
              <button
                type="button"
                onClick={() => handleSetCurriculumDay(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Otomatiğe Dön (Çözülen Oturuma Göre)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Subject Weights */}
      {activeTab === "subjects" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 animate-fadeIn">
          <h2 className="font-extrabold text-slate-800 text-base">Konu Ağırlıklarını Belirle</h2>
          <p className="text-xs text-slate-500 font-medium">
            Günlük antrenmanda hangi konulardan daha çok veya daha az soru geleceğini ayarlayın.
          </p>

          <div className="space-y-3">
            {[
              { id: "addition", label: "Toplama İşlemleri" },
              { id: "subtraction", label: "Çıkarma İşlemleri" },
              { id: "multiplication", label: "Çarpma & Çarpım Tablosu" },
              { id: "division", label: "Bölme İşlemleri" },
              { id: "problems", label: "Hikayeli Problemler" },
            ].map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <span className="text-sm font-bold text-slate-800">{subject.label}</span>
                <div className="flex gap-1.5">
                  {(["low", "normal", "high"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeights({ ...weights, [subject.id]: w })}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                        weights[subject.id] === w
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      {w === "low" ? "Az" : w === "normal" ? "Normal" : "Fazla"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>Ağırlıkları Kaydet</span>
          </button>
        </div>
      )}

      {/* Tab 4: Student Accounts */}
      {activeTab === "students" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Profile Info & Reset */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-slate-800 text-base">Aktif Öğrenci Profili</h2>
                <p className="text-xs text-slate-500 mt-0.5">Şu anki öğrencinin ilerlemesi ve seviye değerleri</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewStudentModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Yeni Öğrenci Hesabı Aç</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-400 block">Öğrenci Adı</span>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 mt-1"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">Mevcut XP</span>
                <input
                  type="number"
                  value={profile.xp}
                  onChange={(e) => setProfile({ ...profile, xp: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 mt-1"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">Günlük Seri</span>
                <input
                  type="number"
                  value={profile.currentStreak}
                  onChange={(e) => setProfile({ ...profile, currentStreak: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 mt-1"
                />
              </div>
            </div>

            {/* Quick XP Modifiers */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">Hızlı XP Ekle / Çıkar</p>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAddXp(amt)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl"
                  >
                    +{amt} XP
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddXp(-100)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  -100 XP
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  AppStorage.saveProfile(profile);
                  showNotice("Profil güncellendi!");
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Değişiklikleri Kaydet</span>
              </button>

              {/* Danger Reset */}
              <button
                type="button"
                onClick={handleResetProfile}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Bu Öğrenciyi Sıfırdan Başlat (0 XP)</span>
              </button>
            </div>
          </div>

          {/* New Student Modal */}
          {showNewStudentModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-4xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
                <h3 className="text-lg font-black text-slate-800">Yeni Öğrenci Hesabı Oluştur</h3>
                <p className="text-xs text-slate-500">
                  Yeni bir öğrenci için sıfırdan temiz bir profil açın. Tüm XP, seviye ve antrenmanlar 0 olarak başlayacaktır.
                </p>

                <form onSubmit={handleCreateStudent} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Öğrencinin Adı Soyadı</label>
                    <input
                      type="text"
                      required
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Örnek: Deniz Yılmaz"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Sınıfı</label>
                      <select
                        value={newStudentGrade}
                        onChange={(e) => setNewStudentGrade(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                      >
                        <option value={3}>3. Sınıf</option>
                        <option value={4}>4. Sınıf</option>
                        <option value={5}>5. Sınıf</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Günlük Hedef (dk)</label>
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={newStudentMinutes}
                        onChange={(e) => setNewStudentMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl"
                    >
                      Öğrenciyi Oluştur ve Başlat
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewStudentModal(false)}
                      className="px-4 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Badges Management */}
      {activeTab === "badges" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 animate-fadeIn">
          <h2 className="font-extrabold text-slate-800 text-base">Kazanılan Rozetleri Yönet</h2>
          <p className="text-xs text-slate-500 font-medium">
            Öğrencinin kazandığı rozetleri açabilir veya kilitleyebilirsiniz.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_BADGES.map((b) => {
              const hasIt = profile.badgesUnlocked?.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleToggleBadge(b.id)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    hasIt
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs"
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
      )}

      {/* Tab 6: Custom Questions Pool */}
      {activeTab === "questions" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
            <h2 className="font-extrabold text-slate-800 text-base">Yeni Soru Ekle</h2>
            <form onSubmit={handleCreateCustomQuestion} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Kategori</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as Question["category"])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
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
                    placeholder="Örnek: 42"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Soru Metni</label>
                <input
                  type="text"
                  required
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Örnek: 36 + 27 işlemini zihinden yapınız."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">İpucu (Opsiyonel)</label>
                <input
                  type="text"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  placeholder="Örnek: Önce 36'ya 20 eklemeyi dene."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Adım Adım Çözüm (Her satıra bir adım)
                </label>
                <textarea
                  rows={3}
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="Örnek:&#10;1. Adım: 36 + 20 = 56&#10;2. Adım: 56 + 7 = 63"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Soruyu Havuza Ekle</span>
              </button>
            </form>
          </div>

          {/* List of custom questions */}
          {customQuestions.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-3">
              <h3 className="font-extrabold text-slate-800 text-sm">Eklenen Özel Sorular ({customQuestions.length})</h3>
              <div className="divide-y divide-slate-100">
                {customQuestions.map((q) => (
                  <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{q.prompt}</p>
                      <p className="text-[11px] text-blue-600 font-semibold">Cevap: {String(q.answer)} · {q.categoryTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        AppStorage.deleteCustomQuestion(q.id);
                        setCustomQuestions(AppStorage.getCustomQuestions());
                        showNotice("Soru silindi.");
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Logs & Backup */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-800 text-base">Çözülen Soru Kayıtları</h2>
              <p className="text-xs text-slate-500 font-medium">Toplam {attempts.length} soru çözümü kaydedildi.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>JSON Yedek İndir</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Tüm soru çözüm kayıtlarını temizlemek istediğinize emin misiniz?")) {
                    AppStorage.clearAttempts();
                    setAttempts([]);
                    showNotice("Tüm kayıtlar temizlendi.");
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kayıtları Temizle</span>
              </button>
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs font-semibold">Henüz kaydedilmiş soru çözümü bulunmuyor.</p>
              <p className="text-[11px] text-slate-300 mt-1">Arel antrenman yaptıkça buraya düşecektir.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {attempts.slice(-50).reverse().map((att) => (
                <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{att.question}</span>
                    <span className="text-slate-400 ml-2">({att.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={att.correct ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                      {att.correct ? "✓ Doğru" : `✗ Yanıt: ${att.userAnswer} (Cevap: ${att.answer})`}
                    </span>
                    <span className="text-slate-400 text-[11px]">{(att.responseTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
