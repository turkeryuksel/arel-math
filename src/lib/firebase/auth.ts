import { auth } from "./client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  getAuth,
} from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig, isFirebaseConfigured } from "./config";

/**
 * Creates a student account in Firebase Auth WITHOUT logging out the currently logged-in parent.
 * Uses a secondary Firebase App instance.
 */
export async function createStudentAuthAccount(email: string, pass: string): Promise<{ uid: string; email: string }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      uid: `student_${Date.now()}`,
      email,
    };
  }

  const secondaryAppName = "StudentAuthWorker";
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  const app = existingApp || initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(app);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pass);
    await signOut(secondaryAuth);
    return {
      uid: cred.user.uid,
      email: cred.user.email || email,
    };
  } catch (error) {
    console.error("Error creating student in secondary auth:", error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  if (!auth) {
    return {
      user: {
        email,
        uid: `demo_user_${Date.now()}`,
        displayName: "Arel'in Velisi",
      } as unknown as User,
    };
  }
  return createUserWithEmailAndPassword(auth, email.trim(), pass);
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) {
    if (email && pass.length >= 6) {
      return {
        user: {
          email,
          uid: "demo_user",
          displayName: email.includes("taximact") ? "Ebeveyn" : "Öğrenci",
        } as unknown as User,
      };
    }
    throw new Error("Geçersiz e-posta veya şifre.");
  }
  return signInWithEmailAndPassword(auth, email.trim(), pass);
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
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
