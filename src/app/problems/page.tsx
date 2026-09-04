"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Compass, Play, Puzzle, RotateCcw, Sparkles, Trophy } from "lucide-react";
import {
  generateWordProblemQuestion,
  getThemeProblemSkills,
  PROBLEM_STANDARDS,
  ProblemSkill,
  WORD_PROBLEM_THEMES,
  WordProblemTheme,
} from "@/lib/questions/wordProblems";
import { Question } from "@/lib/questions/types";
import QuestionCard from "@/components/training/QuestionCard";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { useAuth } from "@/lib/firebase/authContext";

const QUESTIONS_PER_ADVENTURE = 8;

export default function ProblemsPage() {
  const { profile } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeTheme, setActiveTheme] = useState<WordProblemTheme | null>(null);
  const [isRandomAdventure, setIsRandomAdventure] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [seenSignatures, setSeenSignatures] = useState<Set<string>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<ProblemSkill | undefined>();

  const selectedStandard = PROBLEM_STANDARDS.find((item) => item.skill === selectedSkill)!;

  const difficulty = useMemo(() => {
    if (selectedSkill && profile.skillRatings?.[selectedSkill]) {
      return Math.max(1, Math.min(10, profile.skillRatings[selectedSkill]));
    }
    const problemRatings = Object.entries(profile.skillRatings || {})
      .filter(([skill]) => skill.startsWith("problem."))
      .map(([, rating]) => rating);
    if (problemRatings.length > 0) {
      return Math.max(1, Math.min(10, Math.round(
        problemRatings.reduce((total, rating) => total + rating, 0) / problemRatings.length
      )));
    }
    return Math.max(2, Math.min(6, 2 + Math.floor((profile.completedSessions || 0) / 40)));
  }, [profile, selectedSkill]);

  const createQuestion = (theme: WordProblemTheme | null, seen: Set<string>) =>
    generateWordProblemQuestion(difficulty, undefined, seen, theme?.id, selectedSkill);

  const startAdventure = (theme: WordProblemTheme | null) => {
    const freshSeen = new Set(
      AppStorage.getAttempts()
        .filter((attempt) => attempt.category === "problems" && attempt.signature)
        .slice(-200)
        .map((attempt) => attempt.signature as string)
    );
    const question = createQuestion(theme, freshSeen);
    freshSeen.add(question.signature);
    setActiveTheme(theme);
    setIsRandomAdventure(theme === null);
    setAnsweredCount(0);
    setCorrectCount(0);
    setSeenSignatures(freshSeen);
    setIsCompleted(false);
    setActiveQuestion(question);
  };

  const closeAdventure = () => {
    setActiveQuestion(null);
    setActiveTheme(null);
    setIsRandomAdventure(false);
    setIsCompleted(false);
  };

  const handleAnswer = async (
    answer: number | string,
    correct: boolean,
    responseTimeMs: number
  ) => {
    if (!activeQuestion) return;
    await AppStorage.recordPracticeAnswer(activeQuestion, answer, correct, responseTimeMs);
    if (correct) setCorrectCount((count) => count + 1);
  };

  const handleNext = () => {
    const nextAnsweredCount = answeredCount + 1;
    setAnsweredCount(nextAnsweredCount);
    if (nextAnsweredCount >= QUESTIONS_PER_ADVENTURE) {
      setActiveQuestion(null);
      setIsCompleted(true);
      return;
    }

    const question = createQuestion(activeTheme, seenSignatures);
    setSeenSignatures((previous) => new Set(previous).add(question.signature));
    setActiveQuestion(question);
  };

  const adventureTitle = activeTheme?.title || "Sürpriz Problem Macerası";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 lg:p-8 shadow-soft">
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
            <Puzzle className="h-7 w-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700">
                Serbest keşif alanı
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 shadow-sm">
                Günlük görevlerden bağımsız
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
              Arel&apos;in Problem Macerası
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
              Sevdiğin dünyayı seç, hikâyenin içindeki matematiği keşfet. Burada süre baskısı yok;
              her macera 3. sınıf bilgilerini güçlendirip seni yeni konulara hazırlar.
            </p>
          </div>
        </div>
        <Sparkles className="absolute -right-4 -top-4 h-28 w-28 text-amber-200/40" />
      </div>

      {activeQuestion ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeTheme?.icon || "🎲"}</span>
              <div>
                <p className="text-sm font-extrabold text-slate-800">{adventureTitle}</p>
                <p className="text-xs font-semibold text-slate-400">
                  {answeredCount} soru tamamlandı · {selectedStandard.title} · Seviye {difficulty}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAdventure}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Temalara Dön
            </button>
          </div>

          <QuestionCard
            key={activeQuestion.id}
            question={activeQuestion}
            questionNumber={answeredCount + 1}
            totalQuestions={QUESTIONS_PER_ADVENTURE}
            onAnswerSubmit={handleAnswer}
            onNextQuestion={handleNext}
          />
        </div>
      ) : isCompleted ? (
        <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-800">Macera tamamlandı!</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {QUESTIONS_PER_ADVENTURE} hikâyeli problemin {correctCount} tanesini doğru çözdün.
          </p>
          <div className="mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => startAdventure(isRandomAdventure ? null : activeTheme)}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 font-extrabold text-white shadow-lg shadow-amber-200 hover:bg-amber-600"
            >
              <RotateCcw className="h-5 w-5" />
              Yeni Macera
            </button>
            <button
              type="button"
              onClick={closeAdventure}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 font-extrabold text-slate-700 hover:bg-slate-200"
            >
              <Compass className="h-5 w-5" />
              Başka Tema Seç
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-800">Bugün hangi dünyaya gidelim?</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              10 tema, 52 farklı problem kalıbı ve her seferinde değişen sayılar.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="text-sm font-extrabold text-slate-800">Nasıl problemler çözelim?</h3>
              <p className="text-xs font-medium text-slate-500">
                Bir çalışma türü seç; sorular Arel&apos;in o becerideki seviyesine göre üretilecek.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROBLEM_STANDARDS.map((standard) => {
                const isSelected = standard.skill === selectedSkill;
                return (
                  <button
                    type="button"
                    key={standard.id}
                    onClick={() => setSelectedSkill(standard.skill)}
                    className={`rounded-2xl border px-3.5 py-2 text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "border-blue-100 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{standard.title}</span>
                    <span className={`block text-[10px] font-medium ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                      {standard.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WORD_PROBLEM_THEMES.map((theme) => {
              const isSupported =
                !selectedSkill || getThemeProblemSkills(theme.id).includes(selectedSkill);
              return (
                <button
                  type="button"
                  key={theme.id}
                  disabled={!isSupported}
                  onClick={() => startAdventure(theme)}
                  className={`group min-h-[170px] rounded-3xl border p-5 text-left transition-all ${
                    isSupported
                      ? "border-slate-100 bg-white shadow-soft hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
                      : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-45"
                  }`}
                >
                  <div className="text-4xl transition-transform group-hover:scale-110">{theme.icon}</div>
                  <h3 className="mt-3 text-sm font-extrabold text-slate-800">{theme.title}</h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                    {isSupported ? theme.description : `${selectedStandard.title} sorusu bu temada hazırlanıyor`}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => startAdventure(null)}
            className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-base font-extrabold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-orange-600"
          >
            <Play className="h-5 w-5 fill-white" />
            Bana Sürpriz Bir Problem Macerası Başlat
          </button>
        </div>
      )}
    </div>
  );
}
