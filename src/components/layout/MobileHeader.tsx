"use client";

import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";

export default function MobileHeader() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur-md md:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-xs font-extrabold text-slate-800">Arel&apos;le Öğreniyorum</span>
          <span className="block truncate text-[10px] font-semibold text-slate-400">
            {profile.displayName} · Seviye {profile.level}
          </span>
        </span>
      </Link>
      <button
        type="button"
        aria-label="Çıkış yap"
        title="Çıkış yap"
        onClick={async () => {
          await signOut();
          router.replace("/login");
        }}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  );
}
