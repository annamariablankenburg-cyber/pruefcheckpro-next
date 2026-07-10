import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RecordListItem {
  id: string;
  title: string;
  date: string;
}

interface RecordListProps {
  title: string;
  icon: LucideIcon;
  items: RecordListItem[];
  addLabel: string;
  onAdd: () => void;
  emptyLabel: string;
  iconClassName?: string;
}

// Generische Liste datierter Einträge (Rechnungen, Lieferscheine, …), damit
// nicht für jeden Bereich eine fast identische Listen-Komponente entsteht.
export function RecordList({
  title,
  icon: Icon,
  items,
  addLabel,
  onAdd,
  emptyLabel,
  iconClassName,
}: RecordListProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
                  iconClassName
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={item.title}>
                  {item.title}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{item.date}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
