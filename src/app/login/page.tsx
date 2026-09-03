"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, UserPlus, LogIn, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { loginWithEmail, registerWithEmail } from "@/lib/firebase/auth";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { useAuth } from "@/lib/firebase/authContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          throw new Error("Şifre en az 6 karakter olmalıdır.");
        }
        await registerWithEmail(email, password);
        const targetRoute = email.trim().toLowerCase() === "turker@taximact.com" ? "/parent" : "/";
        setTimeout(() => router.push(targetRoute), 1200);
      } else {
        await loginWithEmail(email, password);
        setSuccessMsg("Giriş başarılı! Yönlendiriliyorsunuz...");
        const targetRoute = email.trim().toLowerCase() === "turker@taximact.com" ? "/parent" : "/";
        setTimeout(() => router.push(targetRoute), 1000);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickArelLogin = (startFresh: boolean = false) => {
    if (startFresh) {
      AppStorage.resetArelProfile();
      refreshProfile();
    }
    router.push("/");
  };


  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
              <Image
                src="/avatars/arel.png"
                alt="Arel Deniz"
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Arel&apos;in Matematik Macerası
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Giriş yapın veya Arel&apos;in matematik yolculuğunu sıfırdan başlatın.
          </p>
        </div>

        {/* Option 1: Quick Arel Entry (Child Mode) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Arel Olarak Başla</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
              Hızlı Giriş
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Şifre girmeden doğrudan günlük antrenman sayfasına geçin.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickArelLogin(false)}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-300 transition-all"
            >
              <span>Mevcutla Devam Et</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickArelLogin(true)}
              className="h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span>Sıfırdan Başlat (0 XP)</span>
            </button>
          </div>
        </div>

        {/* Option 2: Firebase Auth E-posta / Şifre Girişi & Kaydı */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-800">
                {mode === "signin" ? "Ebeveyn Girişi" : "Yeni Hesap Oluştur (Auth)"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setSuccessMsg("");
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              {mode === "signin" ? "+ Yeni Kullanıcı Aç" : "Zaten hesabım var"}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="veli@arelmath.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-blue-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-indigo-300 transition-all mt-2"
            >
              {mode === "signin" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? "Giriş yapılıyor..." : "Giriş Yap"}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? "Oluşturuluyor..." : "Hesabı Oluştur"}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
            ← Ana Sayfaya Geri Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
