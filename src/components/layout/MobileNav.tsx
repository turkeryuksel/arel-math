"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarCheck, Brain, ChartNoAxesColumnIncreasing, Settings } from "lucide-react";
import { useAuth } from "@/lib/firebase/authContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const baseItems = [
    { label: "Ana Sayfa", href: "/", icon: House },
    { label: "Antrenman", href: "/training", icon: CalendarCheck },
    { label: "Zihinden", href: "/mental-math", icon: Brain },
    { label: "İstatistik", href: "/stats", icon: ChartNoAxesColumnIncreasing },
  ];

  const items = isAdmin
    ? [...baseItems, { label: "Ebeveyn", href: "/parent", icon: Settings }]
    : baseItems;

  return (
    <nav className="flex items-center justify-around px-2 py-2 safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 stroke-[2.5]" : "text-slate-400"}`} />
            <span className="text-[10px] mt-1 font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
