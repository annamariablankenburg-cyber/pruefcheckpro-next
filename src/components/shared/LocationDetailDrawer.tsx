import { ArrowRight, Cpu, FolderKanban, History, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LocationStatusBadge } from "@/components/shared/LocationStatusBadge";
import { LocationTypeBadge } from "@/components/shared/LocationTypeBadge";
import type { CompanyLocationDetail } from "@/types/location";

interface LocationDetailDrawerProps {
  location: CompanyLocationDetail | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (location: CompanyLocationDetail) => void;
  onViewEmployees: (location: CompanyLocationDetail) => void;
  onViewDevices: (location: CompanyLocationDetail) => void;
  onViewProjects: (location: CompanyLocationDetail) => void;
  onToggleStatus: (location: CompanyLocationDetail) => void;
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

export function LocationDetailDrawer({
  location,
  onOpenChange,
  onEdit,
  onViewEmployees,
  onViewDevices,
  onViewProjects,
  onToggleStatus,
}: LocationDetailDrawerProps) {
  const isActive = location?.status === "Aktiv";

  return (
    <Drawer open={location !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {location && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{location.name}</DrawerTitle>
                <LocationStatusBadge status={location.status} />
              </div>
              <LocationTypeBadge type={location.type} className="w-fit" />
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Straße" value={location.street} />
                  <DetailRow label="PLZ / Ort" value={`${location.postalCode} ${location.city}`} />
                  <DetailRow label="Land" value={location.country} />
                  <DetailRow label="Zeitzone" value={location.timezone} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Ansprechpartner &amp; Kontakt</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Ansprechpartner" value={location.contactPerson} />
                  <DetailRow label="Telefon" value={location.phone} />
                  <DetailRow label="E-Mail" value={location.email} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Zuordnungen</SectionTitle>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
                    <Users className="size-4 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">
                      {location.employeeCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Mitarbeiter</p>
                    <button
                      type="button"
                      onClick={() => onViewEmployees(location)}
                      className="mt-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Anzeigen
                      <ArrowRight className="size-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
                    <Cpu className="size-4 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">{location.deviceCount}</p>
                    <p className="text-xs text-muted-foreground">Geräte</p>
                    <button
                      type="button"
                      onClick={() => onViewDevices(location)}
                      className="mt-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Anzeigen
                      <ArrowRight className="size-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <p className="text-lg font-semibold text-foreground">
                      {location.projectCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Projekte</p>
                    <button
                      type="button"
                      onClick={() => onViewProjects(location)}
                      className="mt-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Anzeigen
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {location.history.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {location.history.map((entry) => (
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

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => onEdit(location)}>
                Bearbeiten
              </Button>
              <Button
                type="button"
                variant={isActive ? "destructive" : "default"}
                onClick={() => onToggleStatus(location)}
              >
                {isActive ? "Standort deaktivieren" : "Standort reaktivieren"}
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
