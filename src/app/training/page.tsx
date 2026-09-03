"use client";

import { Suspense } from "react";
import TrainingSessionView from "@/components/training/TrainingSessionView";

export default function TrainingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <p className="text-slate-500 font-medium">Antrenman yükleniyor...</p>
        </div>
      }
    >
      <TrainingSessionView />
    </Suspense>
  );
}
