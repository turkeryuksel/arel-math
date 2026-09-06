// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/lib/questions/types";

const mocks = vi.hoisted(() => ({ recordPracticeAnswer: vi.fn(), recordGameResult: vi.fn() }));
vi.mock("@/lib/firebase/storageProvider", () => ({ AppStorage: { ...mocks, getProfile: () => ({ id: "test-student" }) } }));
vi.mock("@/lib/firebase/authContext", () => ({ useAuth: () => ({ profile: { displayName: "Deniz" } }) }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/lib/questions/mentalMath", () => ({ generateMentalMathQuestion: () => ({ id: "speed-q", answer: 7, prompt: "3 + 4 = ?" }) }));

import QuestionCard from "@/components/training/QuestionCard";
import SpeedRunPage from "@/app/speed-run/page";
import GamesPage from "@/app/games/page";
import GameComplete from "@/components/games/GameComplete";

const question: Question = {
  id: "q1", signature: "3+4", category: "mental-math", categoryTitle: "Toplama",
  skill: "mental.addition", difficulty: 2, questionType: "numeric", prompt: "3 + 4 = ?",
  answer: 7, explanation: ["3'e 4 ekle: 7."], hint: "Parmaklarını kullanabilirsin.",
};
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
function showQuestion(q = question, onAnswerSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<QuestionCard question={q} questionNumber={1} totalQuestions={3} onAnswerSubmit={onAnswerSubmit} onNextQuestion={vi.fn()} />);
  return onAnswerSubmit;
}

beforeEach(() => { vi.clearAllMocks(); mocks.recordPracticeAnswer.mockResolvedValue(undefined); mocks.recordGameResult.mockResolvedValue(undefined); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Training answer interactions", () => {
  it("keeps empty and incomplete answers out of history", () => {
    const submit = showQuestion();
    fireEvent.click(screen.getByRole("button", { name: "Cevapla" }));
    fireEvent.change(screen.getByLabelText("Cevabın"), { target: { value: "-" } });
    fireEvent.click(screen.getByRole("button", { name: "Cevapla" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("bir sayı");
  });
  it("accepts leading zeros and locks input until persistence completes", async () => {
    const save = deferred();
    const submit = showQuestion(question, vi.fn().mockReturnValue(save.promise));
    fireEvent.change(screen.getByLabelText("Cevabın"), { target: { value: "007" } });
    const button = screen.getByRole("button", { name: "Cevapla" });
    fireEvent.click(button); fireEvent.click(button);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith("007", true, expect.any(Number));
    expect((screen.getByLabelText("Cevabın") as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Devam Et" })).toBeNull();
    await act(async () => save.resolve());
    expect(screen.getByRole("button", { name: "Devam Et" })).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
  });
  it("shows a choice-question save failure and allows retry on the same question", async () => {
    const submit = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    showQuestion({ ...question, questionType: "multipleChoice", choices: [6, 7, 8] }, submit);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "7" })));
    expect(screen.getByRole("alert").textContent).toContain("kaydedemedik");
    expect(screen.queryByRole("button", { name: "Devam Et" })).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "7" })));
    expect(submit).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Devam Et" })).toBeTruthy();
  });
});

describe("Speed-run end and save boundaries", () => {
  it("rejects empty answers and answers after the actual deadline even if the timer has not painted", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
    render(<SpeedRunPage />);
    fireEvent.click(screen.getByRole("button", { name: /Hız Turunu Başlat/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cevapla" }));
    fireEvent.change(screen.getByLabelText("Cevabın"), { target: { value: "7" } });
    vi.setSystemTime(new Date("2026-09-06T12:01:01Z"));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Cevapla" })));
    expect(mocks.recordPracticeAnswer).not.toHaveBeenCalled();
  });
  it("does not offer a new run while the final answer is saving", async () => {
    vi.useFakeTimers();
    const save = deferred(); mocks.recordPracticeAnswer.mockReturnValue(save.promise);
    render(<SpeedRunPage />);
    fireEvent.click(screen.getByRole("button", { name: /Hız Turunu Başlat/ }));
    fireEvent.change(screen.getByLabelText("Cevabın"), { target: { value: "7" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Cevapla" })));
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(screen.getByText("Son cevapların kaydediliyor...")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Başlat|Tekrar Dene/ })).toBeNull();
    await act(async () => save.resolve());
    expect(screen.getByRole("button", { name: "Tekrar Dene" })).toBeTruthy();
  });
});

describe("Game completion persistence", () => {
  it("waits for a confirmed save before promising XP or allowing a new round", async () => {
    const save = deferred(); mocks.recordGameResult.mockReturnValue(save.promise);
    render(<StrictMode><GameComplete gameId="memory" title="Hafıza" moves={12} onAgain={vi.fn()} onExit={vi.fn()} /></StrictMode>);
    expect(mocks.recordGameResult).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/\+15 XP/)).toBeNull();
    expect((screen.getByRole("button", { name: "Bir Tur Daha" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => save.resolve());
    expect(screen.getByText(/\+15 XP/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Bir Tur Daha" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("retries a failed save with the same result identity", async () => {
    mocks.recordGameResult.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    await act(async () => { render(<GameComplete gameId="memory" title="Hafıza" moves={12} onAgain={vi.fn()} onExit={vi.fn()} />); });
    expect(screen.getByRole("alert")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Kaydı Tekrar Dene" })));
    expect(mocks.recordGameResult.mock.calls[0]).toEqual(mocks.recordGameResult.mock.calls[1]);
    expect(screen.getByText(/\+15 XP/)).toBeTruthy();
  });
});


describe("All game entry points", () => {
  it.each(["Arel’in Hafıza Kartları", "Simetri Tasarımcısı", "Denizaltı Labirenti", "Arel’in Turbo Rotası", "Potanın Ritmi", "Yüzme Ritmi"])("opens and exits %s without writing a completion", (name) => {
    render(<GamesPage />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }));
    expect(screen.getByRole("heading", { name })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Çık" }));
    expect(screen.getByRole("heading", { name: "Arel’in Oyun Molası" })).toBeTruthy();
    expect(mocks.recordGameResult).not.toHaveBeenCalled();
  });
});
