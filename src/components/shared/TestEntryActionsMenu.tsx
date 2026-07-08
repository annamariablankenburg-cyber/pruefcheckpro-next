import {
  CheckCircle2,
  Download,
  FileText,
  MoreHorizontal,
  PlayCircle,
  RotateCcw,
  TestTubeDiagonal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TestEntry } from "@/types/testValue";

interface TestEntryActionsMenuProps {
  entry: TestEntry;
  onOpenWorkspace: () => void;
  onStart: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onCreateReport: () => void;
  onExportExcel: () => void;
}

export function TestEntryActionsMenu({
  entry,
  onOpenWorkspace,
  onStart,
  onComplete,
  onReopen,
  onCreateReport,
  onExportExcel,
}: TestEntryActionsMenuProps) {
  const { status } = entry;
  const canStart = status === "Offen" || status === "Vorbereitung" || status === "Überfällig";
  const canComplete = status === "In Bearbeitung" || status === "Überfällig";
  const canReopen = status === "Abgeschlossen";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Aktionen für ${entry.sampleId}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpenWorkspace}>
          <TestTubeDiagonal />
          Prüfwerte eintragen
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canStart && (
          <DropdownMenuItem onSelect={onStart}>
            <PlayCircle />
            In Bearbeitung starten
          </DropdownMenuItem>
        )}
        {canComplete && (
          <DropdownMenuItem onSelect={onComplete}>
            <CheckCircle2 />
            Als abgeschlossen markieren
          </DropdownMenuItem>
        )}
        {canReopen && (
          <DropdownMenuItem onSelect={onReopen}>
            <RotateCcw />
            Wieder öffnen
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={onCreateReport}>
          <FileText />
          Bericht erstellen
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportExcel}>
          <Download />
          Excel exportieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
