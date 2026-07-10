"use client";

import { Barcode, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SiteScannerDialogProps {
  mode: "qr" | "barcode" | null;
  onOpenChange: (open: boolean) => void;
  onScan: (mode: "qr" | "barcode") => void;
}

const copy = {
  qr: {
    title: "QR-Code scannen",
    description: "QR-Code ist optional. Er kann die Probenzuordnung vor Ort beschleunigen.",
    icon: QrCode,
  },
  barcode: {
    title: "Barcode scannen",
    description: "Barcode einer Probe oder eines Geräts erfassen.",
    icon: Barcode,
  },
} as const;

export function SiteScannerDialog({ mode, onOpenChange, onScan }: SiteScannerDialogProps) {
  const active = mode ? copy[mode] : null;
  const Icon = active?.icon ?? QrCode;

  return (
    <Dialog open={mode !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {active && (
          <>
            <DialogHeader>
              <DialogTitle>{active.title}</DialogTitle>
              <DialogDescription>{active.description}</DialogDescription>
            </DialogHeader>

            <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-center">
              <Icon className="size-10 text-muted-foreground" />
              <p className="px-4 text-sm text-muted-foreground">Kamera-Vorschau (nur UI)</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
              <Button type="button" onClick={() => mode && onScan(mode)}>
                Scan starten
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
