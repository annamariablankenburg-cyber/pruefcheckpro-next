import { Archive, Download, RefreshCcw, Trash2, UserCog, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BulkActionsToolbarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onChangeTester: () => void;
  onChangeStatus: () => void;
  onExport: () => void;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={destructive ? "text-destructive hover:text-destructive" : undefined}
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  );
}

// Massenerfassung: erscheint, sobald mindestens eine Probe in der Tabelle
// markiert wurde. Alle Aktionen wirken auf die gesamte Auswahl.
export function BulkActionsToolbar({
  count,
  onClear,
  onDelete,
  onArchive,
  onChangeTester,
  onChangeStatus,
  onExport,
}: BulkActionsToolbarProps) {
  if (count === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-3 py-3">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {count} ausgewählt
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton icon={UserCog} label="Prüfer ändern" onClick={onChangeTester} />
          <ToolbarButton icon={RefreshCcw} label="Status ändern" onClick={onChangeStatus} />
          <ToolbarButton icon={Archive} label="Archivieren" onClick={onArchive} />
          <ToolbarButton icon={Download} label="Export" onClick={onExport} />
          <ToolbarButton icon={Trash2} label="Löschen" onClick={onDelete} destructive />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Auswahl aufheben"
          onClick={onClear}
          className="ml-auto"
        >
          <X className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
