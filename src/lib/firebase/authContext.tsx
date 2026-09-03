"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges, logoutUser } from "./auth";
import { AppStorage } from "./storageProvider";
import { UserProfile } from "@/lib/questions/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  role: "arel" | "parent" | "admin";
  isLoading: boolean;
  refreshProfile: () => void;
  signOut: () => Promise<void>;
  switchRole: (newRole: "arel" | "parent" | "admin") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: AppStorage.getProfile(),
  role: "arel",
  isLoading: true,
  refreshProfile: () => {},
  signOut: async () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(AppStorage.getProfile());
  const [role, setRole] = useState<"arel" | "parent" | "admin">("arel");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session role if any
    const savedRole = localStorage.getItem("arel_math_active_role") as "arel" | "parent" | "admin" | null;
    if (savedRole) {
      setRole(savedRole);
    }

    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setRole("parent");
      }
      setIsLoading(false);
    });

    setIsLoading(false);
    return () => unsubscribe();
  }, []);

  const refreshProfile = () => {
    setProfile(AppStorage.getProfile());
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setRole("arel");
    localStorage.removeItem("arel_math_active_role");
  };

  const switchRole = (newRole: "arel" | "parent" | "admin") => {
    setRole(newRole);
    localStorage.setItem("arel_math_active_role", newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        refreshProfile,
        signOut: handleSignOut,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
