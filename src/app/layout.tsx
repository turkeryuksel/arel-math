import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import OfflineBanner from "@/components/layout/OfflineBanner";
import { AuthProvider } from "@/lib/firebase/authContext";

import AppShell from "@/components/layout/AppShell";

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
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
