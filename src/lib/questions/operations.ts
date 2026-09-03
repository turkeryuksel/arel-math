import { Question, SkillId } from "./types";
import { SeededRandom, createRng } from "./seed";

export function generateOperationQuestion(
  opType?: "addition" | "subtraction" | "multiplication" | "division",
  difficulty: number = 3,
  rng?: SeededRandom,
  recentSignatures: Set<string> = new Set()
): Question {
  const r = rng || createRng();
  let attempts = 0;
  let q: Question | null = null;

  while (attempts < 20) {
    const chosenOp = opType || r.pick(["addition", "subtraction", "multiplication", "division"]);
    const candidate = buildOperationQuestion(chosenOp, difficulty, r);
    if (!recentSignatures.has(candidate.signature)) {
      q = candidate;
      break;
    }
    attempts++;
  }

  return q || buildOperationQuestion(opType || "addition", difficulty, r);
}

function buildOperationQuestion(
  chosenOp: "addition" | "subtraction" | "multiplication" | "division",
  difficulty: number,
  r: SeededRandom
): Question {
  const id = `op_${Date.now()}_${r.range(1000, 9999)}`;
  let signature = "";
  let prompt = "";
  let answer = 0;
  let explanation: string[] = [];
  let hint = "";
  let skill: SkillId = "operations.addition";

  if (chosenOp === "addition") {
    skill = "operations.addition";
    let a = 0;
    let b = 0;
    if (difficulty <= 2) {
      // 2 basamak + 1 veya 2 basamak basit
      a = r.range(18, 65);
      b = r.range(7, 28);
    } else if (difficulty <= 4) {
      // Eldeli toplama (3. sınıf sonu / 4. sınıf başı)
      a = r.range(38, 97);
      b = r.range(26, 89);
    } else if (difficulty <= 6) {
      // 3 basamaklı + 2 veya 3 basamaklı
      a = r.range(145, 680);
      b = r.range(68, 435);
    } else {
      // 4 basamaklı toplama (4. sınıf müfredatı)
      a = r.range(1250, 5600);
      b = r.range(480, 3450);
    }
    prompt = `${a} + ${b}`;
    answer = a + b;
    signature = `op_add_${a}_${b}`;
    explanation = [
      `1. Adım: Birler basamağını topla: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`,
      `2. Adım: Varsa eldeyi onlar basamağına devret.`,
      `3. Adım: Basamakları sırayla topla.`,
      `Sonuç: ${a} + ${b} = ${answer}`,
    ];
    hint = `Birler basamağından başlayarak eldeleri unutmadan topla.`;
  } else if (chosenOp === "subtraction") {
    skill = "operations.subtraction";
    let a = 0;
    let b = 0;
    if (difficulty <= 2) {
      a = r.range(35, 95);
      b = r.range(12, a - 5);
    } else if (difficulty <= 4) {
      // Onluk bozarak çıkarma
      const tens = r.range(4, 9);
      a = tens * 10 + r.range(1, 4);
      b = r.range(1, tens - 1) * 10 + r.range(6, 9);
    } else if (difficulty <= 6) {
      // 3 basamaklı onluk/yüzlük bozmalı
      a = r.range(320, 850);
      b = r.range(145, a - 30);
    } else {
      // 4 basamaklı çıkarma
      a = r.range(2400, 7800);
      b = r.range(650, a - 100);
    }
    prompt = `${a} - ${b}`;
    answer = a - b;
    signature = `op_sub_${a}_${b}`;
    explanation = [
      `1. Adım: Birler basamağına bak: Birler basamağı yetmiyorsa komşudan 1 onluk al.`,
      `2. Adım: Onlar basamağındaki eksilmeyi unutma.`,
      `Sonuç: ${a} - ${b} = ${answer}`,
    ];
    hint = `Küçük basamaktan büyük çıkmıyorsa komşudan 1 onluk al!`;
  } else if (chosenOp === "multiplication") {
    skill = "operations.multiplication";
    let a = 0;
    let b = 0;
    if (difficulty <= 2) {
      a = r.range(3, 9);
      b = r.range(3, 9);
    } else if (difficulty <= 4) {
      // 2 basamak × 1 basamak
      a = r.range(14, 48);
      b = r.range(3, 7);
    } else if (difficulty <= 6) {
      // 3 basamak × 1 basamak veya 2 basamak × 2 basamak (küçük)
      if (r.next() > 0.5) {
        a = r.range(115, 340);
        b = r.range(3, 8);
      } else {
        a = r.range(15, 36);
        b = r.range(12, 28);
      }
    } else {
      // 4. sınıf sonu: 2 basamak × 2 basamak veya 3 basamak × 2 basamak
      a = r.range(25, 75);
      b = r.range(14, 45);
    }
    prompt = `${a} × ${b}`;
    answer = a * b;
    signature = `op_mult_${a}_${b}`;
    explanation = [
      `1. Adım: ${a}'nın birler basamağını ${b} ile çarp: ${a % 10} × ${b} = ${(a % 10) * b}`,
      `2. Adım: ${a}'nın onlar basamağını ${b} ile çarp: ${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}`,
      `3. Adım: Topla: ${(a % 10) * b} + ${Math.floor(a / 10) * 10 * b} = ${answer}`,
    ];
    hint = `Çarpanları basamaklarına ayırarak çarpabilirsin.`;
  } else {
    // division
    skill = "operations.division";
    let divisor = 0;
    let quotient = 0;
    if (difficulty <= 2) {
      divisor = r.range(2, 6);
      quotient = r.range(3, 9);
    } else if (difficulty <= 4) {
      // 2 basamak ÷ 1 basamak tam bölme
      divisor = r.range(3, 9);
      quotient = r.range(8, 19);
    } else if (difficulty <= 6) {
      // 3 basamak ÷ 1 basamak
      divisor = r.range(4, 9);
      quotient = r.range(22, 65);
    } else {
      // 3 basamak ÷ 2 basamak veya büyük bölme
      divisor = r.range(12, 25);
      quotient = r.range(12, 35);
    }
    const dividend = divisor * quotient;
    prompt = `${dividend} ÷ ${divisor}`;
    answer = quotient;
    signature = `op_div_${dividend}_${divisor}`;
    explanation = [
      `1. Adım: ${dividend} içinde kaç tane ${divisor} olduğunu bulalım.`,
      `2. Adım: ${divisor} × ${quotient} = ${dividend}`,
      `Bölüm: ${answer}`,
    ];
    hint = `${divisor} ile hangi sayıyı çarparsan ${dividend} olur?`;
  }

  return {
    id,
    signature,
    category: "operations",
    categoryTitle: "4 İşlem",
    skill,
    difficulty,
    questionType: "numeric",
    prompt,
    answer,
    explanation,
    hint,
  };
}
