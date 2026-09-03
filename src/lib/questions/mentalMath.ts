import { Question, SkillId } from "./types";
import { SeededRandom } from "./seed";

/**
 * Rich, pedagogical Mental Math Generator for MEB 4th Grade
 * Covers decomposition, compensation, rounding, compatible numbers,
 * doubling/halving, mental multiplication & division tricks.
 */
export function generateMentalMathQuestion(
  difficulty: number = 3,
  rng?: SeededRandom,
  recentSignatures: Set<string> = new Set()
): Question {
  const r = rng || new SeededRandom(Date.now() + Math.random() * 1000000);

  // 20 diverse pattern types
  const allPatterns = [
    "add_2digit_decompose",      // e.g. 47 + 38 (step: 47+30=77, 77+8=85)
    "add_round_compensate",       // e.g. 49 + 36 -> (50 + 36) - 1
    "add_hundreds_tens",          // e.g. 340 + 280, 470 + 190
    "add_compatible_three",       // e.g. 25 + 38 + 75 -> (25+75)+38 = 138
    "sub_2digit_borrow",          // e.g. 83 - 47 (step: 83-40=43, 43-7=36)
    "sub_from_100_1000",          // e.g. 100 - 37 or 1000 - 340
    "sub_near_round",             // e.g. 142 - 99 -> (142 - 100) + 1
    "sub_difference_bridging",    // e.g. 94 - 68 -> 68->70 (+2), 70->94 (+24) = 26
    "mult_double_halve",          // e.g. 16 × 5 -> (16 ÷ 2) × 10 = 80
    "mult_by_4",                  // e.g. 18 × 4 -> 18×2=36, 36×2=72
    "mult_by_9",                  // e.g. 24 × 9 -> 24×10 - 24 = 216
    "mult_by_11",                 // e.g. 23 × 11 -> 23×10 + 23 = 253
    "mult_tens_single",           // e.g. 60 × 7 = 420
    "mult_tens_double",           // e.g. 40 × 30 = 1200
    "div_by_halving",             // e.g. 140 ÷ 4 -> (140÷2)÷2 = 35
    "div_by_tens",                // e.g. 480 ÷ 10 = 48, 720 ÷ 80 = 9
    "div_table_reverse",          // e.g. 63 ÷ 7 = 9 (7 x ? = 63)
    "missing_addend_100",         // e.g. 46 + ? = 100
    "money_mental_tl",            // e.g. 45 TL + 37 TL = 82 TL
    "quick_sum_pairs",            // e.g. 64 + 36 = 100
  ];

  let chosenPattern = r.pick(allPatterns);
  let attempts = 0;
  let question: Question | null = null;

  while (attempts < 15) {
    chosenPattern = r.pick(allPatterns);
    const candidate = buildQuestionByPattern(chosenPattern, difficulty, r);
    if (!recentSignatures.has(candidate.signature)) {
      question = candidate;
      break;
    }
    attempts++;
  }

  return question || buildQuestionByPattern(chosenPattern, difficulty, r);
}

