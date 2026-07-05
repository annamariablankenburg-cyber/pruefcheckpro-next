"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User as FirebaseAuthUser } from "firebase/auth";

import { onAuthChange } from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/users";
import type { AppUser } from "@/types/user";

interface AuthContextValue {
  currentUser: FirebaseAuthUser | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  appUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);

      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      getUserProfile(user.uid)
        .then(setAppUser)
        .finally(() => setLoading(false));
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
