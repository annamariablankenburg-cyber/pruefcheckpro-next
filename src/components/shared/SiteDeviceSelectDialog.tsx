"use client";

import { Cpu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SiteDevice, SiteDeviceStatus } from "@/types/siteMode";

const statusStyles: Record<SiteDeviceStatus, string> = {
  Einsatzbereit: "bg-success/10 text-success",
  "Kalibrierung fällig": "bg-warning/10 text-warning",
  "Wartung fällig": "bg-warning/10 text-warning",
};

interface SiteDeviceSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: SiteDevice[];
  onSelect: (device: SiteDevice) => void;
}

export function SiteDeviceSelectDialog({ open, onOpenChange, devices, onSelect }: SiteDeviceSelectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerät auswählen</DialogTitle>
          <DialogDescription>
            Wähle ein verfügbares Gerät für die aktuelle Prüfung aus. Nur UI-Vorschau.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {devices.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => onSelect(device)}
              className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Cpu className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={device.name}>
                  {device.name}
                </p>
                <p className="truncate text-xs text-muted-foreground" title={device.inventoryNumber}>
                  {device.inventoryNumber}
                </p>
              </div>
              <Badge variant="secondary" className={cn("shrink-0", statusStyles[device.status])}>
                {device.status}
              </Badge>
            </button>
          ))}
          {devices.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Keine Geräte verfügbar.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
