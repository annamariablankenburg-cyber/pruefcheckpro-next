"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { SiteNote } from "@/types/siteMode";

interface SiteNoteDialogProps {
  open: boolean;
  note: SiteNote | null;
  onOpenChange: (open: boolean) => void;
  onSave: (text: string) => void;
}

export function SiteNoteDialog({ open, note, onOpenChange, onSave }: SiteNoteDialogProps) {
  const isEditMode = Boolean(note);
  const [text, setText] = useState(note?.text ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setText(note?.text ?? "");
        onOpenChange(next);
      }}
    >
      <DialogContent key={note?.id ?? "new"}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Notiz bearbeiten" : "Neue Notiz"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Ändere den Text dieser Notiz. Nur lokal gespeichert."
              : "Erfasse eine Notiz zur aktuellen Baustelle. Nur lokal gespeichert."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="site-note-text" className="text-sm font-medium text-foreground">
            Notiz
          </label>
          <Textarea
            id="site-note-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="z. B. Besonderheiten bei der Probenahme …"
            className="min-h-28"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={() => onSave(text)} disabled={text.trim().length === 0}>
            {isEditMode ? "Speichern" : "Notiz hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