function buildQuestionByPattern(pattern: string, difficulty: number, r: SeededRandom): Question {
  const id = `mental_${Date.now()}_${r.range(1000, 9999)}`;
  let signature = "";
  let prompt = "";
  let subtext: string | undefined;
  let answer: number = 0;
  let explanation: string[] = [];
  let hint = "";
  let skill: SkillId = "mental.addition";

  switch (pattern) {
    case "add_2digit_decompose": {
      skill = "mental.addition";
      const tens1 = r.range(2, 6);
      const ones1 = r.range(3, 9);
      const tens2 = r.range(1, 4);
      const ones2 = r.range(4, 9);
      const a = tens1 * 10 + ones1;
      const b = tens2 * 10 + ones2;
      prompt = `${a} + ${b}`;
      answer = a + b;
      signature = `m_add_dec_${a}_${b}`;
      const step1 = a + tens2 * 10;
      explanation = [
        `1. Adım: İkinci sayının onlar basamağını ekle: ${a} + ${tens2 * 10} = ${step1}`,
        `2. Adım: Kalan birler basamağını ekle: ${step1} + ${ones2} = ${answer}`,
      ];
      hint = `Önce ${a}'ya ${tens2 * 10} ekle, sonra ${ones2} ekle!`;
      break;
    }

    case "add_round_compensate": {
      skill = "mental.addition";
      const base = r.pick([50, 100, 200, 300]);
      const diff = r.range(1, 3);
      const a = base - diff; // e.g. 49, 98, 199, 298
      const b = r.range(24, 78);
      prompt = `${a} + ${b}`;
      answer = a + b;
      signature = `m_add_comp_${a}_${b}`;
      explanation = [
        `1. Adım: ${a} sayısını ${base} olarak yuvarlayalım: ${base} + ${b} = ${base + b}`,
        `2. Adım: Fazladan eklediğimiz ${diff}'yi geri çıkaralım: ${base + b} - ${diff} = ${answer}`,
      ];
      hint = `${a} sayısını ${base} gibi düşün, sonra ${diff} çıkar.`;
      break;
    }

    case "add_hundreds_tens": {
      skill = "mental.addition";
      const aTens = r.range(12, 45) * 10; // e.g. 340, 280, 420
      const bTens = r.range(11, 35) * 10; // e.g. 190, 270
      prompt = `${aTens} + ${bTens}`;
      answer = aTens + bTens;
      signature = `m_add_h_tens_${aTens}_${bTens}`;
      explanation = [
        `1. Adım: Yüzlükleri topla: ${Math.floor(aTens / 100) * 100} + ${Math.floor(bTens / 100) * 100} = ${(Math.floor(aTens / 100) + Math.floor(bTens / 100)) * 100}`,
        `2. Adım: Onlukları topla: ${aTens % 100} + ${bTens % 100} = ${(aTens % 100) + (bTens % 100)}`,
        `3. Adım: Birleştir: ${answer}`,
      ];
      hint = `Önce yüzlükleri, sonra onlar basamaklarını topla.`;
      break;
    }

    case "add_compatible_three": {
      skill = "mental.addition";
      const pairA = r.pick([25, 35, 45, 15, 65, 75]);
      const pairB = 100 - pairA;
      const middle = r.range(14, 68);
      prompt = `${pairA} + ${middle} + ${pairB}`;
      answer = 100 + middle;
      signature = `m_add_three_${pairA}_${middle}_${pairB}`;
      explanation = [
        `1. Adım: 100 yapan dost sayıları eşleştir: ${pairA} + ${pairB} = 100`,
        `2. Adım: Ortadaki sayıyı ekle: 100 + ${middle} = ${answer}`,
      ];
      hint = `Önce ${pairA} ile ${pairB}'yi toplayıp 100 yap!`;
      break;
    }

    case "sub_2digit_borrow": {
      skill = "mental.subtraction";
      const tens1 = r.range(4, 9);
      const ones1 = r.range(1, 4); // small ones (borrowing needed)
      const tens2 = r.range(1, tens1 - 1);
      const ones2 = r.range(5, 9); // big ones
      const a = tens1 * 10 + ones1;
      const b = tens2 * 10 + ones2;
      prompt = `${a} - ${b}`;
      answer = a - b;
      signature = `m_sub_borrow_${a}_${b}`;
      const step1 = a - tens2 * 10;
      explanation = [
        `1. Adım: Önce onlar basamağını çıkar: ${a} - ${tens2 * 10} = ${step1}`,
        `2. Adım: Sonra kalan ${ones2}'yi çıkar: ${step1} - ${ones2} = ${answer}`,
      ];
      hint = `Önce ${a}'dan ${tens2 * 10} çıkar, sonra ${ones2} daha çıkar.`;
      break;
    }

    case "sub_from_100_1000": {
      skill = "mental.subtraction";
      const isThousand = difficulty >= 5 && r.next() > 0.4;
      if (isThousand) {
        const sub = r.range(12, 88) * 10;
        prompt = `1000 - ${sub}`;
        answer = 1000 - sub;
        signature = `m_sub_1000_${sub}`;
        explanation = [
          `1000'i yüzlük olarak düşün: 100 onluk - ${sub / 10} onluk = ${answer / 10} onluk`,
          `Sonuç: ${answer}`,
        ];
        hint = `${sub}'e kaç eklersen 1000 olur?`;
      } else {
        const sub = r.range(13, 87);
        prompt = `100 - ${sub}`;
        answer = 100 - sub;
        signature = `m_sub_100_${sub}`;
        const tenPart = Math.floor(sub / 10) * 10;
        const onePart = sub % 10;
        explanation = [
          `1. Adım: 100'den onlar basamağını çıkar: 100 - ${tenPart} = ${100 - tenPart}`,
          `2. Adım: Kalandan birler basamağını çıkar: ${100 - tenPart} - ${onePart} = ${answer}`,
        ];
        hint = `${sub}'i 100'e tamamlamak için ne lazım? (Dost sayılar)`;
      }
      break;
    }

    case "sub_near_round": {
      skill = "mental.subtraction";
      const b = r.pick([19, 29, 39, 49, 99]);
      const roundB = b + 1;
      const a = roundB + r.range(15, 65);
      prompt = `${a} - ${b}`;
      answer = a - b;
      signature = `m_sub_near_${a}_${b}`;
      explanation = [
        `1. Adım: ${b} yerine ${roundB} çıkaralım: ${a} - ${roundB} = ${a - roundB}`,
        `2. Adım: 1 fazla çıkardığımız için 1 ekleyelim: ${a - roundB} + 1 = ${answer}`,
      ];
      hint = `${b} yerine ${roundB} çıkar, sonra 1 ekle.`;
      break;
    }

    case "sub_difference_bridging": {
      skill = "mental.subtraction";
      const start = r.range(45, 75);
      const target = start + r.range(18, 38);
      prompt = `${target} ile ${start} arasındaki fark kaçtır?`;
      answer = target - start;
      signature = `m_bridge_${target}_${start}`;
      const toTen = Math.ceil(start / 10) * 10;
      const jump1 = toTen - start;
      const jump2 = target - toTen;
      explanation = [
        `Köprüleme Yöntemi:`,
        `1. ${start}'ten en yakın onluğa (${toTen}) sıçra: +${jump1}`,
        `2. ${toTen}'dan ${target}'e sıçra: +${jump2}`,
        `3. Sıçramaları topla: ${jump1} + ${jump2} = ${answer}`,
      ];
      hint = `${start}'ten ${toTen}'a kaç var? ${toTen}'dan ${target}'e kaç var?`;
      break;
    }

    case "mult_double_halve": {
      skill = "mental.multiplication";
      const even = r.range(6, 24) * 2; // e.g. 12, 14, 16, 18, 22, 28
      prompt = `${even} × 5`;
      answer = even * 5;
      signature = `m_mult_5_${even}`;
      explanation = [
        `5 ile çarpmanın pratik yolu: 2'ye böl, 10 ile çarp!`,
        `1. Adım: ${even} ÷ 2 = ${even / 2}`,
        `2. Adım: ${even / 2} × 10 = ${answer}`,
      ];
      hint = `${even}'nin yarısını alıp yanına sıfır ekle!`;
      break;
    }

    case "mult_by_4": {
      skill = "mental.multiplication";
      const n = r.range(12, 35);
      prompt = `${n} × 4`;
      answer = n * 4;
      signature = `m_mult_4_${n}`;
      explanation = [
        `4 ile çarpmanın pratik yolu: İki kez iki katını al!`,
        `1. Adım: ${n} × 2 = ${n * 2}`,
        `2. Adım: ${n * 2} × 2 = ${answer}`,
      ];
      hint = `Önce iki katını bul: ${n} × 2 = ${n * 2}. Sonra bunun da iki katını al!`;
      break;
    }

    case "mult_by_9": {
      skill = "mental.multiplication";
      const n = r.range(12, 45);
      prompt = `${n} × 9`;
      answer = n * 9;
      signature = `m_mult_9_${n}`;
      explanation = [
        `9 ile çarpmanın pratik yolu: 10 ile çarp, kendisini çıkar!`,
        `1. Adım: ${n} × 10 = ${n * 10}`,
        `2. Adım: ${n * 10} - ${n} = ${answer}`,
      ];
      hint = `${n} × 10 = ${n * 10}. Buradan ${n} çıkar.`;
      break;
    }

    case "mult_by_11": {
      skill = "mental.multiplication";
      const n = r.range(12, 45);
      prompt = `${n} × 11`;
      answer = n * 11;
      signature = `m_mult_11_${n}`;
      explanation = [
        `11 ile çarpmanın pratik yolu: 10 ile çarp, kendisini ekle!`,
        `1. Adım: ${n} × 10 = ${n * 10}`,
        `2. Adım: ${n * 10} + ${n} = ${answer}`,
      ];
      hint = `${n} × 10 = ${n * 10}. Üstüne ${n} ekle.`;
      break;
    }

    case "mult_tens_single": {
      skill = "mental.multiplication";
      const tens = r.pick([20, 30, 40, 50, 60, 70, 80, 90]);
      const single = r.range(3, 9);
      prompt = `${tens} × ${single}`;
      answer = tens * single;
      signature = `m_mult_ts_${tens}_${single}`;
      const base = tens / 10;
      explanation = [
        `1. Adım: Sıfırı sakla: ${base} × ${single} = ${base * single}`,
        `2. Adım: Sıfırı geri koy: ${answer}`,
      ];
      hint = `${base} × ${single} yap, sonuna sıfır koy!`;
      break;
    }

    case "mult_tens_double": {
      skill = "mental.multiplication";
      const a = r.pick([20, 30, 40, 50]);
      const b = r.pick([20, 30, 40, 50]);
      prompt = `${a} × ${b}`;
      answer = a * b;
      signature = `m_mult_tt_${a}_${b}`;
      const aBase = a / 10;
      const bBase = b / 10;
      explanation = [
        `1. Adım: Sayıları çarp: ${aBase} × ${bBase} = ${aBase * bBase}`,
        `2. Adım: İki sıfırı sonuna ekle: ${answer}`,
      ];
      hint = `${aBase} × ${bBase} = ${aBase * bBase}. Yanına iki tane 0 koy!`;
      break;
    }

    case "div_by_halving": {
      skill = "mental.division";
      const ans = r.range(12, 35);
      const dividend = ans * 4;
      prompt = `${dividend} ÷ 4`;
      answer = ans;
      signature = `m_div_half_${dividend}`;
      explanation = [
        `4'e bölmenin pratik yolu: İki kez yarısını al!`,
        `1. Adım: ${dividend} ÷ 2 = ${dividend / 2}`,
        `2. Adım: ${dividend / 2} ÷ 2 = ${answer}`,
      ];
      hint = `${dividend}'nin yarısını al, sonra onun da yarısını al!`;
      break;
    }

    case "div_by_tens": {
      skill = "mental.division";
      const quotient = r.range(4, 9);
      const divisor = r.pick([20, 30, 40, 50, 60, 70, 80]);
      const dividend = divisor * quotient;
      prompt = `${dividend} ÷ ${divisor}`;
      answer = quotient;
      signature = `m_div_tens_${dividend}_${divisor}`;
      const dBase = divisor / 10;
      const ddBase = dividend / 10;
      explanation = [
        `İki taraftan da birer sıfır atalım:`,
        `${ddBase} ÷ ${dBase} = ${answer}`,
      ];
      hint = `İki tarafın da sonundaki 0'ı sil: ${ddBase} ÷ ${dBase}`;
      break;
    }

    case "div_table_reverse": {
      skill = "mental.division";
      const divisor = r.range(6, 9);
      const quotient = r.range(6, 9);
      const dividend = divisor * quotient;
      prompt = `${dividend} ÷ ${divisor}`;
      answer = quotient;
      signature = `m_div_rev_${dividend}_${divisor}`;
      explanation = [
        `Çarpım tablosu düşüncesi:`,
        `${divisor} ile hangi sayıyı çarparsam ${dividend} olur?`,
        `${divisor} × ${quotient} = ${dividend}, o halde cevap ${quotient}.`,
      ];
      hint = `${divisor} kere kaç ${dividend} eder?`;
      break;
    }

    case "missing_addend_100": {
      skill = "mental.addition";
      const given = r.range(17, 83);
      prompt = `${given} + ? = 100`;
      subtext = "Soru işareti yerine hangi sayı gelmelidir?";
      answer = 100 - given;
      signature = `m_missing_100_${given}`;
      explanation = [
        `100'e tamamlayan sayıyı bulmak için:`,
        `100 - ${given} = ${answer}`,
        `Sağlama: ${given} + ${answer} = 100`,
      ];
      hint = `${given}'e kaç eklersen 100 olur?`;
      break;
    }

    case "money_mental_tl": {
      skill = "mental.addition";
      const a = r.range(25, 65);
      const b = r.range(18, 45);
      prompt = `${a} TL + ${b} TL kaç TL eder?`;
      answer = a + b;
      signature = `m_money_${a}_${b}`;
      explanation = [
        `Önce onlar basamağı: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${(Math.floor(a / 10) + Math.floor(b / 10)) * 10} TL`,
        `Sonra birler basamağı: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)} TL`,
        `Toplam: ${answer} TL`,
      ];
      hint = `Liraları zihinden parçalayarak topla.`;
      break;
    }

    default: {
      // quick_sum_pairs
      skill = "mental.addition";
      const a = r.range(21, 79);
      const b = 100 - a;
      prompt = `${a} + ${b}`;
      answer = 100;
      signature = `m_pairs_${a}_${b}`;
      explanation = [
        `Bu iki sayı birbirini 100'e tamamlayan dost sayılardır:`,
        `${a} + ${b} = 100`,
      ];
      hint = `Birler basamaklarına bak: ${a % 10} + ${b % 10} = 10!`;
      break;
    }
  }

  return {
    id,
    signature,
    category: "mental-math",
    categoryTitle: getMentalMathTopicTitle(pattern),
    skill,
    difficulty,
    questionType: "numeric",
    prompt,
    subtext,
    answer,
    explanation,
    hint,
  };
}

