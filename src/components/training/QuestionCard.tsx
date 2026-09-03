"use client";

import { useState } from "react";
import { Question } from "@/lib/questions/types";
import NumericKeypad from "./NumericKeypad";
import { Lightbulb, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { PRAISE_MESSAGES, WRONG_MESSAGES } from "@/lib/adaptive/scoring";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (userAnswer: number | string, isCorrect: boolean) => void;
  onNextQuestion: () => void;
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

  const handleKeypadPress = (val: string) => {
    if (isAnswered) return;
    if (inputValue.length >= 8) return;
    setInputValue((prev) => prev + val);
  };

  const handleKeypadDelete = () => {
    if (isAnswered) return;
    setInputValue((prev) => prev.slice(0, -1));
  };

  const checkAnswer = (given: string | number) => {
    if (isAnswered || String(given).trim() === "") return;
    const cleanGiven = String(given).trim().toLowerCase();
    const cleanActual = String(question.answer).trim().toLowerCase();
    const correct = cleanGiven === cleanActual;

    setIsCorrect(correct);
    setIsAnswered(true);

    const msgPool = correct ? PRAISE_MESSAGES : WRONG_MESSAGES;
    const randomMsg = msgPool[Math.floor(Math.random() * msgPool.length)];
    setFeedbackMessage(randomMsg);

    onAnswerSubmit(given, correct);
  };

  const handleSubmitInput = () => {
    checkAnswer(inputValue);
  };

  const handleNext = () => {
    setInputValue("");
    setShowHint(false);
    setIsAnswered(false);
    setIsCorrect(false);
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
                    onClick={() => checkAnswer(choice)}
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
                  disabled={isAnswered}
                />
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

            {/* Step-by-step Solution Explanation */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Çözüm Adımları
              </p>
              <div className="space-y-1 text-sm font-semibold text-slate-700">
                {question.explanation.map((step, idx) => (
                  <p key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{step}</span>
                  </p>
                ))}
              </div>
            </div>

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
