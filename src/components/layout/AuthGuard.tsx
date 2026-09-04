"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";

const PUBLIC_PATHS = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, dataError } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (!user && !isPublic) {
      router.replace("/login");
    }
  }, [user, isLoading, pathname, router]);

  // While loading, show nothing (prevents flash)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center animate-pulse">
            <span className="text-xl">🧠</span>
          </div>
          <p className="text-sm font-semibold text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (user && dataError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-6">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-lg">
          <p className="font-extrabold text-rose-700">Veriler yüklenemedi</p>
          <p className="mt-2 text-sm font-medium text-slate-600">{dataError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Not logged in and not on a public path — don't render
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!user && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
