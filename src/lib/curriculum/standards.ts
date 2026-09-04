import { SkillId } from "@/lib/questions/types";

export interface CurriculumStandard {
  code: string;
  grade: 3 | 4;
  theme: number;
  themeTitle: string;
  title: string;
  skill: SkillId;
}

// MEB Türkiye Yüzyılı Maarif Modeli İlkokul Matematik (2026) kazanımları.
// Soru üreticisi yalnızca burada tanımlı ve test edilen kazanımlardan seçim yapar.
export const CURRICULUM_STANDARDS: CurriculumStandard[] = [
  { code: "MAT.3.1.2", grade: 3, theme: 1, themeTitle: "Sayılar ve Nicelikler (1)", title: "Basamak değeri", skill: "numbers.placeValue" },
  { code: "MAT.3.1.3", grade: 3, theme: 1, themeTitle: "Sayılar ve Nicelikler (1)", title: "Sıralama ve yuvarlama", skill: "numbers.rounding" },
  { code: "MAT.3.1.5", grade: 3, theme: 1, themeTitle: "Sayılar ve Nicelikler (1)", title: "Tek ve çift sayılar", skill: "numbers.parity" },
  { code: "MAT.3.1.9", grade: 3, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Bütün, yarım ve çeyrek", skill: "fractions.parts" },
  { code: "MAT.3.1.12", grade: 3, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Zaman ölçme", skill: "measurement.time" },
  { code: "MAT.3.1.15", grade: 3, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Uzunluk ve kütle", skill: "measurement.lengthMass" },
  { code: "MAT.3.3.2", grade: 3, theme: 4, themeTitle: "Nesnelerin Geometrisi (1)", title: "Geometrik şekiller", skill: "geometry.shapes" },
  { code: "MAT.3.3.4", grade: 3, theme: 4, themeTitle: "Nesnelerin Geometrisi (1)", title: "Çevre ölçme", skill: "geometry.perimeterArea" },
  { code: "MAT.3.3.6", grade: 3, theme: 5, themeTitle: "Nesnelerin Geometrisi (2)", title: "Simetri", skill: "geometry.symmetry" },
  { code: "MAT.3.4.1", grade: 3, theme: 6, themeTitle: "Veriye Dayalı Araştırma", title: "Tablo ve grafik okuma", skill: "data.reading" },
  { code: "MAT.4.1.1", grade: 4, theme: 1, themeTitle: "Sayılar ve Nicelikler (1)", title: "Doğal sayıları çözümleme", skill: "numbers.placeValue" },
  { code: "MAT.4.1.3", grade: 4, theme: 1, themeTitle: "Sayılar ve Nicelikler (1)", title: "Sıralama ve yuvarlama", skill: "numbers.rounding" },
  { code: "MAT.4.1.6", grade: 4, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Kesirleri gösterme", skill: "fractions.parts" },
  { code: "MAT.4.1.9", grade: 4, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Kesirleri karşılaştırma", skill: "fractions.compare" },
  { code: "MAT.4.1.11", grade: 4, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Kesirlerle toplama ve çıkarma", skill: "fractions.operations" },
  { code: "MAT.4.1.13", grade: 4, theme: 2, themeTitle: "Sayılar ve Nicelikler (2)", title: "Uzunluk ve kütle dönüşümleri", skill: "measurement.lengthMass" },
  { code: "MAT.4.3.2", grade: 4, theme: 3, themeTitle: "Nesnelerin Geometrisi (1)", title: "Geometrik şekiller", skill: "geometry.shapes" },
  { code: "MAT.4.3.3", grade: 4, theme: 3, themeTitle: "Nesnelerin Geometrisi (1)", title: "Çevre ölçme", skill: "geometry.perimeterArea" },
  { code: "MAT.4.3.4", grade: 4, theme: 3, themeTitle: "Nesnelerin Geometrisi (1)", title: "Alan ölçme", skill: "geometry.perimeterArea" },
  { code: "MAT.4.3.7", grade: 4, theme: 4, themeTitle: "Nesnelerin Geometrisi (2)", title: "Açıları tanıma", skill: "geometry.angles" },
  { code: "MAT.4.3.9", grade: 4, theme: 5, themeTitle: "Nesnelerin Geometrisi (3)", title: "Simetri", skill: "geometry.symmetry" },
  { code: "MAT.4.4.1", grade: 4, theme: 6, themeTitle: "Olasılığa Dayalı Araştırma", title: "Olasılık dili", skill: "probability.qualitative" },
  { code: "MAT.4.4.2", grade: 4, theme: 7, themeTitle: "Veriye Dayalı Araştırma", title: "Tablo ve grafik okuma", skill: "data.reading" },
];

export function getStandardsForGrade(grade: 3 | 4): CurriculumStandard[] {
  return CURRICULUM_STANDARDS.filter((standard) => standard.grade === grade);
}

export function getStandardsForDay(day: number): CurriculumStandard[] {
  if (day <= 40) return getStandardsForGrade(3);
  if (day <= 80) return CURRICULUM_STANDARDS;
  return getStandardsForGrade(4);
}
