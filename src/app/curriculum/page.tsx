"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck, Play, RefreshCw } from "lucide-react";
import QuestionCard from "@/components/training/QuestionCard";
import { CURRICULUM_STANDARDS, getStandardsForGrade } from "@/lib/curriculum/standards";
import { AppStorage } from "@/lib/firebase/storageProvider";
import { generateCurriculumQuestion } from "@/lib/questions/curriculum";
import { Question } from "@/lib/questions/types";

export default function CurriculumPracticePage() {
  const [grade, setGrade] = useState<3 | 4>(3);
  const standards = useMemo(() => getStandardsForGrade(grade), [grade]);
  const [standardCode, setStandardCode] = useState<string>("mixed");
  const [question, setQuestion] = useState<Question | null>(null);
  const [solved, setSolved] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const createQuestion = () => {
    const next = generateCurriculumQuestion(
      grade,
      standardCode === "mixed" ? undefined : standardCode,
      Math.max(2, Math.min(8, AppStorage.getProfile().grade === 4 ? 4 : 3)),
      undefined,
      seen
    );
    setSeen((previous) => new Set(previous).add(next.signature));
    setQuestion(next);
  };

  const changeGrade = (nextGrade: 3 | 4) => {
    setGrade(nextGrade);
    setStandardCode("mixed");
    setQuestion(null);
    setSeen(new Set());
  };

  const selectedStandard = CURRICULUM_STANDARDS.find((item) => item.code === standardCode);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
        <BookOpenCheck className="h-12 w-12" />
        <h1 className="mt-4 text-2xl font-black sm:text-3xl">Müfredat Keşfi</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-violet-100">
          Günlük görevlerden bağımsız çalış. 3. sınıf bilgilerini tazele veya 4. sınıf kazanımlarını keşfet; her cevap gelişim kaydına eklenir.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Sınıf</p>
            <div className="grid grid-cols-2 gap-2">
              {[3, 4].map((value) => (
                <button key={value} onClick={() => changeGrade(value as 3 | 4)} className={`min-h-12 rounded-2xl text-sm font-black ${grade === value ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {value}. Sınıf
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="standard" className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">Kazanım</label>
            <select id="standard" value={standardCode} onChange={(event) => { setStandardCode(event.target.value); setQuestion(null); }} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-violet-400">
              <option value="mixed">Karışık keşif · tüm {grade}. sınıf alanları</option>
              {standards.map((standard) => <option key={standard.code} value={standard.code}>{standard.code} · {standard.title}</option>)}
            </select>
            <p className="mt-2 text-xs font-medium text-slate-400">{selectedStandard?.themeTitle || `${standards.length} doğrulanmış kazanımdan dengeli seçim`}</p>
          </div>
        </div>
      </section>

      {question ? (
        <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-soft sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-xl bg-fuchsia-50 px-3 py-1.5 text-xs font-black text-fuchsia-700">
              {question.curriculum?.outcomeCode} · {question.curriculum?.outcomeTitle}
            </span>
            <button onClick={() => setQuestion(null)} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600"><RefreshCw className="h-4 w-4" /> Seçimi Değiştir</button>
          </div>
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={solved + 1}
            totalQuestions={solved + 4}
            onAnswerSubmit={(answer, correct, responseTimeMs) => AppStorage.recordPracticeAnswer(question, answer, correct, responseTimeMs)}
            onNextQuestion={() => { setSolved((value) => value + 1); createQuestion(); }}
          />
        </section>
      ) : (
        <button onClick={createQuestion} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 text-base font-black text-white shadow-lg shadow-violet-500/25">
          <Play className="h-5 w-5 fill-white" /> Keşfe Başla
        </button>
      )}
    </div>
  );
}
