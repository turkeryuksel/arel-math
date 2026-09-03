import { Question, SkillId } from "./types";
import { SeededRandom, createRng } from "./seed";

export function generateLogicQuestion(
  difficulty: number = 3,
  rng?: SeededRandom,
  recentSignatures: Set<string> = new Set()
): Question {
  const r = rng || createRng();
  let attempts = 0;
  let q: Question | null = null;

  while (attempts < 20) {
    const candidate = buildLogicQuestion(difficulty, r);
    if (!recentSignatures.has(candidate.signature)) {
      q = candidate;
      break;
    }
    attempts++;
  }

  return q || buildLogicQuestion(difficulty, r);
}

function buildLogicQuestion(difficulty: number, r: SeededRandom): Question {
  const types = [
    "pyramid",
    "missing_add",
    "missing_mult",
    "sequence",
    "comparison",
    "chain",
    "estimate",
    "reverse_op",
  ];
  const chosen = r.pick(types);
  const id = `logic_${Date.now()}_${r.range(1000, 9999)}`;
  let signature = "";
  let prompt = "";
  let answer: number | string = 0;
  let explanation: string[] = [];
  let hint = "";
  let skill: SkillId = "logic.missingNumber";
  let questionType: "numeric" | "multipleChoice" | "comparison" = "numeric";
  let choices: (number | string)[] | undefined = undefined;
  let metadata: Record<string, unknown> | undefined = undefined;


  if (chosen === "pyramid") {
    skill = "logic.pyramid";
    // 3-level pyramid: [a, b, c] -> [a+b, b+c] -> [ (a+b) + (b+c) ]
    const a = r.range(2, 6 + difficulty * 2);
    const b = r.range(3, 7 + difficulty * 2);
    const c = r.range(2, 6 + difficulty * 2);
    const l2_left = a + b;
    const l2_right = b + c;
    const top = l2_left + l2_right;

    // Pick which number is missing: top, or one of level 2
    const missingSlot = r.pick(["top", "mid_left", "mid_right"]);
    if (missingSlot === "top") {
      prompt = `Sayı Piramidi: Altındaki iki sayının toplamı üstteki sayıyı verir.
Alt satır: [${a}, ${b}, ${c}]
Orta satır: [${l2_left}, ${l2_right}]
Tepe satır: [ ? ]`;
      answer = top;
      explanation = [
        `Orta satırdaki sayıları topla: ${l2_left} + ${l2_right} = ${top}`,
        `Tepe sayısı: ${top}`,
      ];
      hint = `Orta satırdaki iki kutucuğu topla.`;
    } else if (missingSlot === "mid_left") {
      prompt = `Sayı Piramidi: Eksik kutuyu bul.
Alt satır: [${a}, ${b}, ${c}]
Orta satır: [ ? , ${l2_right}]
Tepe satır: [${top}]`;
      answer = l2_left;
      explanation = [
        `Alt satırdaki ilk iki sayıyı topla: ${a} + ${b} = ${l2_left}`,
        `Veya tepeden çıkar: ${top} - ${l2_right} = ${l2_left}`,
      ];
      hint = `Alt satırdaki ${a} ve ${b} sayılarını topla.`;
    } else {
      prompt = `Sayı Piramidi: Eksik kutuyu bul.
Alt satır: [${a}, ${b}, ${c}]
Orta satır: [${l2_left}, ? ]
Tepe satır: [${top}]`;
      answer = l2_right;
      explanation = [
        `Alt satırdaki son iki sayıyı topla: ${b} + ${c} = ${l2_right}`,
        `Veya tepeden çıkar: ${top} - ${l2_left} = ${l2_right}`,
      ];
      hint = `Alt satırdaki ${b} ve ${c} sayılarını topla.`;
    }
    signature = `logic_pyramid_${a}_${b}_${c}_${missingSlot}`;
    metadata = { pyramid: { a, b, c, l2_left, l2_right, top, missingSlot } };
  } else if (chosen === "missing_add") {
    skill = "logic.missingNumber";
    const a = r.range(15, 45 + difficulty * 10);
    const b = r.range(15, 45 + difficulty * 10);
    const sum = a + b;
    const isFirstMissing = r.next() > 0.5;
    if (isFirstMissing) {
      prompt = `? + ${b} = ${sum}  (Eksik sayı kaçtır?)`;
      answer = a;
      signature = `logic_miss_add1_${b}_${sum}`;
      explanation = [
        `Toplamdan verilen sayıyı çıkar: ${sum} - ${b} = ${a}`,
        `Eksik sayı: ${a}`,
      ];
      hint = `${sum} sayısından ${b} sayısını çıkar.`;
    } else {
      prompt = `${a} + ? = ${sum}  (Eksik sayı kaçtır?)`;
      answer = b;
      signature = `logic_miss_add2_${a}_${sum}`;
      explanation = [
        `Toplamdan verilen sayıyı çıkar: ${sum} - ${a} = ${b}`,
        `Eksik sayı: ${b}`,
      ];
      hint = `${sum} sayısından ${a} sayısını çıkar.`;
    }
  } else if (chosen === "missing_mult") {
    skill = "logic.missingNumber";
    const factor1 = r.range(3, 9);
    const factor2 = r.range(3, 9);
    const product = factor1 * factor2;
    prompt = `? × ${factor2} = ${product}  (Eksik sayı kaçtır?)`;
    answer = factor1;
    signature = `logic_miss_mult_${factor2}_${product}`;
    explanation = [
      `Çarpımı verilen çarpana böl: ${product} ÷ ${factor2} = ${factor1}`,
      `Eksik sayı: ${factor1}`,
    ];
    hint = `${factor2} ile hangi sayıyı çarparsan ${product} olur?`;
  } else if (chosen === "sequence") {
    skill = "logic.sequence";
    const step = r.range(3, 8 + Math.min(difficulty, 4));
    const start = r.range(2, 20);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    answer = start + step * 4;
    prompt = `Sayı Dizisi: ${seq.join(" - ")} - ?`;
    signature = `logic_seq_${start}_${step}`;
    explanation = [
      `Dizideki sayılar her adımda +${step} artmaktadır.`,
      `Son sayı: ${seq[3]} + ${step} = ${answer}`,
    ];
    hint = `Sayılar arasındaki artış miktarını bul.`;
  } else if (chosen === "comparison") {
    skill = "logic.comparison";
    questionType = "comparison";
    const a1 = r.range(20, 60);
    const a2 = r.range(15, 45);
    const valA = a1 + a2;

    const b1 = r.range(70, 110);
    const b2 = r.range(15, 40);
    const valB = b1 - b2;

    const exprA = `${a1} + ${a2}`;
    const exprB = `${b1} - ${b2}`;

    prompt = `Hangi işlem sonucu daha büyüktür?\nA) ${exprA}\nB) ${exprB}`;
    answer = valA > valB ? "A" : valA < valB ? "B" : "Eşit";
    choices = ["A", "B", "Eşit"];
    signature = `logic_comp_${valA}_${valB}`;
    explanation = [
      `A işlemi: ${exprA} = ${valA}`,
      `B işlemi: ${exprB} = ${valB}`,
      valA > valB ? `${valA} > ${valB} olduğu için A daha büyüktür.` : valA < valB ? `${valB} > ${valA} olduğu için B daha büyüktür.` : `İki işlem de eşittir.`,
    ];
    hint = `İki işlemin de sonucunu ayrı ayrı hesapla.`;
  } else if (chosen === "chain") {
    skill = "logic.chain";
    const start = r.range(5, 15);
    const op1 = r.range(3, 8);
    const s1 = start + op1;
    const s2 = s1 * 2;
    const op3 = r.range(4, 10);
    answer = s2 - op3;
    prompt = `İşlem Zinciri:\nBaşlangıç: ${start}\n1. Adım: +${op1}\n2. Adım: ×2\n3. Adım: -${op3}\nSonuç kaçtır?`;
    signature = `logic_chain_${start}_${op1}_${op3}`;
    explanation = [
      `Başlangıç: ${start}`,
      `1. Adım: ${start} + ${op1} = ${s1}`,
      `2. Adım: ${s1} × 2 = ${s2}`,
      `3. Adım: ${s2} - ${op3} = ${answer}`,
    ];
    hint = `Adımları sırayla takip et: önce topla, sonra 2 ile çarp, sonra çıkar.`;
  } else if (chosen === "estimate") {
    skill = "logic.estimate";
    questionType = "multipleChoice";
    const num1 = r.range(2, 6) * 100 - r.range(1, 4); // e.g. 398, 497
    const num2 = r.range(1, 4) * 100 + r.range(2, 6); // e.g. 205, 104
    const round1 = Math.round(num1 / 100) * 100;
    const round2 = Math.round(num2 / 100) * 100;
    const estimated = round1 + round2;
    prompt = `${num1} + ${num2} işleminin en yakın yüzlüğe göre yaklaşık sonucu kaçtır?`;
    answer = estimated;
    choices = [estimated - 100, estimated, estimated + 100, estimated + 200];
    // shuffle choices
    choices = r.shuffle(choices);
    signature = `logic_est_${num1}_${num2}`;
    explanation = [
      `${num1} sayısı en yakın ${round1} yüzlüğüne yuvarlanır.`,
      `${num2} sayısı en yakın ${round2} yüzlüğüne yuvarlanır.`,
      `Yaklaşık toplam: ${round1} + ${round2} = ${estimated}`,
    ];
    hint = `Sayıları en yakın yüzlüklere yuvarlayıp topla.`;
  } else {
    // reverse_op
    skill = "logic.missingNumber";
    const divisor = r.range(3, 8);
    const ans = r.range(4, 9);
    const dividend = divisor * ans;
    prompt = `? ÷ ${divisor} = ${ans}  (Eksik sayı kaçtır?)`;
    answer = dividend;
    signature = `logic_rev_${divisor}_${ans}`;
    explanation = [
      `Bölünen sayıyı bulmak için bölen ile bölümü çarp:`,
      `${divisor} × ${ans} = ${dividend}`,
      `Eksik sayı: ${dividend}`,
    ];
    hint = `${divisor} ile ${ans} sayılarını çarp.`;
  }

  return {
    id,
    signature,
    category: "brain-training",
    categoryTitle: "Beyin Jimnastiği",
    skill,
    difficulty,
    questionType,
    prompt,
    answer,
    choices,
    explanation,
    hint,
    metadata,
  };
}
