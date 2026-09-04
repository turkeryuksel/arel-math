"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Gamepad2, Gem, Heart, Rocket, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/lib/firebase/authContext";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { getTroubledSkills } from "@/lib/adaptive/difficulty";
import { generateQuestion } from "@/lib/questions/engine";
import { Question, QuestionCategory } from "@/lib/questions/types";
import { createGameChoices } from "@/lib/games/choices";

type GameId = "ocean" | "lego" | "space";

const GAMES: Array<{
  id: GameId;
  title: string;
  description: string;
  icon: string;
  reward: string;
  category: QuestionCategory;
  gradient: string;
}> = [
  {
    id: "ocean",
    title: "Arel’in Denizaltı Hazinesi",
    description: "Hikâyeli problemleri çöz, kayıp incileri bul.",
    icon: "🤿",
    reward: "inci",
    category: "problems",
    gradient: "from-cyan-500 to-blue-700",
  },
  {
    id: "lego",
    title: "Lego Kulesi",
    description: "Her doğru işlemle kuleye yeni bir parça ekle.",
    icon: "🧱",
    reward: "parça",
    category: "operations",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "space",
    title: "Uzay Rotası",
    description: "Zihinden hesapla, Arel’in roketini yeni gezegenlere ulaştır.",
    icon: "🚀",
    reward: "yıldız",
    category: "mental-math",
    gradient: "from-violet-600 to-indigo-800",
  },
];

const ROUND_SIZE = 10;

