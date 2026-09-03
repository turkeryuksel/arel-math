import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import OfflineBanner from "@/components/layout/OfflineBanner";

export const metadata: Metadata = {
  title: "Arel'in Matematik Macerası | Günlük Matematik Antrenmanı",
  description: "Arel Deniz için kişisel, eğlenceli ve adaptif günlük matematik antrenman sistemi.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arel Matematik",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/avatars/arel.png" />
      </head>
      <body className="min-h-screen bg-[#F4F7FB] text-slate-800 antialiased flex flex-col md:flex-row">
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
      </body>
    </html>
  );
}
