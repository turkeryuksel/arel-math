export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: "brain" | "flame" | "zap" | "trophy" | "puzzle" | "calculator" | "target" | "star";
  tier: "bronze" | "silver" | "gold" | "diamond";
  colorClass: string;
  bgGradient: string;
  requirement: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
  {
    id: "first_step",
    title: "İlk Adım",
    description: "İlk matematik antrenmanını tamamla.",
    icon: "star",
    tier: "bronze",
    colorClass: "text-blue-500",
    bgGradient: "from-blue-500 to-indigo-600",
    requirement: "1 antrenman",
  },
  {
    id: "streak_7",
    title: "7 Gün Seri",
    description: "7 gün aralıksız matematik çalışarak serini koru.",
    icon: "flame",
    tier: "gold",
    colorClass: "text-orange-500",
    bgGradient: "from-amber-500 to-orange-600",
    requirement: "7 gün kesintisiz çalışma",
  },
  {
    id: "mental_master",
    title: "Zihinden Usta",
    description: "100 zihinden matematik işlemini doğru çöz.",
    icon: "brain",
    tier: "gold",
    colorClass: "text-teal-600",
    bgGradient: "from-emerald-500 to-teal-600",
    requirement: "100 zihinden işlem",
  },
  {
    id: "speed_processor",
    title: "Hızlı İşlemci",
    description: "Hız turunda veya hızlı antrenmanda 20 doğru yap.",
    icon: "zap",
    tier: "silver",
    colorClass: "text-purple-600",
    bgGradient: "from-purple-500 to-indigo-600",
    requirement: "20 hızlı doğru",
  },
  {
    id: "multiplication_champ",
    title: "Çarpım Şampiyonu",
    description: "100 çarpma ve çarpım tablosu sorusu çöz.",
    icon: "calculator",
    tier: "gold",
    colorClass: "text-blue-600",
    bgGradient: "from-blue-500 to-cyan-600",
    requirement: "100 çarpma sorusu",
  },
  {
    id: "problem_solver",
    title: "Problem Çözücü",
    description: "50 gerçek yaşam problemini başarıyla çöz.",
    icon: "puzzle",
    tier: "gold",
    colorClass: "text-amber-500",
    bgGradient: "from-yellow-400 to-amber-600",
    requirement: "50 problem",
  },
  {
    id: "thousand_questions",
    title: "1000 Soru Kulübü",
    description: "Toplam 1000 soru çözerek matematik refleksini zirveye taşı.",
    icon: "trophy",
    tier: "diamond",
    colorClass: "text-indigo-600",
    bgGradient: "from-indigo-600 to-violet-800",
    requirement: "1000 soru çözümü",
  },
  {
    id: "sharpshooter",
    title: "Tam İsabet",
    description: "Bir antrenmanı %100 doğrulukla hatasız bitir.",
    icon: "target",
    tier: "silver",
    colorClass: "text-rose-500",
    bgGradient: "from-rose-500 to-pink-600",
    requirement: "Kusursuz antrenman",
  },
];
