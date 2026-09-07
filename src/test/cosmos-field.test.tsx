// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CosmosField from "@/components/games/cosmos/CosmosField";

let frames: Map<number, FrameRequestCallback>;
let sequence: number;
let reduce: boolean;
function step(time: number) {
  const pending = [...frames.values()];
  frames.clear();
  act(() => pending.forEach((callback) => callback(time)));
}
function mount() {
  const choose = vi.fn();
  const props = { choices: [12, 14, 16, 18], mode: "flight" as const, paused: false,
    disabled: false, selected: null, correctAnswer: 12, revealed: false,
    finalStage: false, charge: 0, onChoose: choose };
  const view = render(<CosmosField {...props} />);
  return { ...view, props, choose, field: screen.getByLabelText("Sayı yıldızları oyun alanı") };
}
function touch(element: Element, type: string, x: number, y: number, id = 1) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { clientX: x, clientY: y, pointerId: id, pointerType: "touch", isPrimary: true, button: 0 });
  fireEvent(element, event);
}
beforeEach(() => {
  reduce = false;
  sequence = 0;
  frames = new Map();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++sequence, callback); return sequence; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", undefined);
  vi.stubGlobal("matchMedia", () => ({ matches: reduce, addListener: vi.fn(), removeListener: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => { throw new Error("Canvas unavailable"); });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(360);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 360, height: 300 } as DOMRect);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Cosmos real field touch and animation", () => {
  it.each([360, 768])("moves stars at width %i even without canvas or ResizeObserver", (width) => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
    mount();
    const star = screen.getByRole("button", { name: "12 sonucunu yakala" });
    step(100);
    const initial = star.style.transform;
    step(150);
    expect(star.style.transform).not.toBe(initial);
  });

  it("offers explicit motion override for reduced motion and retains it for the next question", () => {
    reduce = true;
    const view = mount();
    const star = screen.getByRole("button", { name: "12 sonucunu yakala" });
    step(100); const initial = star.style.transform;
    step(150); expect(star.style.transform).toBe(initial);
    fireEvent.click(screen.getByRole("button", { name: "Hareketi aç" }));
    step(200); step(250);
    expect(star.style.transform).not.toBe(initial);
    view.rerender(<CosmosField {...view.props} choices={[20, 22, 24, 26]} />);
    expect(screen.getByRole("button", { name: "Hareketi durdur" })).toBeTruthy();
  });

  it("accepts a fast touch swipe only once without pointer capture support", () => {
    const { field, choose } = mount();
    step(100);
    // First star is at x=54,y=231 at t=0.
    touch(field, "pointerdown", 0, 231);
    touch(field, "pointermove", 100, 231);
    touch(field, "pointermove", 0, 231);
    expect(choose).toHaveBeenCalledExactlyOnceWith(12);
  });

  it("clears cancelled gestures and blocks paused touches", () => {
    const view = mount(); step(100);
    touch(view.field, "pointerdown", 0, 231);
    touch(view.field, "pointercancel", 0, 231);
    touch(view.field, "pointermove", 100, 231);
    expect(view.choose).not.toHaveBeenCalled();
    view.rerender(<CosmosField {...view.props} paused />);
    touch(view.field, "pointerdown", 54, 231);
    expect(view.choose).not.toHaveBeenCalled();
  });

  it("accepts another choice after moving to a new question", () => {
    const view = mount(); step(100);
    fireEvent.click(screen.getByRole("button", { name: "12 sonucunu yakala" }));
    view.rerender(<CosmosField {...view.props} choices={[20, 22, 24, 26]} />);
    fireEvent.click(screen.getByRole("button", { name: "20 sonucunu yakala" }));
    expect(view.choose.mock.calls).toEqual([[12], [20]]);
  });
});
