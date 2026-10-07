"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDomainActions, type DomainActions, type DomainKey } from "@/lib/permissions/domainAccess";
import { usePermissions } from "@/providers/PermissionsProvider";

// Neutraler Zustand für Nutzer ohne *.ansehen (kein technischer Firebase-Fehler, keine leere Tabelle).
export function AccessDeniedCard({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <ShieldOff className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">Du hast keine Berechtigung, diesen Bereich anzusehen.</p>
      </CardContent>
    </Card>
  );
}

// Sperrt eine Fachseite ohne View-Recht (auch bei direktem URL-Aufruf). Die Inhalte (und damit
// ihre Hooks/Firestore-Queries) werden erst gerendert, wenn die Rechte geladen sind UND *.ansehen
// gilt. Vier getrennte Zustände: Rechte laden, Rechte-Fehler, kein Recht, Zugriff.
// UI-Gating ist Komfort; die Firestore Rules bleiben die Sicherheitsgrenze.
export function DomainAccessGate({
  domain,
  label,
  children,
}: {
  domain: DomainKey;
  // Bereichsname für Überschrift und Hinweis, z. B. "Kunden".
  label: string;
  children: (actions: DomainActions, permissions: Record<string, boolean>) => ReactNode;
}) {
  const { permissions, loading, error, retry } = usePermissions();

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Card className="skeleton skeleton-rows h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actions = getDomainActions(domain, permissions);
  if (!actions.view) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <AccessDeniedCard label={label} />
      </div>
    );
  }

  return <>{children(actions, permissions)}</>;
}