function getMentalMathTopicTitle(pattern: string): string {
  const titles: Record<string, string> = {
    add_2digit_decompose: "Toplama: Sayıları Parçalama",
    add_round_compensate: "Toplama: Yuvarlayarak Hesaplama",
    add_hundreds_tens: "Toplama: Yüzlük ve Onluklar",
    add_compatible_three: "Toplama: Dost Sayılar",
    sub_2digit_borrow: "Çıkarma: Basamaklara Ayırma",
    sub_from_100_1000: "Çıkarma: 100 ve 1000'den",
    sub_near_round: "Çıkarma: Yuvarlayarak Hesaplama",
    sub_difference_bridging: "Çıkarma: Farkı Tamamlama",
    mult_double_halve: "Çarpma: İkiye Bölüp 10'la Çarpma",
    mult_by_4: "Çarpma: Dörtle Çarpma",
    mult_by_9: "Çarpma: Dokuzla Çarpma",
    mult_by_11: "Çarpma: On Birle Çarpma",
    mult_tens_single: "Çarpma: Onlukla Çarpma",
    mult_tens_double: "Çarpma: Onlukları Çarpma",
    div_by_halving: "Bölme: Yarısını Alarak",
    div_by_tens: "Bölme: Onluklara Ayırma",
    div_table_reverse: "Bölme: Çarpım Tablosunu Ters Kullanma",
    missing_addend_100: "Eksik Sayı: 100'e Tamamlama",
    money_mental_tl: "Para İşlemleri: Zihinden Toplama",
    quick_sum_pairs: "Toplama: 100 Yapan Çiftler",
  };

  return titles[pattern] || "Zihinden Matematik";
}
