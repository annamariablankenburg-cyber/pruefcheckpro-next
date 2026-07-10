import { Paperclip } from "lucide-react";

import type { EmailAttachmentOption } from "@/lib/reportEmailDefaults";

interface EmailPreviewProps {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo: string;
  subject: string;
  message: string;
  attachments: EmailAttachmentOption[];
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0 sm:flex-row sm:gap-3">
      <span className="w-24 shrink-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm break-words text-foreground">{value}</span>
    </div>
  );
}

export function EmailPreview({ from, to, cc, bcc, replyTo, subject, message, attachments }: EmailPreviewProps) {
  const selected = attachments.filter((attachment) => attachment.selected);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border px-4">
        <Row label="Von" value={from} />
        <Row label="An" value={to.filter(Boolean).join(", ") || "—"} />
        <Row label="CC" value={cc.filter(Boolean).join(", ")} />
        <Row label="BCC" value={bcc.filter(Boolean).join(", ")} />
        <Row label="Antwort an" value={replyTo} />
        <Row label="Betreff" value={subject || "—"} />
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nachricht</p>
        <p className="text-sm whitespace-pre-wrap text-foreground">{message || "—"}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Anhänge ({selected.length})
        </p>
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((attachment) => (
              <span
                key={attachment.id}
                className="flex max-w-full items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground"
              >
                <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate" title={attachment.label}>
                  {attachment.label}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Anhänge ausgewählt.</p>
        )}
      </div>
    </div>
  );
}
