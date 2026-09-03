import { Question, SkillId } from "./types";
import { SeededRandom, createRng } from "./seed";

export function generateTableQuestion(
  targetTable?: number,
  difficulty: number = 3,
  rng?: SeededRandom,
  recentSignatures: Set<string> = new Set()
): Question {
  const r = rng || createRng();
  const maxTable = difficulty > 5 ? 12 : 10;

  let attempts = 0;
  let q: Question | null = null;

  while (attempts < 20) {
    const table = targetTable || r.range(2, maxTable);
    const factor = r.range(2, 10);
    const signature = `table_${table}x${factor}`;

    if (!recentSignatures.has(signature)) {
      const id = `tbl_${Date.now()}_${r.range(1000, 9999)}`;
      const prompt = `${table} × ${factor}`;
      const answer = table * factor;
      const skill = `multiplication.table.${table}` as SkillId;

      const explanation = [
        `${table} sayısını ${factor} kere toplamak demektir.`,
        `${table} × ${factor} = ${answer}`,
      ];
      const hint = factor > 5
        ? `${table} × 5 = ${table * 5} olduğunu hatırla, üstüne ${factor - 5} tane daha ${table} ekle.`
        : `${table}'şer ritmik saymayı dene.`;

      q = {
        id,
        signature,
        category: "operations",
        categoryTitle: "Çarpım Tablosu",
        skill,
        difficulty,
        questionType: "numeric",
        prompt,
        answer,
        explanation,
        hint,
        metadata: {
          table,
          factor,
        },
      };
      break;
    }
    attempts++;
  }

  if (q) return q;

  // Fallback if all recently used
  const table = targetTable || r.range(2, maxTable);
  const factor = r.range(2, 10);
  const answer = table * factor;
  return {
    id: `tbl_${Date.now()}_${r.range(1000, 9999)}`,
    signature: `table_${table}x${factor}_${Date.now()}`,
    category: "operations",
    categoryTitle: "Çarpım Tablosu",
    skill: `multiplication.table.${table}` as SkillId,
    difficulty,
    questionType: "numeric",
    prompt: `${table} × ${factor}`,
    answer,
    explanation: [`${table} × ${factor} = ${answer}`],
    hint: `${table}'şer saymayı dene.`,
  };
}
