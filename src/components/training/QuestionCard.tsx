"use client";

import { useRef, useState } from "react";
import { Question } from "@/lib/questions/types";
import NumericKeypad from "./NumericKeypad";
import { Lightbulb, CheckCircle, XCircle, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { PRAISE_MESSAGES, WRONG_MESSAGES } from "@/lib/adaptive/scoring";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (
    userAnswer: number | string,
    isCorrect: boolean,
    responseTimeMs: number
  ) => Promise<void>;
  onNextQuestion: () => void;
}

function getLearningIdea(question: Question): string {
  if (question.skill.includes("addition")) {
    return "Parçaları tek tek bir araya getir. Önce kolay grupları toplayıp sonra kalan parçayı eklemek işi hızlandırır.";
  }
  if (question.skill.includes("subtraction")) {
    return "Bütünden kullanılan veya eksilen kısmı ayır. Geriye kalan miktar aradığımız cevaptır.";
  }
  if (question.skill.includes("multiplication") || question.skill.includes("table")) {
    return "Aynı büyüklükte tekrar eden grupları düşün. Grup sayısı ile her gruptaki miktarı çarpmak kısa yoldur.";
  }
  if (question.skill.includes("division")) {
    return "Toplamı eşit gruplara paylaştır. Bölme, her gruba kaç tane düştüğünü bulmamızı sağlar.";
  }
  if (question.skill.includes("multiStep")) {
    return "Bu problemde iki küçük görev var. Önce ilk değişimi hesapla, çıkan sonucu ikinci işlemde kullan.";
  }
  return "Soruda verilenleri küçük parçalara ayır. Bildiğimiz bilgilerden başlayıp aranan sonuca adım adım ilerleyebiliriz.";
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSubmit,
  onNextQuestion,
}: QuestionCardProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");
  const [submittedAnswer, setSubmittedAnswer] = useState<number | string>("");
  const questionStartedAt = useRef<number>(Date.now());

  const handleKeypadPress = (val: string) => {
    if (isAnswered) return;
    if (inputValue.length >= 8) return;
    setInputValue((prev) => prev + val);
  };

  const handleKeypadDelete = () => {
    if (isAnswered) return;
    setInputValue((prev) => prev.slice(0, -1));
  };

  const checkAnswer = async (given: string | number) => {
    if (isAnswered || isSubmitting || String(given).trim() === "") return;
    const cleanGiven = String(given).trim().toLowerCase();
    const cleanActual = String(question.answer).trim().toLowerCase();
    const correct = cleanGiven === cleanActual;

    setIsSubmitting(true);
    setSaveError("");
    try {
      await onAnswerSubmit(given, correct, Date.now() - questionStartedAt.current);
      setSubmittedAnswer(given);
      setIsCorrect(correct);
      setIsAnswered(true);
      const msgPool = correct ? PRAISE_MESSAGES : WRONG_MESSAGES;
      setFeedbackMessage(msgPool[Math.floor(Math.random() * msgPool.length)]);
    } catch {
      setSaveError("Cevap Firebase'e kaydedilemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInput = () => {
    void checkAnswer(inputValue);
  };

  const handleNext = () => {
    setInputValue("");
    setShowHint(false);
    setIsAnswered(false);
    setIsCorrect(false);
    setSubmittedAnswer("");
    questionStartedAt.current = Date.now();
    onNextQuestion();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fadeIn">
      {/* Question Header & Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-blue-100/70 text-blue-700 font-bold text-xs">
            {question.categoryTitle}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Soru {questionNumber} / {totalQuestions}
          </span>
        </div>

        {question.hint && (
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors border border-amber-200/60"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? "İpucunu Gizle" : "İpucu"}</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Hint Alert */}
      {showHint && question.hint && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-900 text-sm flex items-start gap-3 animate-fadeIn">
          <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">İpucu</p>
            <p className="mt-0.5 text-xs sm:text-sm">{question.hint}</p>
          </div>
        </div>
      )}

      {/* Question Card Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft text-center space-y-6">
        {/* Question Prompt */}
        <div className="py-2">
          <p className="text-slate-800 font-extrabold text-xl sm:text-2xl lg:text-3xl leading-relaxed whitespace-pre-line">
            {question.prompt}
          </p>
        </div>

        {/* Input Area */}
        {!isAnswered ? (
          <div>
            {question.questionType === "comparison" || question.questionType === "multipleChoice" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                {(question.choices || ["A", "B", "Eşit"]).map((choice, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void checkAnswer(choice)}
                    disabled={isSubmitting}
                    className="min-h-[56px] p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 font-extrabold text-slate-800 hover:text-blue-600 text-lg transition-all active:scale-95 shadow-xs"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full max-w-xs mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitInput();
                    }}
                    placeholder="?"
                    className="w-full h-16 text-center text-3xl font-black text-slate-800 bg-slate-50 border-2 border-blue-400 focus:border-blue-600 rounded-2xl outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Tablet-optimized keypad */}
                <NumericKeypad
                  onKeyPress={handleKeypadPress}
                  onDelete={handleKeypadDelete}
                  onSubmit={handleSubmitInput}
                  disabled={isAnswered || isSubmitting}
                />
                {saveError && <p className="text-sm font-bold text-rose-600">{saveError}</p>}
              </div>
            )}
          </div>
        ) : (
          /* Post-Answer Result & Step-by-Step Explanation */
          <div className="space-y-5 animate-fadeIn">
            <div
              className={`p-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-lg ${
                isCorrect
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600" />
              )}
              <span>{feedbackMessage}</span>
            </div>

            {isCorrect ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-left sm:p-5">
                <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  <Sparkles className="h-4 w-4" /> Neden doğru?
                </p>
                <div className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
                  {question.explanation.map((step, idx) => <p key={idx}>{step}</p>)}
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 text-left sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-blue-900">Bunu şöyle düşünebilirsin</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                      {getLearningIdea(question)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white bg-white/80 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Senin cevabın</p>
                    <p className="mt-1 text-xl font-black text-slate-700">{String(submittedAnswer)}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Doğru sonuç</p>
                    <p className="mt-1 text-xl font-black text-emerald-700">{String(question.answer)}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-blue-700">
                    Birlikte adım adım çözelim
                  </p>
                  <ol className="space-y-3">
                    {question.explanation.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-slate-700">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {question.hint && (
                  <p className="flex items-start gap-2 text-xs font-bold leading-relaxed text-amber-800">
                    <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    Akılda tut: {question.hint}
                  </p>
                )}
              </div>
            )}

            {/* Continue Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full min-h-[56px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Devam Et</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
