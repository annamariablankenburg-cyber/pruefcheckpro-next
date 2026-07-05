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
import { AuthDivider } from "@/components/shared/AuthDivider";
import { GoogleIcon } from "@/components/shared/GoogleIcon";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Konto erstellen</CardTitle>
        <CardDescription>Registriere dich kostenlos bei PrüfCheckPro.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <Button type="button" variant="outline" className="w-full">
          <GoogleIcon />
          Mit Google registrieren
        </Button>

        <AuthDivider label="oder mit E-Mail" />

        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input id="name" name="name" placeholder="Dein Name" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-Mail
            </label>
            <Input id="email" name="email" type="email" placeholder="du@beispiel.de" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Passwort
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Konto erstellen
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Anmelden
          </Link>
        </p>

        <div className="flex gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Du startest automatisch mit dem kostenlosen Azubi-Plan. Ein Upgrade auf
            Professional oder Enterprise ist jederzeit möglich.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Die Registrierung wird in einem späteren Schritt mit Firebase Authentication
          verbunden.
        </p>
      </CardContent>
    </Card>
  );
}
