export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "your_api_key_here"
);

/** Admin email — has full read/write access */
export const ADMIN_EMAIL = "turker@taximact.com";

/** Arel's email — has access to own profile */
export const AREL_EMAIL = "areldenizyuksel@icloud.com";

/** Determine role by email */
export function getRoleByEmail(email: string | null | undefined): "admin" | "arel" | "guest" {
  if (!email) return "guest";
  if (email === ADMIN_EMAIL) return "admin";
  if (email === AREL_EMAIL) return "arel";
  return "guest";
}
