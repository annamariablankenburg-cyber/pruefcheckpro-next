"use client";

import { Camera, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SitePhotoCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCamera: () => void;
  onChooseFile: () => void;
}

export function SitePhotoCaptureDialog({
  open,
  onOpenChange,
  onOpenCamera,
  onChooseFile,
}: SitePhotoCaptureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Foto aufnehmen</DialogTitle>
          <DialogDescription>
            Nur UI-Vorschau – die eigentliche Kamera-/Dateianbindung folgt später.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenCamera}
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center transition-colors hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
          >
            <Camera className="size-6 text-primary" />
            <span className="px-2 text-sm font-medium text-foreground">Kamera öffnen</span>
          </button>
          <button
            type="button"
            onClick={onChooseFile}
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center transition-colors hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
          >
            <Upload className="size-6 text-primary" />
            <span className="px-2 text-sm font-medium text-foreground">Datei auswählen</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
