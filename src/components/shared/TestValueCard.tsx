import { AlertTriangle, ArrowRight, CalendarDays, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestTypeBadge } from "@/components/shared/TestTypeBadge";
import { cn } from "@/lib/utils";
import type { TestEntry } from "@/types/testValue";

interface TestValueCardProps {
  entry: TestEntry;
  onOpen: (entry: TestEntry) => void;
}

export function TestValueCard({ entry, onOpen }: TestValueCardProps) {
  return (
    <Card
      className={cn(
        "h-full transition-shadow hover:shadow-md",
        entry.ueberfaellig && "border-destructive/30"
      )}
    >
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{entry.sampleId}</p>
            <p className="truncate text-sm text-muted-foreground">{entry.titel}</p>
          </div>
          <TestTypeBadge testType={entry.testType} />
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0" />
            {entry.pruefdatum}
            {entry.ueberfaellig && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                <AlertTriangle className="size-3.5" />
                Überfällig
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="size-3.5 shrink-0" />
            {entry.pruefer}
          </div>
        </div>

        <Button
          type="button"
          variant={entry.erfasst ? "outline" : "default"}
          className="mt-auto w-fit"
          onClick={() => onOpen(entry)}
        >
          {entry.erfasst ? "Werte bearbeiten" : "Prüfwerte eintragen"}
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
