"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarCheck, Brain, Gamepad2, Puzzle, Settings } from "lucide-react";
import { useAuth } from "@/lib/firebase/authContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const baseItems = [
    { label: "Ana Sayfa", href: "/", icon: House },
    { label: "Görevler", href: "/training", icon: CalendarCheck },
    { label: "Zihinden", href: "/mental-math", icon: Brain },
    { label: "Macera", href: "/problems", icon: Puzzle },
    { label: "Oyunlar", href: "/games", icon: Gamepad2 },
  ];

  const items = isAdmin
    ? [...baseItems, { label: "Ebeveyn", href: "/parent", icon: Settings }]
    : baseItems;

  return (
    <nav className="flex items-center justify-around px-1 py-1.5 safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1 py-1 transition-colors ${
              isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 stroke-[2.5]" : "text-slate-400"}`} />
            <span className="mt-1 max-w-full truncate text-[9px] font-semibold sm:text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