export default function GamesPage() {
  const { profile } = useAuth();
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongChoices, setWrongChoices] = useState<Set<string>>(new Set());
  const [isSolved, setIsSolved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const questionStartedAt = useRef(Date.now());

  const activeGame = GAMES.find((game) => game.id === activeGameId) || null;
  const choices = useMemo(() => question ? createGameChoices(question) : [], [question]);
  const difficulty = useMemo(() => {
    const ratings = Object.values(profile.skillRatings || {});
    if (ratings.length === 0) return 2;
    return Math.max(1, Math.min(10, Math.round(
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    )));
  }, [profile.skillRatings]);

  const makeQuestion = (game: (typeof GAMES)[number], signatures: Set<string>) => {
    const next = generateQuestion({
      category: game.category,
      difficulty,
      troubledSkills: getTroubledSkills(profile),
      recentSignatures: signatures,
      seed: `${profile.id}_${game.id}_${Date.now()}_${Math.random()}`,
    });
    signatures.add(next.signature);
    return next;
  };

  const startGame = (game: (typeof GAMES)[number]) => {
    const signatures = new Set(
      AppStorage.getAttempts().slice(-200).flatMap((attempt) => attempt.signature ? [attempt.signature] : [])
    );
    setActiveGameId(game.id);
    setQuestion(makeQuestion(game, signatures));
    setQuestionNumber(1);
    setScore(0);
    setWrongChoices(new Set());
    setIsSolved(false);
    setMessage("");
    setSeen(signatures);
    questionStartedAt.current = Date.now();
  };

  const chooseAnswer = async (choice: number | string) => {
    if (!question || isSolved || isSaving) return;
    const key = String(choice);
    if (wrongChoices.has(key)) return;
    const correct = key === String(question.answer);
    setIsSaving(true);
    try {
      await AppStorage.recordPracticeAnswer(
        question,
        choice,
        correct,
        Date.now() - questionStartedAt.current
      );
      if (correct) {
        setScore((current) => current + 1);
        setIsSolved(true);
        setMessage("İşte bu! Kendi yolunu buldun. Hazinemize bir parça daha eklendi! ✨");
      } else {
        setWrongChoices((current) => new Set(current).add(key));
        setMessage(question.hint
          ? `Güzel bir denemeydi. Küçük ipucu: ${question.hint}`
          : "Bu yol bizi hazineye götürmedi ama yeni bir şey öğrendik. Bir kez daha düşünelim!");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const nextQuestion = () => {
    if (!activeGame || !isSolved) return;
    if (questionNumber >= ROUND_SIZE) {
      setQuestion(null);
      return;
    }
    const nextSeen = new Set(seen);
    setQuestion(makeQuestion(activeGame, nextSeen));
    setSeen(nextSeen);
    setQuestionNumber((current) => current + 1);
    setWrongChoices(new Set());
    setIsSolved(false);
    setMessage("");
    questionStartedAt.current = Date.now();
  };

  const closeGame = () => {
    setActiveGameId(null);
    setQuestion(null);
    setQuestionNumber(0);
  };

  if (activeGame && questionNumber >= ROUND_SIZE && !question) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center p-4 sm:p-8">
        <div className="w-full rounded-[2rem] border border-amber-100 bg-white p-7 text-center shadow-xl sm:p-10">
          <Trophy className="mx-auto h-16 w-16 text-amber-500" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">Macera tamamlandı!</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {score} {activeGame.reward} topladın. En güzeli de her denemede yeni bir yol keşfettin.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={() => startGame(activeGame)} className="min-h-13 rounded-2xl bg-blue-600 px-5 font-black text-white">
              Bir Tur Daha
            </button>
            <button onClick={closeGame} className="min-h-13 rounded-2xl bg-slate-100 px-5 font-black text-slate-700">
              Başka Oyun Seç
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeGame && question) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">
        <div className={`rounded-[2rem] bg-gradient-to-br ${activeGame.gradient} p-5 text-white shadow-xl sm:p-7`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activeGame.icon}</span>
              <div>
                <h1 className="text-lg font-black sm:text-xl">{activeGame.title}</h1>
                <p className="text-xs font-bold text-white/75">{questionNumber} / {ROUND_SIZE} · {score} {activeGame.reward}</p>
              </div>
            </div>
            <button onClick={closeGame} className="flex min-h-11 items-center gap-1 rounded-2xl bg-white/15 px-3 text-xs font-bold">
              <ArrowLeft className="h-4 w-4" /> Çık
            </button>
          </div>
          <div className="mt-5 flex gap-1.5" aria-label={`${questionNumber}/${ROUND_SIZE} ilerleme`}>
            {Array.from({ length: ROUND_SIZE }, (_, index) => (
              <span key={index} className={`h-2 flex-1 rounded-full ${index < questionNumber ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-soft sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Gem className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Hazine yolu</p>
              <h2 className="mt-1 text-lg font-black leading-relaxed text-slate-900 sm:text-2xl">{question.prompt}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {choices.map((choice) => {
              const key = String(choice);
              const wasTried = wrongChoices.has(key);
              const isAnswer = isSolved && key === String(question.answer);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isSaving || wasTried || isSolved}
                  onClick={() => chooseAnswer(choice)}
                  className={`min-h-16 rounded-2xl border-2 px-3 text-xl font-black transition-all ${
                    isAnswer ? "border-emerald-400 bg-emerald-50 text-emerald-700" :
                    wasTried ? "border-slate-100 bg-slate-50 text-slate-300" :
                    "border-blue-100 bg-blue-50/50 text-blue-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98]"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {message && (
            <div className={`mt-5 rounded-2xl p-4 text-sm font-bold leading-relaxed ${isSolved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
              <div className="flex items-start gap-2">
                {isSolved ? <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0" /> : <Heart className="mt-0.5 h-5 w-5 flex-shrink-0" />}
                <span>{message}</span>
              </div>
            </div>
          )}

          {isSolved && (
            <button onClick={nextQuestion} className="mt-5 min-h-13 w-full rounded-2xl bg-emerald-600 px-5 font-black text-white shadow-lg shadow-emerald-200">
              {questionNumber === ROUND_SIZE ? "Hazinemizi Aç" : "Macera Devam Etsin"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-6 text-white shadow-xl sm:p-8">
        <Gamepad2 className="h-12 w-12" />
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">Arel’in Oyun Alanı</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-blue-100">
          Burada süre baskısı ve kaybetmek yok. Her deneme yeni bir ipucu, her doğru yeni bir macera parçası.
        </p>
        <Rocket className="absolute -bottom-5 -right-3 h-32 w-32 rotate-[-12deg] text-white/10" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {GAMES.map((game) => (
          <button key={game.id} onClick={() => startGame(game)} className="group rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-xl">
            <span className="text-5xl">{game.icon}</span>
            <h2 className="mt-4 text-lg font-black text-slate-900">{game.title}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{game.description}</p>
            <span className="mt-5 inline-flex rounded-xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 group-hover:bg-blue-600 group-hover:text-white">
              Oyuna Başla
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
