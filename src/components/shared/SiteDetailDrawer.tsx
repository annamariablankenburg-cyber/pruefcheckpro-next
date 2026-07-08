import { Camera, Cpu, FileText, Image as ImageIcon, MapPin, StickyNote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RecordList } from "@/components/shared/RecordList";
import { cn } from "@/lib/utils";
import type { SiteSample, SiteSampleStatus } from "@/types/siteMode";

const statusStyles: Record<SiteSampleStatus, string> = {
  Offen: "bg-muted text-muted-foreground",
  "In Prüfung": "bg-primary/10 text-primary",
  Abgeschlossen: "bg-success/10 text-success",
  Überfällig: "bg-destructive/10 text-destructive",
};

interface SiteDetailDrawerProps {
  sample: SiteSample | null;
  onOpenChange: (open: boolean) => void;
  onPhoto: (sample: SiteSample) => void;
  onUpdateLocation: (sample: SiteSample) => void;
  onAddPhoto: (sample: SiteSample) => void;
  onAddAttachment: (sample: SiteSample) => void;
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
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</p>
  );
}

export function SiteDetailDrawer({
  sample,
  onOpenChange,
  onPhoto,
  onUpdateLocation,
  onAddPhoto,
  onAddAttachment,
}: SiteDetailDrawerProps) {
  return (
    <Drawer open={sample !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {sample && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{sample.id}</DrawerTitle>
                <Badge variant="secondary" className={cn("shrink-0", statusStyles[sample.status])}>
                  {sample.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{sample.bezeichnung}</p>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Projekt" value={sample.projekt} />
                  <DetailRow label="Kunde" value={sample.kunde} />
                  <DetailRow label="Ansprechpartner" value={sample.ansprechpartner} />
                  <DetailRow label="GPS" value={sample.gps} />
                  <DetailRow label="Probe" value={sample.id} />
                  <DetailRow label="Prüfalter" value={sample.pruefalter} />
                  <DetailRow label="Status" value={sample.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Prüfungen</SectionTitle>
                {sample.pruefungen.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {sample.pruefungen.map((pruefung) => (
                      <div
                        key={pruefung.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                      >
                        <span className="text-foreground">{pruefung.name}</span>
                        <Badge variant="secondary" className={cn("shrink-0", statusStyles[pruefung.status])}>
                          {pruefung.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Keine Prüfungen zugeordnet.
                  </div>
                )}
              </div>

              <RecordList
                title="Fotos"
                icon={ImageIcon}
                items={sample.fotos}
                addLabel="Foto hinzufügen"
                onAdd={() => onAddPhoto(sample)}
                emptyLabel="Noch keine Fotos hinterlegt."
              />

              <RecordList
                title="Anhänge"
                icon={FileText}
                items={sample.anhaenge}
                addLabel="Anhang hinzufügen"
                onAdd={() => onAddAttachment(sample)}
                emptyLabel="Noch keine Anhänge hinterlegt."
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-muted-foreground" />
                  <SectionTitle>Geräte</SectionTitle>
                </div>
                {sample.geraete.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sample.geraete.map((geraet) => (
                      <Badge key={geraet} variant="secondary" className="bg-muted text-muted-foreground">
                        {geraet}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Kein Gerät zugeordnet.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  <SectionTitle>Notizen</SectionTitle>
                </div>
                <p className="rounded-xl border border-border p-3.5 text-sm text-foreground">
                  {sample.notizen || "Keine Notizen erfasst."}
                </p>
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" size="lg" onClick={() => onPhoto(sample)}>
                  <Camera className="size-4" />
                  Foto aufnehmen
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => onUpdateLocation(sample)}>
                  <MapPin className="size-4" />
                  Standort aktualisieren
                </Button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
