"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, CheckCircle2, Lock, LogIn, Mail, Loader2, Puzzle, Sparkles } from "lucide-react";
import { loginWithEmail } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/firebase/authContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isLoading) router.replace(isAdmin ? "/parent" : "/");
  }, [user, isAdmin, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") {
        setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
      } else {
        setError(e.message || "Giriş yapılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-amber-50 px-4 py-6 sm:px-6 lg:flex lg:items-center lg:py-10">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        {/* Welcome */}
        <section className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-extrabold text-blue-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Bugün yeni bir şey keşfedelim
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-[2rem] bg-white ring-4 ring-white shadow-xl sm:h-28 sm:w-28">
              <Image
                src="/avatars/arel.png"
                alt="Arel"
                fill
                sizes="112px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Arel&apos;le Öğreniyorum
              </h1>
              <p className="mt-1 text-sm font-extrabold text-blue-600 sm:text-base">
                İlk durağımız: Matematik
              </p>
            </div>
          </div>

          <h2 className="mt-5 text-xl font-black leading-tight text-slate-800 sm:text-2xl">
            Hazırsan birlikte düşünelim, deneyelim ve keşfedelim!
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 lg:mx-0">
            Günlük görevlerini tamamla ya da sevdiğin bir dünyayı seçip yepyeni sorular çöz.
            Burada hata yapmak öğrenmenin eğlenceli bir parçası.
          </p>

          <div className="mt-5 hidden grid-cols-3 gap-3 sm:grid lg:grid">
            {[
              { icon: CheckCircle2, title: "Günlük görevler", color: "text-emerald-600 bg-emerald-50" },
              { icon: Puzzle, title: "Problem macerası", color: "text-amber-600 bg-amber-50" },
              { icon: BookOpen, title: "Kendi hızında", color: "text-indigo-600 bg-indigo-50" },
            ].map(({ icon: Icon, title, color }) => (
              <div key={title} className="rounded-2xl border border-white bg-white/75 p-3 text-left shadow-sm backdrop-blur">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-xs font-extrabold text-slate-700">{title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Login Form */}
        <div className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-800">Haydi başlayalım 👋</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Öğrenci veya ebeveyn hesabınla giriş yap.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-semibold text-center">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-13 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
            İlerlemen güvenle hesabına kaydedilir.
          </p>
        </div>
      </div>
    </div>
  );
}
