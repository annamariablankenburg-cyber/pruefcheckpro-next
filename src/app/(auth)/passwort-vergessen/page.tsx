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

export default function PasswortVergessenPage() {
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
        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-Mail
            </label>
            <Input id="email" name="email" type="email" placeholder="du@beispiel.de" required />
          </div>

          <Button type="submit" className="w-full">
            Reset-Link anfordern
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Erinnerst du dich wieder?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Zurück zum Login
          </Link>
        </p>

        <div className="flex gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Der Versand des Reset-Links wird in einem späteren Schritt mit Firebase
            Authentication verbunden.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
