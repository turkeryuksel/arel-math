// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";

const state = vi.hoisted(() => ({
  listener: null as null | ((user: User | null) => Promise<void>),
  hydrate: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  subscribeToAuthChanges: (listener: typeof state.listener) => { state.listener = listener; return () => {}; },
  logoutUser: vi.fn(),
}));
vi.mock("@/lib/firebase/storageProvider", () => ({
  FRESH_AREL_PROFILE: {},
  AppStorage: { getProfile: () => ({ id: "student", displayName: "Deniz" }), hydrateFromFirestore: state.hydrate },
}));
import { AuthProvider, useAuth } from "@/lib/firebase/authContext";
function Probe() {
  const { user, isLoading } = useAuth();
  return <p>{isLoading ? "loading" : user ? "ready" : "signed-out"}</p>;
}
afterEach(cleanup);
it("keeps authenticated screens waiting until the new account's data is hydrated", async () => {
  let finish!: () => void;
  state.hydrate.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  render(<AuthProvider><Probe /></AuthProvider>);
  await act(async () => { await state.listener!(null); });
  expect(screen.getByText("signed-out")).toBeTruthy();
  let pending!: Promise<void>;
  act(() => { pending = state.listener!({ uid: "student", email: "student@example.test" } as User); });
  expect(screen.getByText("loading")).toBeTruthy();
  expect(screen.queryByText("ready")).toBeNull();
  await act(async () => { finish(); await pending; });
  expect(screen.getByText("ready")).toBeTruthy();
});
