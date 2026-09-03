"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges, logoutUser } from "./auth";
import { AppStorage } from "./storageProvider";
import { UserProfile } from "@/lib/questions/types";
import { getRoleByEmail } from "./config";

type AppRole = "arel" | "admin" | "guest";

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  role: AppRole;
  isAdmin: boolean;
  isArel: boolean;
  isLoading: boolean;
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
  refreshProfile: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [role, setRole] = useState<AppRole>("guest");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const r = getRoleByEmail(firebaseUser.email);
        setRole(r);

        // If student account, match student profile by email
        if (r !== "admin" && firebaseUser.email) {
          const studentProfile = AppStorage.getStudentByEmail(firebaseUser.email);
          const profileId = studentProfile?.id || AppStorage.getProfile().id;
          if (studentProfile) {
            AppStorage.setActiveStudent(studentProfile.id);
            setProfile(studentProfile);
          }
          void AppStorage.hydrateFromFirestore(profileId).then(() => {
            setProfile(AppStorage.getProfile());
          });
        }
      } else {
        setRole("guest");
      }

      setIsLoading(false);
    });

    const timer = setTimeout(() => setIsLoading(false), 1200);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
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
