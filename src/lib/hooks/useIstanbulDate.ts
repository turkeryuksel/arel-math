"use client";

import { useEffect, useState } from "react";
import { getIstanbulDateString } from "@/lib/adaptive/streak";

export function useIstanbulDate() {
  const [date, setDate] = useState(() => getIstanbulDateString());
  useEffect(() => {
    const refresh = () => setDate(getIstanbulDateString());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return date;
}
