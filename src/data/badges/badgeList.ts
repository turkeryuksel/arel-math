export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: "brain" | "flame" | "zap" | "trophy" | "puzzle" | "calculator" | "target" | "star" | "shield" | "award" | "crown" | "compass";
  tier: "bronze" | "silver" | "gold" | "diamond";
  emoji: string;
  gradientStyle: {
    background: string;
    shadow: string;
  };
  requirement: string;
  metric: BadgeMetric;
  threshold: number;
}

export type BadgeMetric =
  | "totalAttempts"
  | "currentStreak"
  | "mentalCorrect"
  | "fastCorrect"
  | "multiplicationAttempts"
  | "problemCorrect"
  | "perfectDaily"
  | "divisionCorrect"
  | "completedSessions"
  | "gameCompletions";

export const ALL_BADGES: BadgeDefinition[] = [
  {
    id: "first_step",
    title: "İlk Adım",
    description: "İlk matematik sorunu çöz.",
    icon: "star",
    tier: "bronze",
    emoji: "🌟",
    gradientStyle: {
      background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)",
      shadow: "rgba(59, 130, 246, 0.35)",
    },
    requirement: "1 soru çözümü",
    metric: "totalAttempts",
    threshold: 1,
  },
  {
    id: "streak_7",
    title: "7 Gün Seri",
    description: "7 gün aralıksız matematik çalışarak serini koru.",
    icon: "flame",
    tier: "gold",
    emoji: "🔥",
    gradientStyle: {
      background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
      shadow: "rgba(245, 158, 11, 0.4)",
    },
    requirement: "7 gün kesintisiz çalışma",
    metric: "currentStreak",
    threshold: 7,
  },
  {
    id: "mental_master",
    title: "Zihinden Usta",
    description: "100 zihinden matematik işlemini doğru çöz.",
    icon: "brain",
    tier: "gold",
    emoji: "🧠",
    gradientStyle: {
      background: "linear-gradient(135deg, #10B981 0%, #0D9488 100%)",
      shadow: "rgba(16, 185, 129, 0.35)",
    },
    requirement: "100 zihinden işlem",
    metric: "mentalCorrect",
    threshold: 100,
  },
  {
    id: "speed_processor",
    title: "Hızlı İşlemci",
    description: "20 soruyu 10 saniye içinde doğru çöz.",
    icon: "zap",
    tier: "silver",
    emoji: "⚡",
    gradientStyle: {
      background: "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
      shadow: "rgba(168, 85, 247, 0.35)",
    },
    requirement: "10 saniye içinde 20 doğru",
    metric: "fastCorrect",
    threshold: 20,
  },
  {
    id: "multiplication_champ",
    title: "Çarpım Şampiyonu",
    description: "100 çarpma ve çarpım tablosu sorusu çöz.",
    icon: "calculator",
    tier: "gold",
    emoji: "🧱",
    gradientStyle: {
      background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)",
      shadow: "rgba(14, 165, 233, 0.35)",
    },
    requirement: "100 çarpma sorusu",
    metric: "multiplicationAttempts",
    threshold: 100,
  },
  {
    id: "problem_solver",
    title: "Problem Çözücü",
    description: "50 gerçek yaşam problemini başarıyla çöz.",
    icon: "puzzle",
    tier: "gold",
    emoji: "🧭",
    gradientStyle: {
      background: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
      shadow: "rgba(251, 191, 36, 0.4)",
    },
    requirement: "50 problem",
    metric: "problemCorrect",
    threshold: 50,
  },
  {
    id: "thousand_questions",
    title: "1000 Soru Kulübü",
    description: "Toplam 1000 soru çözerek matematik refleksini zirveye taşı.",
    icon: "trophy",
    tier: "diamond",
    emoji: "🏆",
    gradientStyle: {
      background: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
      shadow: "rgba(99, 102, 241, 0.4)",
    },
    requirement: "1000 soru çözümü",
    metric: "totalAttempts",
    threshold: 1000,
  },
  {
    id: "sharpshooter",
    title: "Tam İsabet",
    description: "En az 10 soruluk bir günlük görevi hatasız bitir.",
    icon: "target",
    tier: "silver",
    emoji: "🎯",
    gradientStyle: {
      background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
      shadow: "rgba(244, 63, 94, 0.35)",
    },
    requirement: "Kusursuz günlük görev",
    metric: "perfectDaily",
    threshold: 1,
  },
  {
    id: "division_expert",
    title: "Bölme Kâşifi",
    description: "Kalanlı ve kalansız 50 bölme işlemini ustalıkla tamamla.",
    icon: "compass",
    tier: "gold",
    emoji: "🧩",
    gradientStyle: {
      background: "linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)",
      shadow: "rgba(6, 182, 212, 0.35)",
    },
    requirement: "50 bölme işlemi",
    metric: "divisionCorrect",
    threshold: 50,
  },
  {
    id: "streak_30",
    title: "Efsanevi Seri",
    description: "30 gün aralıksız matematik serisini tamamla.",
    icon: "crown",
    tier: "diamond",
    emoji: "👑",
    gradientStyle: {
      background: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
      shadow: "rgba(236, 72, 153, 0.4)",
    },
    requirement: "30 günlük seri",
    metric: "currentStreak",
    threshold: 30,
  },
  {
    id: "curriculum_p1",
    title: "3. Sınıf Fatihi",
    description: "3. Sınıf tekrar fazını (ilk 40 gün) başarıyla tamamla.",
    icon: "shield",
    tier: "silver",
    emoji: "🎒",
    gradientStyle: {
      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      shadow: "rgba(16, 185, 129, 0.4)",
    },
    requirement: "Faz 1 tamamlama",
    metric: "completedSessions",
    threshold: 40,
  },
  {
    id: "curriculum_p3",
    title: "4. Sınıf Ustası",
    description: "4. Sınıf temel müfredatını başarıyla tamamla.",
    icon: "award",
    tier: "diamond",
    emoji: "🚀",
    gradientStyle: {
      background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
      shadow: "rgba(139, 92, 246, 0.45)",
    },
    requirement: "Faz 3 tamamlama",
    metric: "completedSessions",
    threshold: 120,
  },
  {
    id: "warmup_10", title: "Merak Kıvılcımı", description: "İlk 10 soruyla keşif yolculuğunu başlat.",
    icon: "star", tier: "bronze", emoji: "🌈",
    gradientStyle: { background: "linear-gradient(135deg,#22D3EE,#6366F1)", shadow: "rgba(34,211,238,.35)" },
    requirement: "10 soru", metric: "totalAttempts", threshold: 10,
  },
  {
    id: "explorer_50", title: "Soru Kâşifi", description: "50 farklı sorunun izini sür.",
    icon: "compass", tier: "bronze", emoji: "🗺️",
    gradientStyle: { background: "linear-gradient(135deg,#34D399,#0EA5E9)", shadow: "rgba(52,211,153,.35)" },
    requirement: "50 soru", metric: "totalAttempts", threshold: 50,
  },
  {
    id: "century_100", title: "Yüzler Kulübü", description: "100 soruluk büyük dönüm noktasına ulaş.",
    icon: "award", tier: "silver", emoji: "💯",
    gradientStyle: { background: "linear-gradient(135deg,#F472B6,#8B5CF6)", shadow: "rgba(244,114,182,.35)" },
    requirement: "100 soru", metric: "totalAttempts", threshold: 100,
  },
  {
    id: "question_250", title: "Bilgi Roketi", description: "250 soruyla öğrenme roketini ateşle.",
    icon: "zap", tier: "gold", emoji: "🚀",
    gradientStyle: { background: "linear-gradient(135deg,#F59E0B,#EF4444)", shadow: "rgba(245,158,11,.35)" },
    requirement: "250 soru", metric: "totalAttempts", threshold: 250,
  },
  {
    id: "streak_3", title: "Filizlenen Seri", description: "Üç gün üst üste öğrenme alışkanlığı kur.",
    icon: "flame", tier: "bronze", emoji: "🌱",
    gradientStyle: { background: "linear-gradient(135deg,#84CC16,#10B981)", shadow: "rgba(132,204,22,.35)" },
    requirement: "3 günlük seri", metric: "currentStreak", threshold: 3,
  },
  {
    id: "streak_14", title: "İki Haftalık Kahraman", description: "14 günlük öğrenme serisini tamamla.",
    icon: "shield", tier: "gold", emoji: "🦸",
    gradientStyle: { background: "linear-gradient(135deg,#3B82F6,#7C3AED)", shadow: "rgba(59,130,246,.35)" },
    requirement: "14 günlük seri", metric: "currentStreak", threshold: 14,
  },
  {
    id: "mental_spark_25", title: "Zihin Şimşeği", description: "25 zihinden matematik sorusunu doğru çöz.",
    icon: "brain", tier: "bronze", emoji: "✨",
    gradientStyle: { background: "linear-gradient(135deg,#06B6D4,#2563EB)", shadow: "rgba(6,182,212,.35)" },
    requirement: "25 zihinden doğru", metric: "mentalCorrect", threshold: 25,
  },
  {
    id: "multiplication_rookie", title: "Çarpım Mimarı", description: "10 çarpma sorusuyla sağlam bir temel kur.",
    icon: "calculator", tier: "bronze", emoji: "🏗️",
    gradientStyle: { background: "linear-gradient(135deg,#FB923C,#FACC15)", shadow: "rgba(251,146,60,.35)" },
    requirement: "10 çarpma sorusu", metric: "multiplicationAttempts", threshold: 10,
  },
  {
    id: "division_rookie", title: "Paylaşım Ustası", description: "10 bölme sorusunu doğru çöz.",
    icon: "puzzle", tier: "bronze", emoji: "🍕",
    gradientStyle: { background: "linear-gradient(135deg,#14B8A6,#22C55E)", shadow: "rgba(20,184,166,.35)" },
    requirement: "10 bölme doğru", metric: "divisionCorrect", threshold: 10,
  },
  {
    id: "problem_rookie", title: "Hikâye Dedektifi", description: "10 hikâyeli problemi başarıyla çöz.",
    icon: "compass", tier: "bronze", emoji: "🔎",
    gradientStyle: { background: "linear-gradient(135deg,#FBBF24,#F97316)", shadow: "rgba(251,191,36,.35)" },
    requirement: "10 problem", metric: "problemCorrect", threshold: 10,
  },
  {
    id: "problem_explorer", title: "Macera Çözücüsü", description: "25 hikâyeli problemin sırrını çöz.",
    icon: "puzzle", tier: "silver", emoji: "🧙",
    gradientStyle: { background: "linear-gradient(135deg,#A855F7,#EC4899)", shadow: "rgba(168,85,247,.35)" },
    requirement: "25 problem", metric: "problemCorrect", threshold: 25,
  },
  {
    id: "curriculum_p2", title: "Köprü Kurucu", description: "3. sınıf bilgisinden 4. sınıfa uzanan köprüyü tamamla.",
    icon: "shield", tier: "gold", emoji: "🌉",
    gradientStyle: { background: "linear-gradient(135deg,#0EA5E9,#4F46E5)", shadow: "rgba(14,165,233,.35)" },
    requirement: "Faz 2 tamamlama", metric: "completedSessions", threshold: 80,
  },
  {
    id: "first_game", title: "Oyun Molası", description: "İlk gerçek mini oyununu tamamla.",
    icon: "star", tier: "bronze", emoji: "🎮",
    gradientStyle: { background: "linear-gradient(135deg,#22D3EE,#8B5CF6)", shadow: "rgba(139,92,246,.35)" },
    requirement: "1 oyun tamamla", metric: "gameCompletions", threshold: 1,
  },
  {
    id: "game_explorer_5", title: "Oyun Kâşifi", description: "Beş mini oyun molasını tamamla.",
    icon: "compass", tier: "silver", emoji: "🕹️",
    gradientStyle: { background: "linear-gradient(135deg,#10B981,#3B82F6)", shadow: "rgba(16,185,129,.35)" },
    requirement: "5 oyun tamamla", metric: "gameCompletions", threshold: 5,
  },
  {
    id: "game_master_20", title: "Arel Oyun Ustası", description: "20 keyifli oyun molasını tamamla.",
    icon: "crown", tier: "gold", emoji: "🪄",
    gradientStyle: { background: "linear-gradient(135deg,#F59E0B,#EC4899,#7C3AED)", shadow: "rgba(236,72,153,.4)" },
    requirement: "20 oyun tamamla", metric: "gameCompletions", threshold: 20,
  },
];
