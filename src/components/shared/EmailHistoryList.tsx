"use client";

import { useState } from "react";
import { ChevronDown, Copy, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmailSendStatusBadge } from "@/components/shared/EmailSendStatusBadge";
import { cn } from "@/lib/utils";
import type { ReportEmailHistoryEntry } from "@/types/report";

interface EmailHistoryListProps {
  entries: ReportEmailHistoryEntry[];
  onResend: (entry: ReportEmailHistoryEntry) => void;
  onCopyText: (entry: ReportEmailHistoryEntry) => void;
}

export function EmailHistoryList({ entries, onResend, onCopyText }: EmailHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Noch keine E-Mail versendet.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
      {entries.map((entry) => {
        const isExpanded = expandedId === entry.id;
        return (
          <div key={entry.id} className="flex flex-col gap-2 px-3.5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={entry.subject}>
                  {entry.subject}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={entry.recipients.join(", ")}>
                  An: {entry.recipients.join(", ")}
                </p>
              </div>
              <EmailSendStatusBadge status={entry.status} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {entry.timestamp} · gesendet von {entry.sentBy} · {entry.attachmentCount}{" "}
                {entry.attachmentCount === 1 ? "Anhang" : "Anhänge"}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
                  Details anzeigen
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onResend(entry)}>
                  <Send className="size-4" />
                  Erneut senden
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onCopyText(entry)}>
                  <Copy className="size-4" />
                  Text kopieren
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3 text-sm">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" /> Nachricht
                </p>
                <p className="whitespace-pre-wrap text-foreground">{entry.message}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
