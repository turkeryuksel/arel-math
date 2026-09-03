"use client";

import Link from "next/link";
import { Triangle } from "lucide-react";

export default function NumberPyramidCard() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        Önerilen Egzersiz
      </p>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left info */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Triangle className="w-6 h-6 stroke-[2.2] fill-purple-200" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">Sayı Piramidi</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mt-0.5">
              Eksik sayıları bul ve piramidi tamamla!
            </p>
            <Link
              href="/brain?type=pyramid"
              className="inline-block mt-3 min-h-[40px] px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors"
            >
              Hemen Çöz
            </Link>
          </div>
        </div>

        {/* Right visual pyramid diagram */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1.5 select-none scale-90 sm:scale-100">
            {/* Top row */}
            <div className="flex justify-center">
              <div className="w-11 h-7 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shadow-xs">
                64
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex justify-center gap-1.5">
              <div className="w-10 h-7 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center">
                32
              </div>
              <div className="w-10 h-7 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center">
                32
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex justify-center gap-1.5">
              <div className="w-9 h-6 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center">
                16
              </div>
              <div className="w-9 h-6 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center">
                16
              </div>
              <div className="w-9 h-6 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center justify-center">
                16
              </div>
            </div>

            {/* Row 4 (Base) */}
            <div className="flex justify-center gap-1.5">
              <div className="w-8 h-6 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-center">
                8
              </div>
              <div className="w-8 h-6 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-center">
                8
              </div>
              <div className="w-8 h-6 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-center">
                8
              </div>
              <div className="w-8 h-6 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-center">
                8
              </div>
            </div>
          </div>

          <div className="text-4xl font-black text-blue-600 animate-pulse">?</div>
        </div>
      </div>
    </div>
  );
}
