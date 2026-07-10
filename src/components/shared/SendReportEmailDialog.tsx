"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { EmailAttachmentSelector } from "@/components/shared/EmailAttachmentSelector";
import { EmailPreview } from "@/components/shared/EmailPreview";
import { EmailRecipientFields } from "@/components/shared/EmailRecipientFields";
import { companyRepository } from "@/lib/repositories/companyRepository";
import {
  buildAttachmentOptions,
  buildDefaultMessage,
  buildDefaultRecipients,
  buildDefaultSubject,
  type EmailAttachmentOption,
} from "@/lib/reportEmailDefaults";
import type { Report } from "@/types/report";

export interface EmailDraftResult {
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo: string;
  subject: string;
  message: string;
  attachments: EmailAttachmentOption[];
}

interface SendReportEmailDialogProps {
  report: Report | null;
  initialRecipients?: string[];
  initialSubject?: string;
  onOpenChange: (open: boolean) => void;
  onSaveDraft: (report: Report, draft: EmailDraftResult) => void;
  onSendTest: () => void;
  onSend: (report: Report, draft: EmailDraftResult) => void;
}

type Step = "compose" | "preview";

let fileCounter = 0;

interface WorkspaceProps {
  report: Report;
  initialRecipients?: string[];
  initialSubject?: string;
  onSaveDraft: (report: Report, draft: EmailDraftResult) => void;
  onSendTest: () => void;
  onSend: (report: Report, draft: EmailDraftResult) => void;
}

function EmailComposeWorkspace({
  report,
  initialRecipients,
  initialSubject,
  onSaveDraft,
  onSendTest,
  onSend,
}: WorkspaceProps) {
  const company = companyRepository.getProfile();
  const [step, setStep] = useState<Step>("compose");
  const [to, setTo] = useState<string[]>(() => {
    const defaults = initialRecipients ?? buildDefaultRecipients(report);
    return defaults.length > 0 ? defaults : [""];
  });
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState("");
  const [subject, setSubject] = useState(initialSubject ?? buildDefaultSubject(report));
  const [message, setMessage] = useState(() => buildDefaultMessage(report));
  const [attachments, setAttachments] = useState<EmailAttachmentOption[]>(() => buildAttachmentOptions(report));
  const [isConfirmSendOpen, setIsConfirmSendOpen] = useState(false);

  const hasRecipient = to.some((value) => value.trim().length > 0);
  const hasSubject = subject.trim().length > 0;
  const hasMessage = message.trim().length > 0;
  const canContinue = hasRecipient && hasSubject && hasMessage;

  function toggleAttachment(id: string) {
    setAttachments((current) =>
      current.map((attachment) =>
        attachment.id === id ? { ...attachment, selected: !attachment.selected } : attachment
      )
    );
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  function addAttachment() {
    fileCounter += 1;
    setAttachments((current) => [
      ...current,
      {
        id: `custom-${fileCounter}`,
        label: `Zusaetzliches_Dokument_${fileCounter}.pdf`,
        fileType: "PDF",
        sizeLabel: "620 KB",
        selected: true,
      },
    ]);
  }

  function buildDraft(): EmailDraftResult {
    return {
      to: to.map((value) => value.trim()).filter(Boolean),
      cc: cc.map((value) => value.trim()).filter(Boolean),
      bcc: bcc.map((value) => value.trim()).filter(Boolean),
      replyTo: replyTo.trim(),
      subject: subject.trim(),
      message,
      attachments,
    };
  }

  function handleConfirmSend() {
    setIsConfirmSendOpen(false);
    onSend(report, buildDraft());
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Prüfbericht per E-Mail senden</DrawerTitle>
        <p className="text-sm text-muted-foreground">
          Versende den Bericht an den Kunden oder einen Ansprechpartner.
        </p>
      </DrawerHeader>

      <DrawerBody className="flex flex-col gap-5">
        {step === "compose" ? (
          <>
            <EmailRecipientFields
              to={to}
              onToChange={setTo}
              cc={cc}
              onCcChange={setCc}
              bcc={bcc}
              onBccChange={setBcc}
              replyTo={replyTo}
              onReplyToChange={setReplyTo}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Betreff<span className="text-destructive"> *</span>
              </label>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Nachricht<span className="text-destructive"> *</span>
              </label>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-40"
              />
            </div>

            <EmailAttachmentSelector
              attachments={attachments}
              onToggle={toggleAttachment}
              onRemove={removeAttachment}
              onAdd={addAttachment}
            />
          </>
        ) : (
          <EmailPreview
            from={company.email}
            to={to}
            cc={cc}
            bcc={bcc}
            replyTo={replyTo}
            subject={subject}
            message={message}
            attachments={attachments}
          />
        )}
      </DrawerBody>

      <div className="flex flex-row flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
        {step === "compose" ? (
          <Button type="button" onClick={() => setStep("preview")} disabled={!canContinue}>
            Weiter zur Vorschau
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => setStep("compose")}>
              Zurück
            </Button>
            <Button type="button" variant="outline" onClick={() => onSaveDraft(report, buildDraft())}>
              Als Entwurf speichern
            </Button>
            <Button type="button" variant="outline" onClick={onSendTest}>
              Test-E-Mail senden
            </Button>
            <Button type="button" onClick={() => setIsConfirmSendOpen(true)}>
              <Send className="size-4" />
              E-Mail senden
            </Button>
          </>
        )}
      </div>

      <ConfirmActionDialog<boolean>
        subject={isConfirmSendOpen ? true : null}
        title="Prüfbericht per E-Mail senden?"
        description="Der Bericht wird als versendet markiert und im E-Mail-Verlauf gespeichert (nur lokale Simulation, kein echter E-Mail-Versand)."
        confirmLabel="E-Mail senden"
        onOpenChange={(open) => !open && setIsConfirmSendOpen(false)}
        onConfirm={handleConfirmSend}
      />
    </>
  );
}

export function SendReportEmailDialog({
  report,
  initialRecipients,
  initialSubject,
  onOpenChange,
  onSaveDraft,
  onSendTest,
  onSend,
}: SendReportEmailDialogProps) {
  return (
    <Drawer open={report !== null} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:max-w-xl">
        {report && (
          <EmailComposeWorkspace
            key={`${report.id}-${initialSubject ?? ""}`}
            report={report}
            initialRecipients={initialRecipients}
            initialSubject={initialSubject}
            onSaveDraft={onSaveDraft}
            onSendTest={onSendTest}
            onSend={onSend}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
