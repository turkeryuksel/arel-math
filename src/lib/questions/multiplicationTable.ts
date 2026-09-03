import { Question, SkillId } from "./types";
import { SeededRandom } from "./seed";

export function generateTableQuestion(
  targetTable?: number,
  difficulty: number = 3,
  rng?: SeededRandom
): Question {
  const r = rng || new SeededRandom(Math.random());
  // Default tables 2 to 10 (or up to 12 if difficulty > 5)
  const maxTable = difficulty > 5 ? 12 : 10;
  const table = targetTable || r.range(2, maxTable);
  const factor = r.range(2, 10);
  const id = `tbl_${Date.now()}_${r.range(100, 999)}`;
  const prompt = `${table} × ${factor}`;
  const answer = table * factor;
  const signature = `table_${table}x${factor}`;
  const skill = `multiplication.table.${table}` as SkillId;

  const explanation = [
    `${table} sayısını ${factor} kere toplamak demektir.`,
    `${table} × ${factor} = ${answer}`,
  ];
  const hint = factor > 5
    ? `${table} × 5 = ${table * 5} olduğunu hatırla, üstüne ${factor - 5} tane daha ${table} ekle.`
    : `${table}'şer ritmik saymayı dene.`;

  return {
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
}
