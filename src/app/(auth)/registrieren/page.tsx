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
import { GoogleIcon } from "@/components/shared/GoogleIcon";
import { getAuthErrorMessage, registerWithEmail } from "@/lib/firebase/auth";
import { createUserProfile } from "@/lib/firebase/users";

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const credential = await registerWithEmail(email, password);
      const { firstName, lastName } = splitName(name);
      await createUserProfile(credential.user.uid, { firstName, lastName, email });
      router.push("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setIsLoading(false);
    }
  }

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

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Dein Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

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
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Passwort
            </label>
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
      </CardContent>
    </Card>
  );
}
