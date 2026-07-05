"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheckBig, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, isUserNotFoundError, sendPasswordReset } from "@/lib/firebase/auth";

export default function PasswortVergessenPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setIsSent(true);
    } catch (err) {
      // Aus Sicherheitsgründen nicht verraten, ob ein Konto existiert.
      if (isUserNotFoundError(err)) {
        setIsSent(true);
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Passwort vergessen</CardTitle>
        <CardDescription>
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines
          Passworts.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {isSent ? (
          <div className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground">
            <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-success" />
            <p>
              Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde soeben ein Link zum
              Zurücksetzen des Passworts gesendet.
            </p>
          </div>
        ) : (
          <>
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Reset-Link anfordern
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Erinnerst du dich wieder?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Zurück zum Login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
