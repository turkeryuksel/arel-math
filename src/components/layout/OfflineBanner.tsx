"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-0 bottom-[68px] z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-white shadow-sm animate-fadeIn md:bottom-auto md:top-0 md:text-sm">
      <WifiOff className="w-4 h-4" />
      <span>İnternet bağlantın kesildi. Cevaplarının kaybolmaması için bağlantı gelince devam et.</span>
    </div>
  );
}
