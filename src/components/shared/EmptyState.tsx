import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  message: string;
  onReset?: () => void;
  // Optional: eigenes Icon, Titel und zusätzliche Aktion. Ohne Angaben bleibt
  // das Verhalten wie bisher (Meldung + optional "Filter zurücksetzen").
  icon?: LucideIcon;
  title?: string;
  action?: ReactNode;
}

// Einheitlicher Empty State für gefilterte/gesuchte Listen und Tabellen:
// Icon-Kachel auf feinem Raster, klare Erklärung und – wenn möglich – ein
// nächster Schritt.
export function EmptyState({ message, onReset, icon: Icon = SearchX, title, action }: EmptyStateProps) {
  return (
    <Card variant="flat" className="border-dashed">
      <CardContent className="relative flex flex-col items-center gap-4 overflow-hidden py-14 text-center">
        <div
          aria-hidden="true"
          className="tech-grid-fine tech-fade pointer-events-none absolute inset-0 opacity-70"
        />
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-(--elev-2) ring-1 ring-foreground/10">
          <Icon className="size-5" />
        </div>
        <div className="relative flex max-w-sm flex-col gap-1">
          {title && <p className="section-title">{title}</p>}
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {(onReset || action) && (
          <div className="relative flex flex-wrap items-center justify-center gap-2">
            {onReset && (
              <Button type="button" variant="outline" size="sm" onClick={onReset}>
                Filter zurücksetzen
              </Button>
            )}
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
