/**
 * 200-Günlük Müfredat Haritası
 * 
 * Arel Deniz için 3. sınıf konsolidasyonundan 4. sınıf ustalığına
 * kademeli, hissettirmeyen bir ilerleme programı.
 * 
 * Zorluk (1-10):
 *  1-2: 3. sınıf başı
 *  3-4: 3. sınıf sonu / 4. sınıf başı
 *  5-6: 4. sınıf ilk yarı
 *  7-8: 4. sınıf ikinci yarı
 *  9-10: 4. sınıf sonu / ilerisi
 */

import { SkillId } from "@/lib/questions/types";

export interface CurriculumDay {
  day: number;
  phase: 1 | 2 | 3 | 4 | 5;
  phaseName: string;
  phaseColor: string;
  mentalDiff: number;
  opsDiff: number;
  probDiff: number;
  logicDiff: number;
  focusSkills: SkillId[];
  dayTheme: string; // short description of today's focus
}

export interface Phase {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
  startDay: number;
  endDay: number;
  description: string;
}

export const PHASES: Phase[] = [
  {
    id: 1,
    name: "3. Sınıf Tekrarı",
    color: "#10B981", // emerald
    startDay: 1,
    endDay: 40,
    description: "Temel işlemleri pekiştir, güçlü temeller kur",
  },
  {
    id: 2,
    name: "Köprü Dönemi",
    color: "#3B82F6", // blue
    startDay: 41,
    endDay: 80,
    description: "Çarpım tabloları ve 3 basamaklı işlemlere adım at",
  },
  {
    id: 3,
    name: "4. Sınıf Temeli",
    color: "#8B5CF6", // violet
    startDay: 81,
    endDay: 120,
    description: "Çok basamaklı çarpma ve bölmeye giriş",
  },
  {
    id: 4,
    name: "4. Sınıf İlerisi",
    color: "#F59E0B", // amber
    startDay: 121,
    endDay: 160,
    description: "Karmaşık işlemler, çok adımlı problemler",
  },
  {
    id: 5,
    name: "4. Sınıf Ustalık",
    color: "#EF4444", // red
    startDay: 161,
    endDay: 200,
    description: "Kesirler, ondalıklar ve ileri problem çözme",
  },
];

/**
 * Her güne ait zorluğu kademeli olarak hesaplar.
 * Doğrusal artış yerine hafif sigmoid eğrisi kullanır
 * — başta yavaş, ortada hızlı, sonda tekrar yavaş.
 */
function smoothDiff(day: number, minDiff: number, maxDiff: number): number {
  const t = (day - 1) / 199; // 0 to 1
  // Cubic ease-in-out for natural feel
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const raw = minDiff + eased * (maxDiff - minDiff);
  // Round to nearest 0.5 for cleaner steps, then floor to int
  return Math.round(raw * 2) / 2;
}

/** Returns an integer difficulty (1–10) for the given day and track */
function getDiff(day: number, track: "mental" | "ops" | "prob" | "logic"): number {
  // Each track has slightly different range and pace
  const configs = {
    mental: { min: 2, max: 8, lag: 0 },    // starts easy, good for warm-up
    ops:    { min: 2, max: 8, lag: 5 },    // slightly behind mental
    prob:   { min: 2, max: 7, lag: 10 },   // hardest jump, bit slower
    logic:  { min: 2, max: 9, lag: -5 },   // logic leads slightly
  };
  const cfg = configs[track];
  const adjustedDay = Math.max(1, Math.min(200, day + cfg.lag));
  const val = smoothDiff(adjustedDay, cfg.min, cfg.max);
  return Math.max(1, Math.min(10, Math.floor(val)));
}

