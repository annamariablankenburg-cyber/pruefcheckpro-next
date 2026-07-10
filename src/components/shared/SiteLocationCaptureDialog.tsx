"use client";

import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SiteLocationCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: string;
  onConfirm: () => void;
}

export function SiteLocationCaptureDialog({
  open,
  onOpenChange,
  currentLocation,
  onConfirm,
}: SiteLocationCaptureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Standort erfassen</DialogTitle>
          <DialogDescription>
            Standortdaten werden nach Freigabe der Standortberechtigung automatisch erfasst. Bis dahin
            kannst du die aktuelle Baustellenadresse manuell übernehmen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3.5">
          <MapPin className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Aktuelle Koordinaten (Mock-Daten)</p>
            <p className="text-sm font-medium text-foreground">{currentLocation}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={onConfirm}>
            Standort übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
