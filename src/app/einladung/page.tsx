"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, Info, Loader2, MailCheck } from "lucide-react";

import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isFirestoreDataSource } from "@/config/dataSource";
import { withNext } from "@/lib/auth/postLoginTarget";
import { logout, refreshEmailVerification, sendVerificationEmail } from "@/lib/firebase/auth";
import { invalidateMembershipCache } from "@/lib/firebase/services/firestoreUserMembershipService";
import { isSafeDocumentId } from "@/lib/security/memberActionRules";
import { acceptInvitation, InvitationActionClientError } from "@/lib/services/invitationActionsClient";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

// Einladung annehmen (/einladung?c=<companyId>&i=<invitationId>). Die Seite liegt bewusst außerhalb von
// (app) und (auth): angemeldete Nutzer OHNE Unternehmenszuordnung müssen sie erreichen (die App wäre durch das
// MembershipGate gesperrt, die Login-Seiten leiten Angemeldete weiter). Sie zeigt keine Einladungsdaten
// (nicht lesbar, siehe Rules) und sendet nur die beiden IDs; angenommen wird serverseitig mit der verifizierten
// E-Mail des Kontos (docs/firebase/invitation-acceptance.md).
export default function EinladungPage() {
  return (
    <AuthProvider withMembership={false}>
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
        <Link href="/">
          <Logo />
        </Link>
        <div className="w-full max-w-md">
          <Suspense fallback={<LoadingCard />}>
            <EinladungContent />
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </CardContent>
    </Card>
  );
}

function Notice({ tone, children }: { tone: "info" | "error"; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <div
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
          : "flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function EinladungContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, loading } = useAuth();
  const companyId = searchParams.get("c");
  const invitationId = searchParams.get("i");
  const linkValid = isSafeDocumentId(companyId) && isSafeDocumentId(invitationId);

  const [verified, setVerified] = useState<boolean | null>(null);
  const [pending, setPending] = useState<"accept" | "verify" | "refresh" | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongAccount, setWrongAccount] = useState(false);
  const [done, setDone] = useState<{ alreadyAccepted: boolean } | null>(null);

  if (!isFirestoreDataSource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Einladung annehmen</CardTitle>
        </CardHeader>
        <CardContent>
          <Notice tone="info">Einladungen können nur im Firestore-Modus angenommen werden.</Notice>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <LoadingCard />;

  if (!linkValid || !companyId || !invitationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Einladung annehmen</CardTitle>
        </CardHeader>
        <CardContent>
          <Notice tone="error">Der Einladungslink ist ungültig oder unvollständig.</Notice>
        </CardContent>
      </Card>
    );
  }

  const nextPath = `/einladung?c=${encodeURIComponent(companyId)}&i=${encodeURIComponent(invitationId)}`;

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Einladung annehmen</CardTitle>
          <CardDescription>
            Melde dich mit der E-Mail-Adresse an, an die die Einladung gerichtet ist, oder registriere dich damit.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href={withNext("/login", nextPath)}>Anmelden</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={withNext("/registrieren", nextPath)}>Registrieren</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isVerified = verified ?? currentUser.emailVerified;

  async function handleAccept() {
    if (pending || !companyId || !invitationId) return;
    setPending("accept");
    setError(null);
    setWrongAccount(false);
    try {
      const result = await acceptInvitation(companyId, invitationId);
      // Die Membership ist neu: einen gecachten "keine Membership"-Zustand verwerfen, damit die App sie
      // sofort lädt (das Dashboard bekommt einen frischen AuthProvider).
      invalidateMembershipCache();
      setDone(result);
      router.replace("/dashboard");
    } catch (caught) {
      if (caught instanceof InvitationActionClientError) {
        setError(caught.message);
        if (caught.code === "invitation-not-found") setWrongAccount(true);
        if (caught.code === "email-not-verified") setVerified(false);
      } else {
        setError("Die Einladung konnte nicht angenommen werden. Bitte versuche es erneut.");
      }
      setPending(null);
    }
  }

  async function handleSendVerification() {
    if (pending) return;
    setPending("verify");
    setError(null);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch {
      setError("Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.");
    } finally {
      setPending(null);
    }
  }

  async function handleRefreshVerification() {
    if (pending) return;
    setPending("refresh");
    setError(null);
    try {
      const nowVerified = await refreshEmailVerification();
      setVerified(nowVerified);
      if (!nowVerified) setError("Deine E-Mail-Adresse ist noch nicht bestätigt.");
    } catch {
      setError("Der Status konnte nicht aktualisiert werden. Bitte versuche es erneut.");
    } finally {
      setPending(null);
    }
  }

  async function handleSwitchAccount() {
    await logout();
  }

  if (done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="size-5 text-success" />
            {done.alreadyAccepted ? "Einladung bereits angenommen" : "Einladung angenommen"}
          </CardTitle>
          <CardDescription>Du wirst zum Dashboard weitergeleitet …</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Einladung annehmen</CardTitle>
        <CardDescription>
          Angemeldet als <span className="font-medium text-foreground">{currentUser.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isVerified ? (
          <>
            <Notice tone="info">
              Bitte bestätige zuerst deine E-Mail-Adresse. Erst danach kann die Einladung angenommen werden.
            </Notice>
            {verificationSent && <Notice tone="info">Bestätigungs-E-Mail gesendet. Prüfe dein Postfach.</Notice>}
            <Button variant="outline" onClick={handleSendVerification} disabled={pending !== null}>
              {pending === "verify" ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
              Bestätigungs-E-Mail senden
            </Button>
            <Button onClick={handleRefreshVerification} disabled={pending !== null}>
              {pending === "refresh" && <Loader2 className="size-4 animate-spin" />}
              Ich habe meine E-Mail bestätigt
            </Button>
          </>
        ) : (
          <Button onClick={handleAccept} disabled={pending !== null}>
            {pending === "accept" && <Loader2 className="size-4 animate-spin" />}
            Einladung annehmen
          </Button>
        )}

        {error && <Notice tone="error">{error}</Notice>}

        {(wrongAccount || error) && (
          <Button variant="ghost" size="sm" onClick={handleSwitchAccount}>
            Mit einem anderen Konto anmelden
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
