"use client";

import { Delete, CornerDownLeft } from "lucide-react";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function NumericKeypad({
  onKeyPress,
  onDelete,
  onSubmit,
  disabled = false,
}: NumericKeypadProps) {
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["-", "0", "del"],
  ];

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {keys.flat().map((k, idx) => {
          if (k === "del") {
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={onDelete}
                className="h-14 sm:h-16 rounded-2xl bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center shadow-xs active:scale-95 transition-all disabled:opacity-50"
                aria-label="Sil"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onKeyPress(k)}
              className="h-14 sm:h-16 rounded-2xl bg-white active:bg-blue-50 border border-slate-200/80 text-slate-800 font-extrabold text-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {k}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="mt-3 w-full h-14 sm:h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <span>Cevapla</span>
        <CornerDownLeft className="w-5 h-5" />
      </button>
    </div>
  );
}
