import { generateTableQuestion } from "@/lib/questions/multiplicationTable";
import { SeededRandom } from "@/lib/questions/seed";
import type { Question } from "@/lib/questions/types";

export const COSMOS_ROUNDS = 15;
export const COSMOS_TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export type FlightMode = "calm" | "flight";
export const COSMOS_REGIONS = [
  { name: "Ay Bahçesi", caption: "İlk yıldızlarını topla", color: "#9ae6d7" },
  { name: "Satürn Yolu", caption: "Işık izini takip et", color: "#f4cd8c" },
  { name: "Büyük Takımyıldız", caption: "Son beş keşif; şekli tamamla", color: "#d6bbff" },
];

export function createCosmosQuestion(runId: string, index: number, tables: number[], recent: Set<string>, reviewTable?: number): Question {
  const allowed = COSMOS_TABLES.filter((table) => tables.includes(table));
  if (!allowed.length) throw new Error("En az bir çarpım tablosu seçmelisin.");
  const rng = new SeededRandom(`${runId}:${index}`);
  // Cycle the selected tables in a shuffled order, so every selected table gets a turn.
  const order = new SeededRandom(runId).shuffle(allowed);
  const table = reviewTable && allowed.includes(reviewTable) ? reviewTable : order[index % order.length];
  const question = generateTableQuestion(table, table > 10 ? 6 : 3, rng, recent);
  const answer = Number(question.answer);
  const factor = Number(question.metadata?.factor);
  const choices = new Set([answer]);
  for (const value of rng.shuffle([answer + table, answer - table, answer + factor, answer - factor, table + factor])) {
    if (value > 0) choices.add(value);
    if (choices.size === 4) break;
  }
  for (let offset = 1; choices.size < 4; offset++) choices.add(answer + offset);
  return { ...question, id: `cosmos_${runId}_${index}`, questionType: "multipleChoice", choices: rng.shuffle([...choices]) };
}

export interface Point { x: number; y: number }
/** Segment collision catches fast swipes that cross a target between pointer events. */
export function segmentHitsCircle(from: Point, to: Point, center: Point, radius: number): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((center.x - from.x) * dx + (center.y - from.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(from.x + t * dx - center.x, from.y + t * dy - center.y) <= radius;
}

export function orbPosition(index: number, width: number, height: number, seconds: number, mode: FlightMode, reducedMotion = false): Point {
  const x = width * (0.15 + index * 0.2333);
  if (reducedMotion) return { x, y: height * (index % 2 ? 0.58 : 0.4) };
  if (mode === "calm") return { x, y: height * (index % 2 ? 0.58 : 0.4) + Math.sin(seconds * 0.7 + index * 1.8) * 14 };
  const phase = ((seconds / 5.5 + index * 0.22) % 1 + 1) % 1;
  return { x: x + Math.sin(phase * Math.PI * 2 + index) * width * 0.035, y: height * (0.2 + 0.57 * (2 * phase - 1) ** 2) };
}
