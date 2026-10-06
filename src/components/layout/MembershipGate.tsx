"use client";

import { useState, type ReactNode } from "react";
import { Loader2, LockKeyhole, ShieldAlert, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logout } from "@/lib/firebase/auth";
import { membershipMessages } from "@/lib/security/membershipRules";
import { useAuth, type MembershipState } from "@/providers/AuthProvider";

// Sperrt die geschützte App, solange der angemeldete User keine gültige,
// aktive Unternehmenszuordnung (userMemberships/{uid}) hat. Es wird nie eine
// Demo-Firma oder users/{uid}.companyId als Ersatz geladen.
//
// Das ist die UI-Seite der Sperre. Die Durchsetzung auf Datenebene liegt in den
// Firestore Security Rules; hier wird nur verhindert, dass die App ohne
// Zugang Daten anfragt und verwirrende Fehler zeigt. Es wird NICHT behauptet,
// das Firebase-Konto sei deaktiviert.
export function MembershipGate({ children }: { children: ReactNode }) {
  const { membership, refreshMembership } = useAuth();
  return (
    <MembershipGateView membership={membership} onRetry={refreshMembership}>
      {children}
    </MembershipGateView>
  );
}

// Reine Darstellung je Zustand (ohne Auth-Anbindung).
export function MembershipGateView({
  membership,
  onRetry,
  children,
}: {
  membership: MembershipState;
  onRetry: () => Promise<void>;
  children: ReactNode;
}) {
  const [signingOut, setSigningOut] = useState(false);

  // Mock-Modus: keine Firmenprüfung. Gültige Membership: App freigeben.
  if (membership.status === "disabled" || membership.status === "valid") {
    return <>{children}</>;
  }

  if (membership.status === "idle" || membership.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const copy = {
    missing: {
      icon: LockKeyhole,
      title: membershipMessages.missing,
      text: "Dein Konto ist angemeldet, aber noch keiner Firma zugeordnet. Bitte wende dich an die Administration deines Unternehmens.",
    },
    blocked: {
      icon: ShieldAlert,
      title: membershipMessages.blocked,
      text: "Der Zugriff auf die Daten deines Unternehmens ist für dich deaktiviert. Bitte wende dich an die Administration deines Unternehmens.",
    },
    invalid: {
      icon: TriangleAlert,
      title: membershipMessages.invalid,
      text: "Die Zuordnung zu deinem Unternehmen ist unvollständig. Bitte wende dich an die Administration.",
    },
    error: {
      icon: TriangleAlert,
      title: membershipMessages.error,
      text: "Bitte prüfe deine Verbindung und versuche es erneut.",
    },
  }[membership.status];
  const Icon = copy.icon;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-(--elev-2) ring-1 ring-foreground/10">
            <Icon className="size-6" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.text}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {membership.status === "error" && (
              <Button type="button" onClick={() => void onRetry()}>
                Erneut versuchen
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleSignOut} disabled={signingOut}>
              {signingOut && <Loader2 className="size-4 animate-spin" />}
              Abmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
