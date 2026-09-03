import { auth } from "./client";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AppStorage } from "./storageProvider";

export async function verifyParentPin(enteredPin: string): Promise<boolean> {
  const profile = AppStorage.getProfile();
  const correctPin = profile.parentPin || "1907";
  return enteredPin.trim() === correctPin;
}

export async function parentLoginWithEmail(email: string, pass: string) {
  if (!auth) {
    // If Firebase Auth not connected, verify demo parent
    if (email && pass.length >= 6) {
      return { user: { email, uid: "parent_demo" } };
    }
    throw new Error("Geçersiz e-posta veya şifre.");
  }
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
}
