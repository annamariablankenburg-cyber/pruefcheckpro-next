"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { safeNextPath } from "@/lib/auth/postLoginTarget";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

function AuthGate({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      // Angemeldet: zur Einladungsseite (falls als next angegeben und erlaubt), sonst ins Dashboard.
      router.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    }
  }, [loading, currentUser, router]);

  if (loading || currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Link href="/">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Login/Registrierung brauchen keine Unternehmenszuordnung.
    <AuthProvider withMembership={false}>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
