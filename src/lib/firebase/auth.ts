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
    throw new Error("Firebase yapılandırması bulunamadı. Öğrenci hesabı oluşturulamadı.");
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
    throw new Error("Firebase yapılandırması bulunamadı. Kayıt yapılamadı.");
  }
  return createUserWithEmailAndPassword(auth, email.trim(), pass);
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase yapılandırması bulunamadı. Giriş yapılamadı.");
  }
  return signInWithEmailAndPassword(auth, email.trim(), pass);
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    queueMicrotask(() => callback(null));
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
