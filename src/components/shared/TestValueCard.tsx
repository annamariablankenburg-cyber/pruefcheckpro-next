import { CalendarDays, UserRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { TestEntryActionsMenu } from "@/components/shared/TestEntryActionsMenu";
import { TestEntryStatusBadge } from "@/components/shared/TestEntryStatusBadge";
import { cn } from "@/lib/utils";
import type { TestEntry } from "@/types/testValue";

interface TestValueCardProps {
  entry: TestEntry;
  onOpen: (entry: TestEntry) => void;
  onStart: (entry: TestEntry) => void;
  onComplete: (entry: TestEntry) => void;
  onReopen: (entry: TestEntry) => void;
  onCreateReport: (entry: TestEntry) => void;
  onExportExcel: (entry: TestEntry) => void;
}

export function TestValueCard({
  entry,
  onOpen,
  onStart,
  onComplete,
  onReopen,
  onCreateReport,
  onExportExcel,
}: TestValueCardProps) {
  return (
    <Card
      className={cn("h-full transition-shadow hover:shadow-md", entry.status === "Überfällig" && "border-destructive/30")}
    >
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={() => onOpen(entry)} className="min-w-0 text-left">
            <p className="font-semibold text-foreground hover:underline">{entry.sampleId}</p>
            <p className="truncate text-sm text-muted-foreground">{entry.titel}</p>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <TestEntryStatusBadge status={entry.status} />
            <TestEntryActionsMenu
              entry={entry}
              onOpenWorkspace={() => onOpen(entry)}
              onStart={() => onStart(entry)}
              onComplete={() => onComplete(entry)}
              onReopen={() => onReopen(entry)}
              onCreateReport={() => onCreateReport(entry)}
              onExportExcel={() => onExportExcel(entry)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground">Kunde</p>
            <p className="font-medium text-foreground">{entry.kunde}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Projekt</p>
            <p className="font-medium text-foreground">{entry.projekt}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fachbereich</p>
            <p className="font-medium text-foreground">{entry.fachbereich}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ergebnis</p>
            <p className="font-medium text-foreground">{entry.ergebnis}</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0" />
            {entry.pruefdatum}
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="size-3.5 shrink-0" />
            {entry.pruefer}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
