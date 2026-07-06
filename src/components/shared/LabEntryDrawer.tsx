import { Archive, Download, FileText, ImageIcon, Pencil, Paperclip } from "lucide-react";

import { AuditTrailPreview } from "@/components/shared/AuditTrailPreview";
import { LabEntryStatusBadge } from "@/components/shared/LabEntryStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { AuditEntry } from "@/types/testValue";
import type { LabEntry } from "@/types/labEntry";

interface LabEntryDrawerProps {
  entry: LabEntry | null;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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

export function LabEntryDrawer({ entry, onOpenChange }: LabEntryDrawerProps) {
  const auditEntries: AuditEntry[] =
    entry?.status === "Entwurf"
      ? []
      : [
          { actor: entry?.pruefer ?? "", action: "hat den Eintrag dokumentiert", timestamp: `${entry?.datum}, 15:20 Uhr` },
          { actor: "Laborleiter", action: "hat den Eintrag geprüft", timestamp: `${entry?.datum}, 17:00 Uhr` },
        ];

  return (
    <Drawer open={entry !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {entry && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{entry.sampleId}</DrawerTitle>
                <LabEntryStatusBadge status={entry.status} />
              </div>
              <p className="text-sm text-muted-foreground">{entry.pruefung}</p>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Bezeichnung" value={entry.bezeichnung} />
                  <DetailRow label="Projekt/Baustelle" value={entry.projekt} />
                  <DetailRow label="Kunde" value={entry.kunde} />
                  <DetailRow label="Fachbereich" value={entry.fachbereich} />
                  <DetailRow label="Prüfung" value={entry.pruefung} />
                  <DetailRow label="Prüfer" value={entry.pruefer} />
                  <DetailRow label="Datum" value={entry.datum} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Prüfwerte</SectionTitle>
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Noch keine Prüfwerte verknüpft. Erfassung folgt über den Bereich „Prüfwerte“.
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Bemerkungen</SectionTitle>
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Keine Bemerkungen hinterlegt.
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-muted-foreground" />
                  <SectionTitle>Fotos</SectionTitle>
                </div>
                {entry.documentsCount > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: Math.min(entry.documentsCount, 3) }).map((_, index) => (
                      <div
                        key={index}
                        className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground"
                      >
                        <ImageIcon className="size-5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Keine Fotos hinterlegt.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <SectionTitle>Anhänge</SectionTitle>
                </div>
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  {entry.documentsCount > 0
                    ? `${entry.documentsCount} Dokument${entry.documentsCount === 1 ? "" : "e"} hinterlegt.`
                    : "Keine Anhänge hinterlegt."}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-5">
                <AuditTrailPreview entries={auditEntries} />
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-5">
                <SectionTitle>Aktionen</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline">
                    <Pencil className="size-4" />
                    Bearbeiten
                  </Button>
                  <Button type="button" variant="outline">
                    <FileText className="size-4" />
                    PDF öffnen
                  </Button>
                  <Button type="button" variant="outline">
                    <Download className="size-4" />
                    Exportieren
                  </Button>
                  <Button type="button" variant="outline">
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                </div>
              </div>
            </DrawerBody>

            <div className="flex justify-end border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
