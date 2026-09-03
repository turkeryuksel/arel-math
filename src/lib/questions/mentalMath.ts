import { Question, SkillId } from "./types";
import { SeededRandom } from "./seed";

export function generateMentalMathQuestion(difficulty: number = 3, rng?: SeededRandom): Question {
  const r = rng || new SeededRandom(Math.random());
  // Patterns: 0: add decompose, 1: add round, 2: sub decompose, 3: sub from 100/1000, 4: mult easy, 5: div easy
  const patternTypes = [
    "add_decompose",
    "add_near_ten",
    "add_hundreds",
    "sub_decompose",
    "sub_from_round",
    "mult_by_tens",
    "mult_single_double",
    "div_by_tens",
    "div_table_multiple",
  ];

  const chosenPattern = r.pick(patternTypes);
  let id = `mental_${Date.now()}_${r.range(100, 999)}`;
  let signature = "";
  let prompt = "";
  let answer = 0;
  let explanation: string[] = [];
  let hint = "";
  let skill: SkillId = "mental.addition";

  if (chosenPattern === "add_decompose") {
    // e.g. 47 + 28 or 63 + 29
    skill = "mental.addition";
    const tens1 = r.range(1 + Math.min(difficulty, 4), 3 + difficulty);
    const ones1 = r.range(4, 9);
    const tens2 = r.range(1, 2 + Math.min(difficulty, 3));
    const ones2 = r.range(5, 9);
    const a = tens1 * 10 + ones1;
    const b = tens2 * 10 + ones2;
    prompt = `${a} + ${b}`;
    answer = a + b;
    signature = `mental_add_${a}_${b}`;
    const step1 = a + tens2 * 10;
    explanation = [
      `Önce onlar basamağını ekle: ${a} + ${tens2 * 10} = ${step1}`,
      `Sonra birler basamağını ekle: ${step1} + ${ones2} = ${answer}`,
    ];
    hint = `Önce ${a} sayısına ${tens2 * 10} eklemeyi dene.`;
  } else if (chosenPattern === "add_near_ten") {
    // e.g. 199 + 25 or 48 + 19 (compensation strategy)
    skill = "mental.addition";
    const roundBase = difficulty > 4 ? 100 * r.range(1, 4) : 50;
    const diffFromRound = r.range(1, 3);
    const a = roundBase - diffFromRound; // e.g. 98, 199, 49
    const b = r.range(15, 35 + difficulty * 5);
    prompt = `${a} + ${b}`;
    answer = a + b;
    signature = `mental_add_near_${a}_${b}`;
    explanation = [
      `${a} sayısını ${roundBase} yapmak için ${diffFromRound} ekleyelim: ${roundBase} + ${b} = ${roundBase + b}`,
      `Fazladan eklediğimiz ${diffFromRound} sayısını çıkaralım: ${roundBase + b} - ${diffFromRound} = ${answer}`,
    ];
    hint = `${a} sayısını ${roundBase} olarak düşünüp sonra ${diffFromRound} çıkarabilirsin.`;
  } else if (chosenPattern === "add_hundreds") {
    // e.g. 350 + 250 or 450 + 180
    skill = "mental.addition";
    const a = r.range(2, 6 + difficulty) * 50;
    const b = r.range(1, 5 + difficulty) * 50;
    prompt = `${a} + ${b}`;
    answer = a + b;
    signature = `mental_add_h_${a}_${b}`;
    explanation = [
      `${a} + ${b} işleminde yüzlükleri topla: ${Math.floor(a / 100) * 100} + ${Math.floor(b / 100) * 100} = ${
        (Math.floor(a / 100) + Math.floor(b / 100)) * 100
      }`,
      `Kalanları ekle: ${answer}`,
    ];
    hint = `Önce yüzlükleri topla, sonra 50'likleri ekle.`;
  } else if (chosenPattern === "sub_decompose") {
    // e.g. 72 - 28
    skill = "mental.subtraction";
    const aTens = r.range(4 + Math.min(difficulty, 3), 9);
    const aOnes = r.range(1, 4);
    const bTens = r.range(1, aTens - 2);
    const bOnes = r.range(5, 9);
    const a = aTens * 10 + aOnes;
    const b = bTens * 10 + bOnes;
    prompt = `${a} - ${b}`;
    answer = a - b;
    signature = `mental_sub_${a}_${b}`;
    const step1 = a - bTens * 10;
    explanation = [
      `Önce ${bTens * 10} sayısını çıkar: ${a} - ${bTens * 10} = ${step1}`,
      `Sonra kalan ${bOnes} sayısını çıkar: ${step1} - ${bOnes} = ${answer}`,
    ];
    hint = `Önce onlar basamağını (${bTens * 10}) çıkar.`;
  } else if (chosenPattern === "sub_from_round") {
    // e.g. 100 - 47 or 1000 - 350
    skill = "mental.subtraction";
    const base = difficulty > 5 ? 1000 : 100;
    const sub = base === 100 ? r.range(21, 89) : r.range(15, 85) * 10;
    prompt = `${base} - ${sub}`;
    answer = base - sub;
    signature = `mental_sub_round_${base}_${sub}`;
    if (base === 100) {
      const tenPart = Math.floor(sub / 10) * 10;
      const onePart = sub % 10;
      explanation = [
        `100'den önce ${tenPart} çıkar: 100 - ${tenPart} = ${100 - tenPart}`,
        `Kalan sayıdan ${onePart} çıkar: ${100 - tenPart} - ${onePart} = ${answer}`,
      ];
      hint = `100'den önce ${tenPart} çıkar.`;
    } else {
      explanation = [
        `1000'den yüzlükleri çıkararak adım adım yapabilirsin: ${base} - ${sub} = ${answer}`,
      ];
      hint = `Yüzlükler basamağını göz önüne getir.`;
    }
  } else if (chosenPattern === "mult_by_tens") {
    // e.g. 40 * 6 or 25 * 10
    skill = "mental.multiplication";
    const a = r.pick([20, 30, 40, 50, 60, 70, 80, 90]);
    const b = r.range(2, 9);
    prompt = `${a} × ${b}`;
    answer = a * b;
    signature = `mental_mult_tens_${a}_${b}`;
    const baseA = a / 10;
    explanation = [
      `Önce sıfırı yok say: ${baseA} × ${b} = ${baseA * b}`,
      `Sonra arkasına sıfırı ekle: ${baseA * b} × 10 = ${answer}`,
    ];
    hint = `Önce ${baseA} × ${b} yap, sonra yanına 0 koy!`;
  } else if (chosenPattern === "mult_single_double") {
    // e.g. 14 * 3 or 16 * 4
    skill = "mental.multiplication";
    const tens = 10;
    const ones = r.range(2, 6);
    const a = tens + ones;
    const b = r.range(3, 6);
    prompt = `${a} × ${b}`;
    answer = a * b;
    signature = `mental_mult_dec_${a}_${b}`;
    explanation = [
      `Sayıyı 10 ve ${ones} olarak ayır:`,
      `10 × ${b} = ${10 * b}`,
      `${ones} × ${b} = ${ones * b}`,
      `Topla: ${10 * b} + ${ones * b} = ${answer}`,
    ];
    hint = `10 × ${b} ile ${ones} × ${b} işlemlerini topla.`;
  } else if (chosenPattern === "div_by_tens") {
    // e.g. 180 / 10 or 240 / 30 or 400 / 5
    skill = "mental.division";
    const divisor = r.pick([10, 5, 20]);
    const quotient = r.range(4, 25);
    const dividend = divisor * quotient;
    prompt = `${dividend} ÷ ${divisor}`;
    answer = quotient;
    signature = `mental_div_tens_${dividend}_${divisor}`;
    explanation = [
      divisor === 10
        ? `10'a bölerken sayının sonundaki bir sıfırı atabilirsin: ${dividend} ÷ 10 = ${answer}`
        : `${dividend} ÷ ${divisor} = ${answer}`,
    ];
    hint = divisor === 10 ? `Sonundaki 0'ı at.` : `${divisor} ile kaçı çarparsan ${dividend} olur?`;
  } else {
    // div_table_multiple e.g. 72 / 8 or 48 / 6
    skill = "mental.division";
    const b = r.range(4, 9);
    const ans = r.range(4, 9);
    const a = b * ans;
    prompt = `${a} ÷ ${b}`;
    answer = ans;
    signature = `mental_div_tbl_${a}_${b}`;
    explanation = [
      `${b} ile hangi sayıyı çarparsan ${a} eder?`,
      `${b} × ${ans} = ${a}`,
      `Demek ki ${a} ÷ ${b} = ${ans}`,
    ];
    hint = `${b}'ler çarpım tablosunu hatırla.`;
  }

  return {
    id,
    signature,
    category: "mental-math",
    categoryTitle: "Zihinden Matematik",
    skill,
    difficulty,
    questionType: "numeric",
    prompt,
    answer,
    explanation,
    hint,
  };
}
