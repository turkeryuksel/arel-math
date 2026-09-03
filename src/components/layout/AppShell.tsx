"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import OfflineBanner from "@/components/layout/OfflineBanner";
import AuthGuard from "@/components/layout/AuthGuard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");

  if (isLoginPage) {
    return (
      <main className="min-h-screen w-full bg-[#F4F7FB]">
        {children}
      </main>
    );
  }

  return (
    <AuthGuard>
      <OfflineBanner />
      {/* Desktop Left Sidebar */}
      <div className="hidden md:block w-64 lg:w-72 flex-shrink-0 h-screen sticky top-0 border-r border-slate-200/80 bg-white shadow-[2px_0_12px_rgba(0,0,0,0.02)] z-30">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-24 md:pb-8 flex flex-col overflow-y-auto">
        {children}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
