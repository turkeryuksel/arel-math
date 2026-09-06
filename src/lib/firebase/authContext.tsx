"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges, logoutUser } from "./auth";
import { AppStorage, FRESH_AREL_PROFILE } from "./storageProvider";
import { UserProfile } from "@/lib/questions/types";
import { AREL_EMAIL, getRoleByEmail } from "./config";

type AppRole = "arel" | "admin" | "guest";

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  role: AppRole;
  isAdmin: boolean;
  isArel: boolean;
  isLoading: boolean;
  dataError: string | null;
  refreshProfile: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: AppStorage.getProfile(),
  role: "guest",
  isAdmin: false,
  isArel: false,
  isLoading: true,
  dataError: null,
  refreshProfile: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [role, setRole] = useState<AppRole>("guest");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setIsLoading(true);
      setUser(firebaseUser);
      setDataError(null);

      if (firebaseUser) {
        const r = getRoleByEmail(firebaseUser.email);
        setRole(r);
        try {
          if (r === "admin") {
            const students = await AppStorage.loadStudentsFromFirestore();
            const preferred =
              students.find((student) => student.id === "arel_deniz") || students[0];
            const profileId = preferred?.id || "arel_deniz";
            try {
              await AppStorage.hydrateFromFirestore(profileId, true);
            } catch (error) {
              if (!(error instanceof Error) || !error.message.includes("profil bulunamadı")) {
                throw error;
              }
              await AppStorage.saveProfile(FRESH_AREL_PROFILE);
              await AppStorage.hydrateFromFirestore(profileId, true);
            }
          } else {
            const isArelAccount =
              firebaseUser.email?.trim().toLowerCase() === AREL_EMAIL.toLowerCase();
            const profileId = isArelAccount ? "arel_deniz" : firebaseUser.uid;
            try {
              await AppStorage.hydrateFromFirestore(profileId);
            } catch (error) {
              if (!(error instanceof Error) || !error.message.includes("profil bulunamadı")) {
                throw error;
              }
              const newProfile = AppStorage.createCustomProfile({
                id: profileId,
                email: firebaseUser.email || undefined,
                displayName: firebaseUser.displayName || "Öğrenci",
              });
              await AppStorage.saveProfile(newProfile);
              await AppStorage.hydrateFromFirestore(profileId);
            }
          }
          setProfile(AppStorage.getProfile());
        } catch (error) {
          console.error("Firebase verileri yüklenemedi:", error);
          setDataError(
            "Firebase verileri yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin."
          );
        }
      } else {
        setRole("guest");
      }

      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => setProfile(AppStorage.getProfile());
    window.addEventListener("arel-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("arel-profile-updated", handleProfileUpdate);
  }, []);

  const refreshProfile = () => {
    setProfile(AppStorage.getProfile());
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin: role === "admin",
        isArel: role === "arel",
        isLoading,
        dataError,
        refreshProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
