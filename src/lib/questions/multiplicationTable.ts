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

  const candidates = Array.from({ length: targetTable ? 1 : maxTable - 1 }, (_, index) =>
    targetTable || index + 2
  ).flatMap((table) => Array.from({ length: 9 }, (_, index) => ({
    table, factor: index + 2, signature: `table_${table}x${index + 2}`,
  })));
  const unused = candidates.filter((candidate) => !recentSignatures.has(candidate.signature));
  const history = [...recentSignatures];
  const oldest = [...candidates].sort((a, b) => history.indexOf(a.signature) - history.indexOf(b.signature));
  const { table, factor, signature } = unused.length ? r.pick(unused) : oldest[0];
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
