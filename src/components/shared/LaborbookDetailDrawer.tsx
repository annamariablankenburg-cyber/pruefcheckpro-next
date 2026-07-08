import { Archive, ArchiveRestore, History, Image as ImageIcon, FileText, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LaborbookStatusBadge } from "@/components/shared/LaborbookStatusBadge";
import { LaborbookTypeBadge } from "@/components/shared/LaborbookTypeBadge";
import { RecordList } from "@/components/shared/RecordList";
import type { LaborbookEntry } from "@/types/laborbook";

interface LaborbookDetailDrawerProps {
  entry: LaborbookEntry | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (entry: LaborbookEntry) => void;
  onArchive: (entry: LaborbookEntry) => void;
  onReactivate: (entry: LaborbookEntry) => void;
  onDelete: (entry: LaborbookEntry) => void;
  onAddPhoto: (entry: LaborbookEntry) => void;
  onAddDocument: (entry: LaborbookEntry) => void;
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

export function LaborbookDetailDrawer({
  entry,
  onOpenChange,
  onEdit,
  onArchive,
  onReactivate,
  onDelete,
  onAddPhoto,
  onAddDocument,
}: LaborbookDetailDrawerProps) {
  const canArchive = entry?.status !== "Archiviert";
  const canReactivate = entry?.status === "Archiviert";

  return (
    <Drawer open={entry !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {entry && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{entry.titel}</DrawerTitle>
              </div>
              <p className="text-sm text-muted-foreground">{entry.id}</p>
              <div className="flex items-center gap-2">
                <LaborbookTypeBadge typ={entry.typ} />
                <LaborbookStatusBadge status={entry.status} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Datum" value={entry.datum} />
                  <DetailRow label="Uhrzeit" value={`${entry.uhrzeit} Uhr`} />
                  <DetailRow label="Typ" value={entry.typ} />
                  {entry.fachbereich && <DetailRow label="Fachbereich" value={entry.fachbereich} />}
                  <DetailRow label="Projekt" value={entry.projekt ?? "—"} />
                  <DetailRow label="Kunde" value={entry.kunde ?? "—"} />
                  <DetailRow label="Probe" value={entry.probeId ?? "—"} />
                  <DetailRow label="Gerät" value={entry.geraet ?? "—"} />
                  <DetailRow label="Mitarbeiter" value={entry.mitarbeiter} />
                  <DetailRow label="Status" value={entry.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Beschreibung</SectionTitle>
                <p className="rounded-xl border border-border p-3.5 text-sm text-foreground">
                  {entry.beschreibung}
                </p>
              </div>

              <RecordList
                title="Anhänge"
                icon={ImageIcon}
                items={entry.fotos}
                addLabel="Foto hinzufügen"
                onAdd={() => onAddPhoto(entry)}
                emptyLabel="Noch keine Fotos hinterlegt."
              />

              <RecordList
                title="Dokumente"
                icon={FileText}
                items={entry.dokumente}
                addLabel="Dokument hochladen"
                onAdd={() => onAddDocument(entry)}
                emptyLabel="Noch keine Dokumente hinterlegt."
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {entry.historie.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {entry.historie.map((h) => (
                      <div
                        key={h.message}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                      >
                        <span className="text-foreground">{h.message}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{h.timestamp}</span>
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
                <Button type="button" variant="outline" onClick={() => onEdit(entry)}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                {canArchive && (
                  <Button type="button" variant="outline" onClick={() => onArchive(entry)}>
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
                {canReactivate && (
                  <Button type="button" variant="outline" onClick={() => onReactivate(entry)}>
                    <ArchiveRestore className="size-4" />
                    Reaktivieren
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  className="col-span-2"
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 className="size-4" />
                  Löschen
                </Button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
