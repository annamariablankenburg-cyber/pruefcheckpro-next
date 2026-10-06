"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User as FirebaseAuthUser } from "firebase/auth";

import { isFirestoreDataSource } from "@/config/dataSource";
import { onAuthChange } from "@/lib/firebase/auth";
import {
  getCurrentMembership,
  invalidateMembershipCache,
} from "@/lib/firebase/services/firestoreUserMembershipService";
import { getUserProfile } from "@/lib/firebase/users";
import { evaluateMembership } from "@/lib/security/membershipRules";
import type { AppUser } from "@/types/user";
import type { UserMembership } from "@/types/userMembership";

// Zustand der Unternehmenszuordnung (userMemberships/{uid}) des eingeloggten
// Users. Getrennt vom Login-Profil (users/{uid}, `appUser`).
export type MembershipState =
  // Mock-Modus (oder Provider ohne Membership): keine Firestore-Zugriffe, keine
  // Firmenprüfung, die App läuft wie bisher auf Mock-Daten.
  | { status: "disabled" }
  // Nicht angemeldet.
  | { status: "idle" }
  | { status: "loading" }
  // Angemeldet + aktive Membership mit companyId: Datenzugriff erlaubt.
  | { status: "valid"; membership: UserMembership }
  // Angemeldet, aber kein Membership-Dokument: kein Unternehmenszugang.
  | { status: "missing" }
  // Angemeldet, Membership vorhanden, aber "Gesperrt".
  | { status: "blocked"; membership: UserMembership }
  // Dokument vorhanden, aber unbrauchbar (z. B. ohne companyId).
  | { status: "invalid"; reason: string }
  // Membership konnte nicht geladen werden (Netzwerk, Rules, …).
  | { status: "error" };

interface AuthContextValue {
  currentUser: FirebaseAuthUser | null;
  appUser: AppUser | null;
  // Auth + Login-Profil geladen (unverändert gegenüber vorher).
  loading: boolean;
  // Unternehmenszuordnung, eine zentrale Quelle für die ganze App.
  membership: MembershipState;
  refreshMembership: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  appUser: null,
  loading: true,
  membership: { status: "idle" },
  refreshMembership: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
  // Login-/Registrierungsseiten brauchen keine Membership (sie wird erst in der
  // geschützten App benötigt). Standard: laden, falls Firestore-Modus aktiv ist.
  withMembership?: boolean;
}

export function AuthProvider({ children, withMembership = true }: AuthProviderProps) {
  const membershipEnabled = withMembership && isFirestoreDataSource;
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<MembershipState>(
    membershipEnabled ? { status: "idle" } : { status: "disabled" }
  );
  // Verhindert, dass ein veraltetes Ergebnis (z. B. nach Logout/Userwechsel)
  // den State überschreibt.
  const runId = useRef(0);

  const loadMembership = useCallback(async (currentRun: number) => {
    try {
      const current = await getCurrentMembership();
      if (runId.current !== currentRun) return;
      if (!current) {
        setMembership({ status: "idle" });
        return;
      }
      const evaluation = evaluateMembership(current.membership);
      switch (evaluation.state) {
        case "valid":
          setMembership({ status: "valid", membership: evaluation.membership });
          break;
        case "blocked":
          setMembership({ status: "blocked", membership: evaluation.membership });
          break;
        case "missing":
          setMembership({ status: "missing" });
          break;
        case "invalid":
          setMembership({ status: "invalid", reason: evaluation.reason });
          break;
      }
    } catch {
      if (runId.current === currentRun) setMembership({ status: "error" });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      runId.current += 1;
      const currentRun = runId.current;
      // Anderer User oder Logout: nie eine fremde Membership weiterverwenden.
      invalidateMembershipCache();
      setCurrentUser(user);

      if (!user) {
        setAppUser(null);
        setMembership(membershipEnabled ? { status: "idle" } : { status: "disabled" });
        setLoading(false);
        return;
      }

      if (membershipEnabled) {
        setMembership({ status: "loading" });
        void loadMembership(currentRun);
      }

      getUserProfile(user.uid)
        .then(setAppUser)
        .catch(() => setAppUser(null))
        .finally(() => setLoading(false));
    });

    return unsubscribe;
  }, [membershipEnabled, loadMembership]);

  const refreshMembership = useCallback(async () => {
    if (!membershipEnabled) return;
    runId.current += 1;
    const currentRun = runId.current;
    invalidateMembershipCache();
    setMembership({ status: "loading" });
    await loadMembership(currentRun);
  }, [membershipEnabled, loadMembership]);

  const value = useMemo(
    () => ({ currentUser, appUser, loading, membership, refreshMembership }),
    [currentUser, appUser, loading, membership, refreshMembership]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
