import {
  CheckCircle2,
  Download,
  FileText,
  MoreHorizontal,
  PlayCircle,
  RotateCcw,
  TestTubeDiagonal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TestEntryReportAction, TestEntryUiAccess } from "@/lib/permissions/domainAccess";
import type { TestEntry } from "@/types/testValue";

interface TestEntryActionsMenuProps {
  entry: TestEntry;
  // Rechte des Nutzers (UX-Gating; die Firestore Rules bleiben die Sicherheitsgrenze).
  access: TestEntryUiAccess;
  // "öffnen" (Bericht existiert, berichte.ansehen), "erstellen" (kein Bericht, Berichtsformular-Rechte) oder null.
  reportAction: TestEntryReportAction;
  onOpenWorkspace: () => void;
  onStart: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onCreateReport: () => void;
  onExportExcel: () => void;
  onDelete: () => void;
}

export function TestEntryActionsMenu({
  entry,
  access,
  reportAction,
  onOpenWorkspace,
  onStart,
  onComplete,
  onReopen,
  onCreateReport,
  onExportExcel,
  onDelete,
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

        {access.edit && (
          <>
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
          </>
        )}

        {(reportAction !== null || access.export) && <DropdownMenuSeparator />}

        {reportAction !== null && (
          <DropdownMenuItem onSelect={onCreateReport}>
            <FileText />
            {reportAction === "open" ? "Bericht öffnen" : "Bericht erstellen"}
          </DropdownMenuItem>
        )}
        {access.export && (
          <DropdownMenuItem onSelect={onExportExcel}>
            <Download />
            Excel exportieren
          </DropdownMenuItem>
        )}

        {access.delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              Löschen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
