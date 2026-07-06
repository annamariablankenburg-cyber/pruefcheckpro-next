import { History } from "lucide-react";

import type { AuditEntry } from "@/types/testValue";

interface AuditTrailPreviewProps {
  entries: AuditEntry[];
}

// Rollenlogik noch nicht implementiert. Später dürfen nur Admin/Laborleiter
// erfasste Werte korrigieren – jede Änderung soll im Audit-Log nachvollziehbar bleiben.
export function AuditTrailPreview({ entries }: AuditTrailPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <History className="size-4 text-muted-foreground" />
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Änderungsverlauf
        </p>
      </div>

      {entries.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
              <span className="text-foreground">
                <span className="font-medium">{entry.actor}</span> {entry.action}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{entry.timestamp}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Noch keine Änderungen erfasst.
        </div>
      )}

      <p className="text-xs text-muted-foreground/70">
        Änderungen werden später vollständig im Audit-Log dokumentiert.
      </p>
    </div>
  );
}
