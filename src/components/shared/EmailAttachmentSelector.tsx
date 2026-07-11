"use client";

import { Paperclip, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { EmailAttachmentOption } from "@/lib/reportEmailDefaults";

interface EmailAttachmentSelectorProps {
  attachments: EmailAttachmentOption[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function EmailAttachmentSelector({ attachments, onToggle, onRemove, onAdd }: EmailAttachmentSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">Anhänge</label>
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <Checkbox
              checked={attachment.selected}
              disabled={attachment.locked}
              onCheckedChange={() => !attachment.locked && onToggle(attachment.id)}
              aria-label={attachment.locked ? `${attachment.label} (immer angehängt)` : attachment.label}
            />
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground" title={attachment.label}>
                {attachment.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {attachment.fileType} · {attachment.sizeLabel}
                {attachment.locked && " · immer angehängt"}
              </p>
            </div>
            {!attachment.locked && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${attachment.label} entfernen`}
                onClick={() => onRemove(attachment.id)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
        {attachments.length === 0 && (
          <p className="px-3.5 py-4 text-center text-sm text-muted-foreground">Keine Anhänge ausgewählt.</p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onAdd}>
        <Plus className="size-4" />
        Datei hinzufügen
      </Button>
    </div>
  );
}
