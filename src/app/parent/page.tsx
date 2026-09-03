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
  Edit2,
  KeyRound,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { UserProfile, Question, Attempt } from "@/lib/questions/types";
import { ALL_BADGES } from "@/data/badges/badgeList";
import { useAuth } from "@/lib/firebase/authContext";
import { createStudentAuthAccount } from "@/lib/firebase/auth";
import { getCurriculumDay, PHASES } from "@/lib/curriculum/map";
import { calculateCurriculumDay } from "@/lib/curriculum/progress";

export default function ParentUnifiedPage() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [students, setStudents] = useState<UserProfile[]>([]);
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

  // New Student Modal State
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState(4);
  const [newStudentMinutes, setNewStudentMinutes] = useState(12);
  const [newStudentLoading, setNewStudentLoading] = useState(false);
  const [newStudentError, setNewStudentError] = useState("");

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState(4);
  const [editMinutes, setEditMinutes] = useState(12);
  const [editXp, setEditXp] = useState(0);
  const [editStreak, setEditStreak] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const p = AppStorage.getProfile();
    const stList = AppStorage.getStudents();
    setProfile(p);
    setStudents(stList);
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

  // Only authorized for admin (turker@taximact.com)
  const isAuthorized = Boolean(
    isAdmin || (user && user.email?.trim().toLowerCase() === "turker@taximact.com")
  );

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
  const handleResetProfile = (studentId?: string) => {
    const target = studentId ? students.find((s) => s.id === studentId) || profile : profile;
    if (
      window.confirm(
        `${target.displayName} kullanıcısının tüm verilerini sıfırlamak istediğinize emin misiniz? (0 XP, Seviye 1, 0 Seri)`
      )
    ) {
      if (studentId && studentId !== profile.id) {
        const updated: UserProfile = {
          ...target,
          xp: 0,
          level: 1,
          currentStreak: 0,
          bestStreak: 0,
          completedSessions: 0,
          badgesUnlocked: [],
        };
        AppStorage.saveStudent(updated);
      } else {
        AppStorage.resetArelProfile();
      }
      loadData();
      showNotice("Profil sıfırlandı! Yeni başlangıç hazır (0 XP).");
    }
  };

  // Quick XP adjuster
  const handleAddXp = (amount: number) => {
    const updated = { ...profile, xp: Math.max(0, profile.xp + amount) };
    AppStorage.saveProfile(updated);
    setProfile(updated);
    loadData();
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

  // Create new student profile with real Firebase Auth credentials
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewStudentError("");

    if (!newStudentName.trim()) {
      setNewStudentError("Lütfen öğrenci adını giriniz.");
      return;
    }
    if (!newStudentEmail.trim() || !newStudentEmail.includes("@")) {
      setNewStudentError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (newStudentPassword.length < 6) {
      setNewStudentError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setNewStudentLoading(true);

    try {
      // 1. Create student account in Firebase Auth without logging out current parent
      const authUser = await createStudentAuthAccount(
        newStudentEmail.trim(),
        newStudentPassword
      );

      // 2. Create student profile in AppStorage & Firestore
      const newProf: UserProfile = {
        ...profile,
        id: authUser.uid || `student_${Date.now()}`,
        displayName: newStudentName.trim(),
        email: newStudentEmail.trim().toLowerCase(),
        grade: newStudentGrade,
        targetMinutes: newStudentMinutes,
        xp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        completedSessions: 0,
        badgesUnlocked: [],
      };

      AppStorage.addStudent(newProf);
      AppStorage.setActiveStudent(newProf.id);

      setShowNewStudentModal(false);
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentPassword("");
      loadData();
      showNotice(
        `Yeni öğrenci "${newProf.displayName}" (${newProf.email}) başarıyla oluşturuldu!`
      );
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      if (e.code === "auth/email-already-in-use") {
        setNewStudentError("Bu e-posta adresi ile kayıtlı bir hesap zaten var.");
      } else {
        setNewStudentError(e.message || "Öğrenci hesabı oluşturulurken bir hata oluştu.");
      }
    } finally {
      setNewStudentLoading(false);
    }
  };

  // Switch active student
  const handleSwitchActiveStudent = (id: string) => {
    const updated = AppStorage.setActiveStudent(id);
    setProfile(updated);
    loadData();
    showNotice(`Aktif öğrenci "${updated.displayName}" olarak değiştirildi.`);
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;

    if (students.length <= 1) {
      alert("Sistemde en az bir öğrenci hesabı bulunmalıdır.");
      return;
    }

    if (
      window.confirm(
        `"${target.displayName}" adlı öğrenci hesabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      try {
        AppStorage.deleteStudent(studentId);
        loadData();
        showNotice(`"${target.displayName}" hesabı silindi.`);
      } catch (err: unknown) {
        const e = err as Error;
        alert(e.message);
      }
    }
  };

  // Start editing student
  const handleStartEditStudent = (student: UserProfile) => {
    setEditingStudent(student);
    setEditName(student.displayName);
    setEditGrade(student.grade || 4);
    setEditMinutes(student.targetMinutes || 12);
    setEditXp(student.xp || 0);
    setEditStreak(student.currentStreak || 0);
  };

  // Save student edit
  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updated: UserProfile = {
      ...editingStudent,
      displayName: editName.trim() || editingStudent.displayName,
      grade: editGrade,
      targetMinutes: editMinutes,
      xp: Math.max(0, editXp),
      currentStreak: Math.max(0, editStreak),
    };

    AppStorage.saveStudent(updated);
    setEditingStudent(null);
    loadData();
    showNotice(`"${updated.displayName}" bilgileri güncellendi!`);
  };

  // JSON Export
  const handleExportJSON = () => {
    const data = {
      profile,
      students,
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

  // If not authorized, show clean unauthorized screen (no PIN, no bypass)
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Ebeveyn Yetkisi Gerekli
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Bu alana yalnızca ebeveyn (yönetici) hesabı ile erişilebilir. Lütfen ebeveyn e-postanız ile giriş yapınız.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            <span>Giriş Sayfasına Git</span>
          </button>
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
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Öğrenci profilleri, müfredat, hedefler ve soru havuzunu buradan yönetin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl truncate">
            {user?.email || "turker@taximact.com"}
          </span>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors"
          >
            Çıkış
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-2xl flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold scrollbar-none">
        {[
          { id: "overview", label: "Genel Bakış" },
          { id: "students", label: `Öğrenci Yönetimi (${students.length})` },
          { id: "curriculum", label: "200 Günlük Müfredat" },
          { id: "subjects", label: "Ders Ağırlıkları" },
          { id: "badges", label: "Rozetler" },
          { id: "questions", label: "Özel Soru Havuzu" },
          { id: "logs", label: "Kayıtlar & Yedek" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Student Card */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-md flex-shrink-0 bg-white/10">
                  <Image
                    src="/avatars/arel.png"
                    alt={profile.displayName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      Aktif Öğrenci
                    </span>
                    <span className="text-xs text-white/80 font-bold">{profile.grade}. Sınıf</span>
                  </div>
                  <h2 className="text-2xl font-black mt-0.5">{profile.displayName}</h2>
                  <p className="text-xs text-white/70 mt-0.5">{profile.email || "E-posta atanmadı"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3">
                  <p className="text-[10px] text-white/70 font-bold">Toplam XP</p>
                  <p className="text-lg font-black">{profile.xp}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3">
                  <p className="text-[10px] text-white/70 font-bold">Günlük Seri</p>
                  <p className="text-lg font-black">{profile.currentStreak} gün</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3">
                  <p className="text-[10px] text-white/70 font-bold">Müfredat Günü</p>
                  <p className="text-lg font-black">{effectiveCurriculumDay} / 200</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Target Minutes */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Günlük Antrenman Süresi</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Öğrencinin her gün tamamlaması hedeflenen dakika miktarı.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-base font-black text-blue-600 w-16 text-right">
                  {targetMinutes} dk
                </span>
              </div>
            </div>

            {/* Special Task for Tomorrow */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-800 text-sm">Öğrenciye Özel Görev / Mesaj</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Ana sayfadaki motivasyon kutusunda öğrenciye gösterilecek özel not.
              </p>
              <input
                type="text"
                value={tomorrowTask}
                onChange={(e) => setTomorrowTask(e.target.value)}
                placeholder="Örnek: Bugün 7'ler çarpım tablosuna özellikle dikkat et!"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-blue-600"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Student Accounts Management */}
      {activeTab === "students" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header with Add Student Button */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-slate-800 text-base">Öğrenci Hesapları</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sistemdeki tüm öğrenci hesaplarını yönetin, yeni öğrenci ekleyin, düzenleyin veya çıkarın.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewStudentError("");
                setShowNewStudentModal(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Yeni Öğrenci Hesabı Aç</span>
            </button>
          </div>

          {/* Students List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((st) => {
              const isActive = profile.id === st.id;
              return (
                <div
                  key={st.id}
                  className={`bg-white rounded-3xl p-6 border transition-all ${
                    isActive
                      ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                      : "border-slate-100 shadow-soft hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shadow-xs">
                        {st.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{st.displayName}</h3>
                          {isActive && (
                            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {st.email || "E-posta atanmadı"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditStudent(st)}
                        title="Öğrenciyi Düzenle"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(st.id)}
                        title="Öğrenciyi Sil"
                        disabled={students.length <= 1}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Student Stats Bar */}
                  <div className="grid grid-cols-4 gap-2 my-4 p-3 bg-slate-50 rounded-2xl text-center text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Sınıf</span>
                      <span className="font-extrabold text-slate-700">{st.grade}. Sınıf</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Hedef</span>
                      <span className="font-extrabold text-slate-700">{st.targetMinutes || 12} dk</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">XP</span>
                      <span className="font-extrabold text-blue-600">{st.xp || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Seri</span>
                      <span className="font-extrabold text-emerald-600">{st.currentStreak || 0} g</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => handleSwitchActiveStudent(st.id)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
                      >
                        Bu Öğrenciyi Aktif Yap
                      </button>
                    ) : (
                      <span className="flex-1 py-2 text-center text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl">
                        ✓ Şu An Seçili Profil
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResetProfile(st.id)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors"
                      title="İlerlemeyi Sıfırla (0 XP)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick XP Modifiers for Active Student */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-3">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Aktif Öğrenci ({profile.displayName}) İçin Hızlı XP Ayarla
            </h3>
            <div className="flex flex-wrap gap-2">
              {[50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddXp(amt)}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                >
                  +{amt} XP
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleAddXp(-100)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                -100 XP
              </button>
            </div>
          </div>

          {/* New Student Modal */}
          {showNewStudentModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800">Yeni Öğrenci Hesabı Oluştur</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewStudentModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Öğrencinin sisteme giriş yapabilmesi için e-posta ve şifre belirleyiniz.
                </p>

                {newStudentError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold">
                    {newStudentError}
                  </div>
                )}

                <form onSubmit={handleCreateStudent} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Öğrencinin Adı Soyadı
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Örnek: Deniz Yılmaz"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Öğrenci Giriş E-postası
                    </label>
                    <input
                      type="email"
                      required
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      placeholder="deniz@arelmath.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">
                      Giriş Şifresi (En az 6 karakter)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Sınıfı</label>
                      <select
                        value={newStudentGrade}
                        onChange={(e) => setNewStudentGrade(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                      >
                        <option value={3}>3. Sınıf</option>
                        <option value={4}>4. Sınıf</option>
                        <option value={5}>5. Sınıf</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">
                        Günlük Hedef (dk)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={newStudentMinutes}
                        onChange={(e) => setNewStudentMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={newStudentLoading}
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200"
                    >
                      {newStudentLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Hesap Açılıyor...</span>
                        </>
                      ) : (
                        <span>Öğrenciyi Oluştur ve Kaydet</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={newStudentLoading}
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

          {/* Edit Student Modal */}
          {editingStudent && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800">
                    Öğrenciyi Düzenle: {editingStudent.displayName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditStudent} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Adı Soyadı</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Sınıfı</label>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                      >
                        <option value={3}>3. Sınıf</option>
                        <option value={4}>4. Sınıf</option>
                        <option value={5}>5. Sınıf</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">
                        Günlük Hedef (dk)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Mevcut XP</label>
                      <input
                        type="number"
                        min={0}
                        value={editXp}
                        onChange={(e) => setEditXp(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Günlük Seri (Gün)</label>
                      <input
                        type="number"
                        min={0}
                        value={editStreak}
                        onChange={(e) => setEditStreak(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                    >
                      <Save className="w-4 h-4" />
                      <span>Değişiklikleri Kaydet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
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

      {/* Tab 3: Curriculum Control */}
      {activeTab === "curriculum" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-extrabold text-slate-800 text-base">200 Günlük Müfredat İlerlemesi</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Müfredatı ileri/geri alabilir veya belirli bir faza atlayabilirsiniz.
            </p>
          </div>

          <div
            className="p-4 rounded-2xl border"
            style={{
              borderColor: currDayInfo.phaseColor + "40",
              background: currDayInfo.phaseColor + "0D",
            }}
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
                  Hedef Zorluklar → Zihin: {currDayInfo.mentalDiff} · 4 İşlem: {currDayInfo.opsDiff} ·
                  Problem: {currDayInfo.probDiff} · Mantık: {currDayInfo.logicDiff}
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
                  <p className="text-xs font-extrabold" style={{ color: p.color }}>
                    Faz {p.id}
                  </p>
                  <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gün {p.startDay}–{p.endDay}
                  </p>
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

      {/* Tab 4: Subject Weights */}
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        weights[subject.id] === w
                          ? w === "high"
                            ? "bg-emerald-600 text-white"
                            : w === "low"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {w === "high" ? "Çok" : w === "low" ? "Az" : "Normal"}
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
                  <Award
                    className={`w-4 h-4 flex-shrink-0 ${hasIt ? "text-emerald-600" : "text-slate-300"}`}
                  />
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
              <h3 className="font-extrabold text-slate-800 text-sm">
                Eklenen Özel Sorular ({customQuestions.length})
              </h3>
              <div className="divide-y divide-slate-100">
                {customQuestions.map((q) => (
                  <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{q.prompt}</p>
                      <p className="text-[11px] text-blue-600 font-semibold">
                        Cevap: {String(q.answer)} · {q.categoryTitle}
                      </p>
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
              <p className="text-xs text-slate-500 font-medium">
                Toplam {attempts.length} soru çözümü kaydedildi.
              </p>
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
              <p className="text-[11px] text-slate-300 mt-1">Öğrenci antrenman yaptıkça buraya düşecektir.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {attempts
                .slice(-50)
                .reverse()
                .map((att) => (
                  <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{att.question}</span>
                      <span className="text-slate-400 ml-2">({att.category})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={att.correct ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {att.correct ? "✓ Doğru" : `✗ Yanıt: ${att.userAnswer} (Cevap: ${att.answer})`}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {(att.responseTimeMs / 1000).toFixed(1)}s
                      </span>
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
