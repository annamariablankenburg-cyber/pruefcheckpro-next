import { Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MeasurementRowActionsProps {
  rowLabel: string;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function MeasurementRowActions({ rowLabel, onDuplicate, onDelete }: MeasurementRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`${rowLabel} duplizieren`}
        onClick={onDuplicate}
      >
        <Copy className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`${rowLabel} löschen`}
        onClick={onDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
