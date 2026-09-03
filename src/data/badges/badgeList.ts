export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: "brain" | "flame" | "zap" | "trophy" | "puzzle" | "calculator" | "target" | "star" | "shield" | "award" | "crown" | "compass";
  tier: "bronze" | "silver" | "gold" | "diamond";
  gradientStyle: {
    background: string;
    shadow: string;
  };
  requirement: string;
}

export const ALL_BADGES: BadgeDefinition[] = [
  {
    id: "first_step",
    title: "İlk Adım",
    description: "İlk matematik antrenmanını tamamla.",
    icon: "star",
    tier: "bronze",
    gradientStyle: {
      background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)",
      shadow: "rgba(59, 130, 246, 0.35)",
    },
    requirement: "1 antrenman",
  },
  {
    id: "streak_7",
    title: "7 Gün Seri",
    description: "7 gün aralıksız matematik çalışarak serini koru.",
    icon: "flame",
    tier: "gold",
    gradientStyle: {
      background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
      shadow: "rgba(245, 158, 11, 0.4)",
    },
    requirement: "7 gün kesintisiz çalışma",
  },
  {
    id: "mental_master",
    title: "Zihinden Usta",
    description: "100 zihinden matematik işlemini doğru çöz.",
    icon: "brain",
    tier: "gold",
    gradientStyle: {
      background: "linear-gradient(135deg, #10B981 0%, #0D9488 100%)",
      shadow: "rgba(16, 185, 129, 0.35)",
    },
    requirement: "100 zihinden işlem",
  },
  {
    id: "speed_processor",
    title: "Hızlı İşlemci",
    description: "Hız turunda veya hızlı antrenmanda 20 doğru yap.",
    icon: "zap",
    tier: "silver",
    gradientStyle: {
      background: "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
      shadow: "rgba(168, 85, 247, 0.35)",
    },
    requirement: "20 hızlı doğru",
  },
  {
    id: "multiplication_champ",
    title: "Çarpım Şampiyonu",
    description: "100 çarpma ve çarpım tablosu sorusu çöz.",
    icon: "calculator",
    tier: "gold",
    gradientStyle: {
      background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
      shadow: "rgba(14, 165, 233, 0.35)",
    },
    requirement: "100 çarpma sorusu",
  },
  {
    id: "problem_solver",
    title: "Problem Çözücü",
    description: "50 gerçek yaşam problemini başarıyla çöz.",
    icon: "puzzle",
    tier: "gold",
    gradientStyle: {
      background: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
      shadow: "rgba(251, 191, 36, 0.4)",
    },
    requirement: "50 problem",
  },
  {
    id: "thousand_questions",
    title: "1000 Soru Kulübü",
    description: "Toplam 1000 soru çözerek matematik refleksini zirveye taşı.",
    icon: "trophy",
    tier: "diamond",
    gradientStyle: {
      background: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
      shadow: "rgba(99, 102, 241, 0.4)",
    },
    requirement: "1000 soru çözümü",
  },
  {
    id: "sharpshooter",
    title: "Tam İsabet",
    description: "Bir antrenmanı %100 doğrulukla hatasız bitir.",
    icon: "target",
    tier: "silver",
    gradientStyle: {
      background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
      shadow: "rgba(244, 63, 94, 0.35)",
    },
    requirement: "Kusursuz antrenman",
  },
  {
    id: "division_expert",
    title: "Bölme Kâşifi",
    description: "Kalanlı ve kalansız 50 bölme işlemini ustalıkla tamamla.",
    icon: "compass",
    tier: "gold",
    gradientStyle: {
      background: "linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)",
      shadow: "rgba(6, 182, 212, 0.35)",
    },
    requirement: "50 bölme işlemi",
  },
  {
    id: "streak_30",
    title: "Efsanevi Seri",
    description: "30 gün aralıksız matematik serisini tamamla.",
    icon: "crown",
    tier: "diamond",
    gradientStyle: {
      background: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
      shadow: "rgba(236, 72, 153, 0.4)",
    },
    requirement: "30 günlük seri",
  },
  {
    id: "curriculum_p1",
    title: "3. Sınıf Fatihi",
    description: "3. Sınıf tekrar fazını (ilk 40 gün) başarıyla tamamla.",
    icon: "shield",
    tier: "silver",
    gradientStyle: {
      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      shadow: "rgba(16, 185, 129, 0.4)",
    },
    requirement: "Faz 1 tamamlama",
  },
  {
    id: "curriculum_p3",
    title: "4. Sınıf Ustası",
    description: "4. Sınıf temel müfredatını başarıyla tamamla.",
    icon: "award",
    tier: "diamond",
    gradientStyle: {
      background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
      shadow: "rgba(139, 92, 246, 0.45)",
    },
    requirement: "Faz 3 tamamlama",
  },
];
