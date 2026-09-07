// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), game: vi.fn() }));
vi.mock("@/lib/firebase/storageProvider", () => ({ AppStorage: {
  getProfile: () => ({ id: "test" }), getRecentSignatures: () => new Set(), recordPracticeAnswer: mocks.save, recordGameResult: mocks.game,
} }));
vi.mock("@/lib/firebase/authContext", () => ({ useAuth: () => ({ profile: {displayName:"Test"} }) }));
vi.mock("canvas-confetti", () => ({default:vi.fn()}));
vi.mock("@/components/games/cosmos/CosmosField", () => ({ default: (props: {correctAnswer:number;onChoose:(n:number)=>void;disabled:boolean;paused:boolean}) => <div>
  <button disabled={props.disabled || props.paused} onClick={() => props.onChoose(props.correctAnswer)}>Doğru yıldız</button>
  <button disabled={props.disabled || props.paused} onClick={() => props.onChoose(-1)}>Yanlış yıldız</button>
</div> }));
import CosmosGame from "@/components/games/cosmos/CosmosGame";
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mocks.save.mockResolvedValue(undefined); mocks.game.mockResolvedValue(undefined); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const start = () => { render(<CosmosGame onExit={vi.fn()} />); fireEvent.click(screen.getByRole("button",{name:/Keşfe Başla/})); };
async function answer(right=true) {
  await act(async () => fireEvent.click(screen.getByRole("button",{name:right ? "Doğru yıldız" : "Yanlış yıldız"})));
}
function next() { fireEvent.click(screen.getByRole("button",{name:/^Devam$|Yeni bölgeye uç|Takımyıldızını gör/})); }
describe("Cosmos learning flow", () => {
  it("prevents starting with no selected tables", () => {
    render(<CosmosGame onExit={vi.fn()} />);
    for (const n of [2,3,4,5]) fireEvent.click(screen.getByRole("button",{name:`${n}’ler`}));
    expect((screen.getByRole("button",{name:/Keşfe Başla/}) as HTMLButtonElement).disabled).toBe(true);
  });
  it("retries exactly the same answer before allowing progression", async () => {
    mocks.save.mockRejectedValueOnce(new Error("offline")); start(); await answer();
    expect(screen.getByRole("alert").textContent).toContain("kaydedemedik");
    expect(screen.queryByRole("button",{name:"Devam"})).toBeNull();
    await act(async () => fireEvent.click(screen.getByRole("button",{name:"Kaydı tekrar dene"})));
    expect(mocks.save.mock.calls[1]).toEqual(mocks.save.mock.calls[0]);
    next(); expect(screen.getByText("2 / 15 keşif")).toBeTruthy();
  });
  it("pauses answer entry and stops automatic progression", async () => {
    start(); await answer(); fireEvent.click(screen.getByRole("button",{name:"Oyunu duraklat"}));
    await act(async () => vi.advanceTimersByTime(4000));
    expect(screen.getByText("1 / 15 keşif")).toBeTruthy();
    expect((screen.getByRole("button",{name:"Doğru yıldız"}) as HTMLButtonElement).disabled).toBe(true);
  });
  it("requires five correct final answers and saves the round only after finishing", async () => {
    start();
    for (let i=0;i<10;i++) { await answer(); next(); }
    await answer(false); next(); expect(screen.getByText("11 / 15 keşif")).toBeTruthy();
    expect(mocks.game).not.toHaveBeenCalled();
    for (let i=0;i<5;i++) { await answer(); await act(async () => next()); }
    expect(mocks.save).toHaveBeenCalledTimes(16);
    expect(mocks.game).toHaveBeenCalledWith("cosmos",16,expect.any(String));
    expect(screen.getByText("Gökyüzünde bir izin var.")).toBeTruthy();
  });
});
