"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthDivider } from "@/components/shared/AuthDivider";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { GoogleIcon } from "@/components/shared/GoogleIcon";
import { getAuthErrorMessage, loginWithEmail } from "@/lib/firebase/auth";
import { updateLastLogin } from "@/lib/firebase/users";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const credential = await loginWithEmail(email, password);
      await updateLastLogin(credential.user.uid);
      router.push("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Anmelden</CardTitle>
        <CardDescription>Melde dich bei deinem PrüfCheckPro-Konto an.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => showFeedback("Diese Funktion wird später angebunden.")}
        >
          <GoogleIcon />
          Mit Google anmelden
        </Button>

        <AuthDivider label="oder mit E-Mail" />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-Mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="du@beispiel.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Passwort
              </label>
              <Link
                href="/passwort-vergessen"
                className="text-xs font-medium text-primary hover:underline"
              >
                Passwort vergessen?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Anmelden
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Noch keinen Account?{" "}
          <Link href="/registrieren" className="font-medium text-primary hover:underline">
            Jetzt registrieren
          </Link>
        </p>

        <div className="flex gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Der Zugriff auf Professional- und Enterprise-Funktionen setzt ein aktives Abo
            voraus. Neue Konten starten automatisch im kostenlosen Azubi-Plan.
          </p>
        </div>
      </CardContent>

      <FeedbackToast message={feedback} />
    </Card>
  );
}
