"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { MembershipGate } from "@/components/layout/MembershipGate";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { PermissionsProvider } from "@/providers/PermissionsProvider";

function ProtectedContent({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [loading, currentUser, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Im Firestore-Modus ohne gültige Unternehmenszuordnung bleibt die App gesperrt.
  return (
    <MembershipGate>
      {/* Effektive Berechtigungen einmal pro Sitzung (Membership.roleId -> Rolle). */}
      <PermissionsProvider>
        <AppShell>{children}</AppShell>
      </PermissionsProvider>
    </MembershipGate>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </AuthProvider>
  );
}
