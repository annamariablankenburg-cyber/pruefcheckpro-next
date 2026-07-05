"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Anmelden</CardTitle>
        <CardDescription>Melde dich bei deinem PrüfCheckPro-Konto an.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
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
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full">
            Anmelden
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Die Anmeldung wird in einem späteren Schritt mit Firebase Authentication verbunden.
        </p>
      </CardContent>
    </Card>
  );
}