/** Returns the focus skills for a given curriculum day */
function getFocusSkills(day: number): SkillId[] {
  if (day <= 15) {
    return ["mental.addition", "mental.subtraction", "operations.addition"];
  } else if (day <= 30) {
    return ["mental.subtraction", "operations.subtraction", "operations.addition"];
  } else if (day <= 40) {
    return ["mental.addition", "mental.subtraction", "logic.sequence", "logic.missingNumber"];
  } else if (day <= 55) {
    return ["multiplication.table.2", "multiplication.table.3", "multiplication.table.4", "multiplication.table.5"];
  } else if (day <= 70) {
    return ["multiplication.table.5", "multiplication.table.6", "operations.multiplication", "mental.multiplication"];
  } else if (day <= 80) {
    return ["mental.division", "multiplication.table.4", "multiplication.table.6", "logic.pyramid"];
  } else if (day <= 95) {
    return ["multiplication.table.7", "multiplication.table.8", "operations.multiplication", "mental.multiplication"];
  } else if (day <= 110) {
    return ["multiplication.table.9", "multiplication.table.10", "operations.division", "mental.division"];
  } else if (day <= 120) {
    return ["multiplication.table.11", "multiplication.table.12", "operations.multiplication", "logic.chain"];
  } else if (day <= 135) {
    return ["mental.multiplication", "operations.multiplication", "problem.multiplication", "logic.chain"];
  } else if (day <= 150) {
    return ["operations.division", "problem.division", "mental.division", "logic.comparison"];
  } else if (day <= 160) {
    return ["problem.multiStep", "operations.multiplication", "operations.division", "logic.estimate"];
  } else if (day <= 175) {
    return ["problem.multiStep", "problem.division", "logic.estimate", "logic.sequence"];
  } else if (day <= 190) {
    return ["problem.multiStep", "mental.multiplication", "mental.division", "logic.chain"];
  } else {
    return ["problem.multiStep", "operations.division", "logic.estimate", "logic.chain"];
  }
}

/** Returns a short theme description for the day */
function getDayTheme(day: number): string {
  if (day <= 10) return "Toplama ve çıkarmayı pekiştir";
  if (day <= 20) return "2 basamaklı zihinden işlemler";
  if (day <= 30) return "Elde taşımalı işlemler";
  if (day <= 40) return "Sayı örüntüleri ve diziler";
  if (day <= 50) return "Çarpım tablosu: 2, 3, 4, 5";
  if (day <= 60) return "Çarpım tablosu: 5, 6 ve tekrar";
  if (day <= 70) return "Çarpma ve bölmeye giriş";
  if (day <= 80) return "3 basamaklı işlemler";
  if (day <= 90) return "Çarpım tablosu: 7, 8";
  if (day <= 100) return "Çarpım tablosu: 9, 10";
  if (day <= 110) return "Çok basamaklı çarpma";
  if (day <= 120) return "Çarpım tablosu: 11, 12 — tamamlandı!";
  if (day <= 130) return "2 basamak × 1 basamak çarpma";
  if (day <= 140) return "Kalanıyla bölme";
  if (day <= 150) return "3 basamak × 1 basamak çarpma";
  if (day <= 160) return "Çok adımlı problemler";
  if (day <= 170) return "2 basamak × 2 basamak çarpma";
  if (day <= 180) return "İleri bölme ve kesirler";
  if (day <= 190) return "Karmaşık problem çözme";
  return "4. Sınıf ustalık sınavı!";
}

function getPhaseForDay(day: number): Phase {
  return PHASES.find((p) => day >= p.startDay && day <= p.endDay) || PHASES[4];
}

/**
 * Generates the CurriculumDay spec for a given day index (1-200).
 * Days beyond 200 are capped at 200.
 */
export function getCurriculumDay(dayIndex: number): CurriculumDay {
  const day = Math.max(1, Math.min(200, dayIndex));
  const phase = getPhaseForDay(day);

  return {
    day,
    phase: phase.id,
    phaseName: phase.name,
    phaseColor: phase.color,
    mentalDiff: getDiff(day, "mental"),
    opsDiff: getDiff(day, "ops"),
    probDiff: getDiff(day, "prob"),
    logicDiff: getDiff(day, "logic"),
    focusSkills: getFocusSkills(day),
    dayTheme: getDayTheme(day),
  };
}

/** Get phase info by phase ID */
export function getPhaseById(phaseId: 1 | 2 | 3 | 4 | 5): Phase {
  return PHASES.find((p) => p.id === phaseId) || PHASES[0];
}
