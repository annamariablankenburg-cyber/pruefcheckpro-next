"use client";

import Link from "next/link";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.11C3.25 21.3 7.28 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.28A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.2 15.24 0 12 0 7.28 0 3.25 2.7 1.28 6.61l3.99 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Anmelden</CardTitle>
        <CardDescription>Melde dich bei deinem PrüfCheckPro-Konto an.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <Button type="button" variant="outline" className="w-full">
          <GoogleIcon />
          Mit Google anmelden
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">oder mit E-Mail</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-Mail
            </label>
            <Input id="email" name="email" type="email" placeholder="du@beispiel.de" required />
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
              required
            />
          </div>

          <Button type="submit" className="w-full">
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

        <p className="text-center text-xs text-muted-foreground">
          Die Anmeldung wird in einem späteren Schritt mit Firebase Authentication verbunden.
        </p>
      </CardContent>
    </Card>
  );
}
