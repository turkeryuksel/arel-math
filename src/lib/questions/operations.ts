import { Question, SkillId } from "./types";
import { SeededRandom } from "./seed";

export function generateOperationQuestion(
  opType?: "addition" | "subtraction" | "multiplication" | "division",
  difficulty: number = 3,
  rng?: SeededRandom
): Question {
  const r = rng || new SeededRandom(Math.random());
  const chosenOp = opType || r.pick(["addition", "subtraction", "multiplication", "division"]);
  const id = `op_${Date.now()}_${r.range(100, 999)}`;
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
      // 2-digit + 1-digit or simple 2-digit
      a = r.range(15, 60);
      b = r.range(4, 9);
    } else if (difficulty <= 4) {
      // 2-digit + 2-digit with carrying
      a = r.range(25, 78);
      b = r.range(18, 65);
    } else if (difficulty <= 6) {
      // 3-digit + 2-digit or 3-digit
      a = r.range(120, 550);
      b = r.range(45, 380);
    } else {
      // 3-digit + 3-digit or 4-digit
      a = r.range(450, 2400);
      b = r.range(280, 1850);
    }
    prompt = `${a} + ${b}`;
    answer = a + b;
    signature = `op_add_${a}_${b}`;
    explanation = [
      `Basamakları alt alta toplayabilirsin:`,
      `Birler basamağını topla, varsa eldeyi onlar basamağına devret.`,
      `Sonuç: ${a} + ${b} = ${answer}`,
    ];
    hint = `Önce birler basamağındaki sayıları topla.`;
  } else if (chosenOp === "subtraction") {
    skill = "operations.subtraction";
    let a = 0;
    let b = 0;
    if (difficulty <= 2) {
      a = r.range(20, 80);
      b = r.range(3, 9);
    } else if (difficulty <= 4) {
      // Onluk bozma gerektiren 2-basamak
      const tens = r.range(3, 8);
      a = tens * 10 + r.range(1, 4);
      b = r.range(1, tens - 1) * 10 + r.range(6, 9);
    } else if (difficulty <= 6) {
      a = r.range(200, 850);
      b = r.range(50, a - 30);
    } else {
      a = r.range(1000, 4500);
      b = r.range(250, a - 100);
    }
    prompt = `${a} - ${b}`;
    answer = a - b;
    signature = `op_sub_${a}_${b}`;
    explanation = [
      `Eğer üstteki basamak alttakinden küçükse komşudan 1 onluk al:`,
      `Adım adım basamakları çıkararak sonuca ulaş:`,
      `${a} - ${b} = ${answer}`,
    ];
    hint = `Gerekirse komşu basamaktan bir onluk/yüzlük almayı unutma.`;
  } else if (chosenOp === "multiplication") {
    skill = "operations.multiplication";
    let a = 0;
    let b = 0;
    if (difficulty <= 2) {
      // Simple single-digit
      a = r.range(3, 9);
      b = r.range(3, 9);
    } else if (difficulty <= 4) {
      // 2-digit * 1-digit
      a = r.range(12, 45);
      b = r.range(3, 8);
    } else if (difficulty <= 6) {
      // 2-digit * 2-digit (easier)
      a = r.range(14, 32);
      b = r.range(11, 22);
    } else {
      // 3-digit * 1-digit or 2-digit * 2-digit
      a = r.range(115, 340);
      b = r.range(3, 7);
    }
    prompt = `${a} × ${b}`;
    answer = a * b;
    signature = `op_mult_${a}_${b}`;
    explanation = [
      difficulty <= 4
        ? `${a} sayısını ${b} ile çarparken: önce birler basamağıyla, sonra onlar basamağıyla çarpıp topla.`
        : `Adım adım çarpma işlemi uygula: ${a} × ${b} = ${answer}`,
      `Sonuç: ${answer}`,
    ];
    hint = `${b} ile her basamağı sırayla çarp.`;
  } else {
    // division
    skill = "operations.division";
    let divisor = 0;
    let quotient = 0;
    if (difficulty <= 2) {
      divisor = r.range(2, 9);
      quotient = r.range(2, 9);
    } else if (difficulty <= 4) {
      divisor = r.range(3, 8);
      quotient = r.range(11, 25);
    } else if (difficulty <= 6) {
      divisor = r.range(4, 9);
      quotient = r.range(25, 75);
    } else {
      divisor = r.range(6, 12);
      quotient = r.range(40, 120);
    }
    const dividend = divisor * quotient;
    prompt = `${dividend} ÷ ${divisor}`;
    answer = quotient;
    signature = `op_div_${dividend}_${divisor}`;
    explanation = [
      `${dividend} içinde ${divisor} sayısının kaç kez olduğunu bul:`,
      `${divisor} × ${quotient} = ${dividend}`,
      `Cevap: ${answer}`,
    ];
    hint = `Bölünen sayının en sol basamağından başlayarak böl.`;
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
