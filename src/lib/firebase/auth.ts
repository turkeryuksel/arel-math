import { auth } from "./client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { AppStorage } from "./storageProvider";

export async function verifyParentPin(enteredPin: string): Promise<boolean> {
  const profile = AppStorage.getProfile();
  const correctPin = profile.parentPin || "1907";
  return enteredPin.trim() === correctPin;
}

export async function registerWithEmail(email: string, pass: string) {
  if (!auth) {
    // If Firebase Auth is not configured or in offline mode, simulate successful account creation
    return {
      user: {
        email,
        uid: `demo_user_${Date.now()}`,
        displayName: "Arel'in Velisi",
      } as unknown as User,
    };
  }
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) {
    // Fallback demo parent login
    if (email && pass.length >= 6) {
      return {
        user: {
          email,
          uid: "demo_parent_user",
          displayName: "Ebeveyn",
        } as unknown as User,
      };
    }
    throw new Error("Geçersiz e-posta veya şifre.");
  }
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("arel_math_auth_session");
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    // Return unsubscribe no-op
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
