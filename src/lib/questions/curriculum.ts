import { CurriculumStandard, getStandardsForGrade } from "@/lib/curriculum/standards";
import { Question } from "./types";
import { SeededRandom, createRng } from "./seed";

function distinctChoices(answer: number, r: SeededRandom, spread = 10): number[] {
  const values = new Set<number>([answer]);
  while (values.size < 4) {
    const delta = r.range(1, spread) * (r.next() < 0.5 ? -1 : 1);
    values.add(Math.max(0, answer + delta));
  }
  return r.shuffle([...values]);
}

export function generateCurriculumQuestion(
  grade: 3 | 4,
  standardCode?: string,
  difficulty = 3,
  rng?: SeededRandom,
  recentSignatures: Set<string> = new Set()
): Question {
  const r = rng || createRng();
  const standards = getStandardsForGrade(grade);
  const requested = standards.find((item) => item.code === standardCode);
  let fallback: Question | null = null;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const standard = requested || r.pick(standards);
    const question = buildQuestion(standard, difficulty, r);
    fallback = question;
    if (!recentSignatures.has(question.signature)) return question;
  }
  return fallback || buildQuestion(standards[0], difficulty, r);
}

function buildQuestion(standard: CurriculumStandard, difficulty: number, r: SeededRandom): Question {
  const id = `curr_${Date.now()}_${r.range(1000, 9999)}`;
  let prompt = "";
  let answer: number | string = 0;
  let choices: Array<number | string> | undefined;
  let explanation: string[] = [];
  let hint = "";
  let signature = `${standard.code}_`;

  switch (standard.skill) {
    case "numbers.placeValue": {
      const max = standard.grade === 3 ? 999 : 999999;
      const number = r.range(standard.grade === 3 ? 100 : 10000, max);
      const positions = standard.grade === 3 ? [1, 10, 100] : [1, 10, 100, 1000, 10000];
      const place = r.pick(positions);
      const digit = Math.floor(number / place) % 10;
      answer = digit * place;
      prompt = `${number.toLocaleString("tr-TR")} sayısında ${digit} rakamının basamak değeri kaçtır?`;
      choices = distinctChoices(Number(answer), r, Math.max(5, place));
      explanation = [`${digit} rakamı ${place === 1 ? "birler" : place === 10 ? "onlar" : place === 100 ? "yüzler" : place === 1000 ? "binler" : "on binler"} basamağındadır.`, `${digit} × ${place} = ${answer}`];
      hint = "Rakamın bulunduğu basamağın değerini düşün.";
      signature += `${number}_${place}`;
      break;
    }
    case "numbers.rounding": {
      const place = standard.grade === 3 || difficulty < 5 ? 10 : r.pick([10, 100, 1000]);
      const number = r.range(place, standard.grade === 3 ? 999 : 99999);
      answer = Math.round(number / place) * place;
      prompt = `${number.toLocaleString("tr-TR")} sayısını en yakın ${place === 10 ? "onluğa" : place === 100 ? "yüzlüğe" : "binliğe"} yuvarla.`;
      choices = distinctChoices(Number(answer), r, place * 2);
      explanation = [`Yuvarlama basamağının sağındaki rakama bak.`, `${number.toLocaleString("tr-TR")} sayısı ${Number(answer).toLocaleString("tr-TR")} değerine daha yakındır.`];
      hint = "Sağdaki rakam 5 veya büyükse yukarı yuvarlanır.";
      signature += `${number}_${place}`;
      break;
    }
    case "numbers.parity": {
      const number = r.range(10, 999);
      answer = number % 2 === 0 ? "Çift" : "Tek";
      choices = ["Tek", "Çift"];
      prompt = `${number} sayısı tek mi, çift mi?`;
      explanation = [`Birler basamağı ${number % 10}.`, `${number % 2 === 0 ? "0, 2, 4, 6 veya 8 ile biten sayılar çifttir." : "1, 3, 5, 7 veya 9 ile biten sayılar tektir."}`];
      hint = "Yalnızca birler basamağına bakman yeterli.";
      signature += number;
      break;
    }
    case "fractions.parts": {
      const denominator = r.pick(standard.grade === 3 ? [2, 4] : [2, 3, 4, 5, 6, 8]);
      const numerator = r.range(1, denominator - 1);
      answer = `${numerator}/${denominator}`;
      const fractionChoices = new Set<string>([answer, `1/${denominator}`, `${denominator - numerator}/${denominator}`, `${numerator}/${denominator + 1}`]);
      let extraNumerator = 1;
      while (fractionChoices.size < 4) {
        fractionChoices.add(`${extraNumerator}/${denominator + 2}`);
        extraNumerator += 1;
      }
      choices = r.shuffle([...fractionChoices]);
      prompt = `Bir bütün ${denominator} eş parçaya ayrıldı ve ${numerator} parçası boyandı. Boyanan kısmı gösteren kesir hangisidir?`;
      explanation = [`Payda bütünün ${denominator} eş parçaya ayrıldığını gösterir.`, `Pay boyanan ${numerator} parçayı gösterir: ${answer}.`];
      hint = "Üste boyanan parça sayısı, alta toplam eş parça sayısı yazılır.";
      signature += `${numerator}_${denominator}`;
      break;
    }
    case "fractions.compare": {
      const denominator = r.range(4, 10);
      const a = r.range(1, denominator - 2);
      const b = r.range(a + 1, denominator - 1);
      const leftFirst = r.next() < 0.5;
      const left = leftFirst ? a : b;
      const right = leftFirst ? b : a;
      answer = left > right ? ">" : "<";
      choices = [">", "<", "="];
      prompt = `${left}/${denominator}  ?  ${right}/${denominator}`;
      explanation = [`Paydalar eşit olduğunda payı büyük olan kesir daha büyüktür.`, `${left} ${left > right ? ">" : "<"} ${right}, bu yüzden ${left}/${denominator} ${answer} ${right}/${denominator}.`];
      hint = "Paydalar aynı; payları karşılaştır.";
      signature += `${left}_${right}_${denominator}`;
      break;
    }
    case "fractions.operations": {
      const denominator = r.range(4, 12);
      const a = r.range(1, Math.max(1, denominator - 2));
      const b = r.range(1, denominator - a);
      answer = `${a + b}/${denominator}`;
      choices = r.shuffle([answer, `${a + b}/${denominator * 2}`, `${Math.abs(a - b)}/${denominator}`, `${a + b + 1}/${denominator}`]);
      prompt = `${a}/${denominator} + ${b}/${denominator} işleminin sonucu kaçtır?`;
      explanation = [`Paydalar eşit olduğu için payda ${denominator} olarak kalır.`, `Payları topla: ${a} + ${b} = ${a + b}. Sonuç ${answer}.`];
      hint = "Paydaları değiştirme, yalnızca payları topla.";
      signature += `${a}_${b}_${denominator}`;
      break;
    }
    case "measurement.time": {
      const hours = r.range(1, 3 + Math.floor(difficulty / 3));
      const minutes = r.pick([10, 15, 20, 30, 45]);
      answer = hours * 60 + minutes;
      prompt = `${hours} saat ${minutes} dakika toplam kaç dakikadır?`;
      choices = distinctChoices(Number(answer), r, 30);
      explanation = [`${hours} saat = ${hours} × 60 = ${hours * 60} dakika.`, `${hours * 60} + ${minutes} = ${answer} dakika.`];
      hint = "Bir saat 60 dakikadır.";
      signature += `${hours}_${minutes}`;
      break;
    }
    case "measurement.lengthMass": {
      const mass = r.next() < 0.5;
      const whole = r.range(1, 9);
      const factor = mass ? 1000 : 100;
      const part = mass ? r.range(1, 9) * 100 : r.range(1, 9) * 10;
      answer = whole * factor + part;
      prompt = `${whole} ${mass ? "kilogram" : "metre"} ${part} ${mass ? "gram" : "santimetre"} toplam kaç ${mass ? "gram" : "santimetre"}dir?`;
      choices = distinctChoices(Number(answer), r, 500);
      explanation = [`1 ${mass ? "kilogram" : "metre"} = ${factor} ${mass ? "gram" : "santimetre"}.`, `${whole} × ${factor} + ${part} = ${answer}.`];
      hint = `Bir ${mass ? "kilogramın 1000 gram" : "metrenin 100 santimetre"} olduğunu hatırla.`;
      signature += `${mass}_${whole}_${part}`;
      break;
    }
    case "geometry.shapes": {
      const shapes = [{ name: "üçgen", sides: 3 }, { name: "kare", sides: 4 }, { name: "beşgen", sides: 5 }, { name: "altıgen", sides: 6 }];
      const shape = r.pick(shapes);
      answer = shape.sides;
      choices = r.shuffle([3, 4, 5, 6]);
      prompt = `Bir ${shape.name}in kaç kenarı vardır?`;
      explanation = [`${shape.name.charAt(0).toUpperCase() + shape.name.slice(1)} ${shape.sides} doğru parçasından oluşur.`, `Bu yüzden ${shape.sides} kenarı vardır.`];
      hint = "Şeklin çevresindeki doğru parçalarını say.";
      signature += shape.name;
      break;
    }
    case "geometry.perimeterArea": {
      const width = r.range(2, 10 + difficulty);
      const height = r.range(2, 10 + difficulty);
      const areaQuestion = standard.code === "MAT.4.3.4";
      answer = areaQuestion ? width * height : 2 * (width + height);
      prompt = `Kenarları ${width} cm ve ${height} cm olan dikdörtgenin ${areaQuestion ? "alanı" : "çevresi"} kaç ${areaQuestion ? "cm²" : "cm"}dir?`;
      choices = distinctChoices(Number(answer), r, 12);
      explanation = areaQuestion ? [`Alan = kısa kenar × uzun kenar.`, `${width} × ${height} = ${answer} cm².`] : [`Çevre bütün kenarların toplamıdır.`, `2 × (${width} + ${height}) = ${answer} cm.`];
      hint = areaQuestion ? "Satır ve sütun sayılarını çarp." : "İki kısa ve iki uzun kenarı topla.";
      signature += `${areaQuestion}_${width}_${height}`;
      break;
    }
    case "geometry.angles": {
      const angle = r.pick([30, 45, 90, 120, 150]);
      answer = angle < 90 ? "Dar açı" : angle === 90 ? "Dik açı" : "Geniş açı";
      choices = ["Dar açı", "Dik açı", "Geniş açı"];
      prompt = `${angle}° büyüklüğündeki açı hangi tür açıdır?`;
      explanation = [`Dar açı 90°'den küçük, dik açı 90°, geniş açı 90°'den büyüktür.`, `${angle}° bir ${String(answer).toLocaleLowerCase("tr-TR")}dır.`];
      hint = "Açıyı 90° ile karşılaştır.";
      signature += angle;
      break;
    }
    case "geometry.symmetry": {
      const shapes = [{ name: "kare", axes: 4 }, { name: "dikdörtgen", axes: 2 }, { name: "eşkenar üçgen", axes: 3 }, { name: "çeşitkenar üçgen", axes: 0 }];
      const shape = r.pick(shapes);
      answer = shape.axes;
      const removable = r.pick([0, 1, 2, 3, 4].filter((value) => value !== answer));
      choices = r.shuffle([0, 1, 2, 3, 4].filter((value) => value !== removable));
      prompt = `Bir ${shape.name}in kaç simetri doğrusu vardır?`;
      explanation = [`Şekli iki eş parçaya ayıran katlama çizgilerini düşün.`, `${shape.name.charAt(0).toUpperCase() + shape.name.slice(1)} için ${shape.axes} simetri doğrusu vardır.`];
      hint = "Şekli katladığında iki tarafın tam üst üste geldiği çizgileri say.";
      signature += shape.name;
      break;
    }
    case "data.reading": {
      const [swim, lego, books] = r.shuffle([r.range(3, 5), r.range(6, 8), r.range(9, 11)]);
      answer = Math.max(swim, lego, books);
      const winner = answer === swim ? "Yüzme" : answer === lego ? "Lego" : "Kitap";
      choices = ["Yüzme", "Lego", "Kitap"];
      answer = winner;
      prompt = `Arel’in haftalık etkinlik tablosu: Yüzme ${swim}, Lego ${lego}, Kitap ${books}. En çok yapılan etkinlik hangisidir?`;
      explanation = [`Değerleri karşılaştır: ${swim}, ${lego}, ${books}.`, `En büyük değer ${Math.max(swim, lego, books)} olduğu için cevap ${winner}.`];
      hint = "Tablodaki en büyük sayıyı bul.";
      signature += `${swim}_${lego}_${books}`;
      break;
    }
    case "probability.qualitative": {
      const red = r.range(4, 8);
      const blue = r.range(1, 3);
      answer = "Kırmızı";
      choices = ["Kırmızı", "Mavi", "Eşit olasılıklı"];
      prompt = `Bir torbada ${red} kırmızı ve ${blue} mavi bilye var. Bakmadan çekilen bilyenin hangi renk olma olasılığı daha fazladır?`;
      explanation = [`Kırmızı bilye sayısı ${red}, mavi bilye sayısı ${blue}.`, `Kırmızı daha çok olduğu için kırmızı gelmesi daha olasıdır.`];
      hint = "Torbada hangi renk daha çok?";
      signature += `${red}_${blue}`;
      break;
    }
  }

  return {
    id,
    signature,
    category: "curriculum",
    categoryTitle: `${standard.grade}. Sınıf · ${standard.title}`,
    skill: standard.skill,
    difficulty: Math.max(1, Math.min(10, difficulty)),
    questionType: choices ? "multipleChoice" : "numeric",
    prompt,
    answer,
    choices,
    explanation,
    hint,
    curriculum: {
      grade: standard.grade,
      theme: standard.theme,
      themeTitle: standard.themeTitle,
      outcomeCode: standard.code,
      outcomeTitle: standard.title,
    },
  };
}
