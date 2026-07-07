import {
  Archive,
  FileText,
  Gauge,
  History,
  Pencil,
  Power,
  PowerOff,
  Upload,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DeviceStatusBadge } from "@/components/shared/DeviceStatusBadge";
import { DeviceTypeBadge } from "@/components/shared/DeviceTypeBadge";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { RecordList } from "@/components/shared/RecordList";
import type { Device } from "@/types/device";

interface DeviceDetailDrawerProps {
  device: Device | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (device: Device) => void;
  onDocumentCalibration: (device: Device) => void;
  onDocumentMaintenance: (device: Device) => void;
  onUploadDocument: (device: Device) => void;
  onDeactivate: (device: Device) => void;
  onReactivate: (device: Device) => void;
  onArchive: (device: Device) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function DeviceDetailDrawer({
  device,
  onOpenChange,
  onEdit,
  onDocumentCalibration,
  onDocumentMaintenance,
  onUploadDocument,
  onDeactivate,
  onReactivate,
  onArchive,
}: DeviceDetailDrawerProps) {
  const status = device?.status;
  const canDeactivate = status !== "Außer Betrieb" && status !== "Archiviert";
  const canReactivate = status === "Außer Betrieb" || status === "Archiviert";
  const canArchive = status !== "Archiviert";

  return (
    <Drawer open={device !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {device && (
          <>
            <DrawerHeader>
              <DrawerTitle>{device.name}</DrawerTitle>
              <p className="text-sm text-muted-foreground">{device.inventoryNumber}</p>
              <div className="flex items-center gap-2">
                <DeviceStatusBadge status={device.status} />
                <DeviceTypeBadge type={device.type} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Inventarnummer" value={device.inventoryNumber} />
                  <DetailRow label="Seriennummer" value={device.serialNumber ?? "—"} />
                  <DetailRow label="Hersteller" value={device.manufacturer} />
                  <DetailRow label="Modell" value={device.model} />
                  <DetailRow label="Baujahr" value={device.yearBuilt ?? "—"} />
                  <DetailRow label="Standort" value={device.location} />
                  <DetailRow label="Status" value={device.status} />
                </div>
                {device.responsiblePerson && (
                  <div className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-muted-foreground">Verantwortlicher</span>
                    <div className="flex items-center gap-2">
                      <EmployeeAvatar initials={device.responsiblePersonInitials ?? "?"} />
                      <span className="font-medium text-foreground">
                        {device.responsiblePerson}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Gauge className="size-4 text-muted-foreground" />
                    <SectionTitle>Kalibrierungen</SectionTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDocumentCalibration(device)}
                  >
                    Kalibrierung dokumentieren
                  </Button>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border px-3.5">
                  <DetailRow label="Letzte Kalibrierung" value={device.lastCalibration ?? "—"} />
                  <DetailRow label="Nächste Kalibrierung" value={device.nextCalibration ?? "—"} />
                  <DetailRow label="Zertifikat" value={device.calibrationCertificate ?? "—"} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="size-4 text-muted-foreground" />
                    <SectionTitle>Wartungen</SectionTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDocumentMaintenance(device)}
                  >
                    Wartung dokumentieren
                  </Button>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border px-3.5">
                  <DetailRow label="Letzte Wartung" value={device.lastMaintenance ?? "—"} />
                  <DetailRow label="Nächste Wartung" value={device.nextMaintenance ?? "—"} />
                  <DetailRow label="Wartungsintervall" value={device.maintenanceInterval ?? "—"} />
                </div>
              </div>

              <RecordList
                title="Dokumente"
                icon={FileText}
                items={device.documents}
                addLabel="Dokument hochladen"
                onAdd={() => onUploadDocument(device)}
                emptyLabel="Noch keine Dokumente hinterlegt."
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {device.history.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {device.history.map((entry) => (
                      <div
                        key={entry.message}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                      >
                        <span className="text-foreground">{entry.message}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {entry.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Noch keine Historie vorhanden.
                  </div>
                )}
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => onEdit(device)}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                <Button type="button" variant="outline" onClick={() => onUploadDocument(device)}>
                  <Upload className="size-4" />
                  Dokument hochladen
                </Button>
                {canDeactivate && (
                  <Button type="button" variant="outline" onClick={() => onDeactivate(device)}>
                    <PowerOff className="size-4" />
                    Außer Betrieb setzen
                  </Button>
                )}
                {canReactivate && (
                  <Button type="button" variant="outline" onClick={() => onReactivate(device)}>
                    <Power className="size-4" />
                    Reaktivieren
                  </Button>
                )}
                {canArchive && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2"
                    onClick={() => onArchive(device)}
                  >
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
