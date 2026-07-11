import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Barcode,
  CheckCircle2,
  Copy,
  FileText,
  History,
  Image as ImageIcon,
  Pencil,
  PlayCircle,
  QrCode,
  RotateCcw,
  Trash2,
  Truck,
  TestTubeDiagonal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { RecordList } from "@/components/shared/RecordList";
import { SampleStatusBadge } from "@/components/shared/SampleStatusBadge";
import type { Sample, SamplePruefungStatus } from "@/types/sample";

interface SampleDetailDrawerProps {
  sample: Sample | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (sample: Sample) => void;
  onEnterValues: (sample: Sample) => void;
  onStart: (sample: Sample) => void;
  onComplete: (sample: Sample) => void;
  onReopen: (sample: Sample) => void;
  onArchive: (sample: Sample) => void;
  onReactivate: (sample: Sample) => void;
  onDuplicate: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
  onAddAttachment: (sample: Sample) => void;
  onAddDocument: (sample: Sample) => void;
  onAddDeliveryNote: (sample: Sample) => void;
}

const pruefungStatusStyles: Record<SamplePruefungStatus, string> = {
  Offen: "bg-muted text-muted-foreground",
  "In Prüfung": "bg-primary/10 text-primary",
  Abgeschlossen: "bg-success/10 text-success",
};

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

export function SampleDetailDrawer({
  sample,
  onOpenChange,
  onEdit,
  onEnterValues,
  onStart,
  onComplete,
  onReopen,
  onArchive,
  onReactivate,
  onDuplicate,
  onDelete,
  onAddAttachment,
  onAddDocument,
  onAddDeliveryNote,
}: SampleDetailDrawerProps) {
  const status = sample?.status;
  const canStart = status === "Offen" || status === "Vorbereitung";
  const canComplete = status === "In Prüfung" || status === "Überfällig";
  const canReopen = status === "Abgeschlossen";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

  return (
    <Drawer open={sample !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {sample && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{sample.id}</DrawerTitle>
                <SampleStatusBadge status={sample.status} />
              </div>
              <p className="text-sm text-muted-foreground">{sample.bezeichnung}</p>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Kunde" value={sample.kunde} />
                  <DetailRow label="Projekt/Baustelle" value={sample.projekt} />
                  <DetailRow label="Standort" value={sample.standort ?? "—"} />
                  <DetailRow label="Fachbereich" value={sample.fachbereich} />
                  <DetailRow label="Probenart" value={sample.probenart} />
                  <DetailRow label="Entnahmedatum" value={sample.entnahmedatum} />
                  <DetailRow label="Prüfdatum" value={sample.pruefdatum} />
                  <DetailRow label="Prüfalter" value={sample.pruefalter} />
                  <DetailRow label="Prüfer" value={sample.pruefer} />
                  <DetailRow label="Status" value={sample.status} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Kennzeichnung (optional)</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border p-3 text-center">
                    <QrCode className="size-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {sample.qrCode ? "QR-Code hinterlegt" : "Kein QR-Code (optional)"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border p-3 text-center">
                    <Barcode className="size-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {sample.barcode ? "Barcode hinterlegt" : "Kein Barcode (optional)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TestTubeDiagonal className="size-4 text-muted-foreground" />
                  <SectionTitle>Prüfungen</SectionTitle>
                </div>
                {sample.pruefungen.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {sample.pruefungen.map((pruefung) => (
                      <div
                        key={pruefung.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {pruefung.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              Fällig: {pruefung.faelligkeitsdatum}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <EmployeeAvatar
                            initials={pruefung.pruefer
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          />
                          <Badge
                            variant="secondary"
                            className={pruefungStatusStyles[pruefung.status]}
                          >
                            {pruefung.status}
                          </Badge>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <Link href="/pruefungen" onClick={() => onEnterValues(sample)}>
                              Prüfwerte eintragen
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Noch keine Prüfungen angelegt.
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Prüfwerte und Berechnung folgen in einem späteren Sprint.
                </p>
              </div>

              <RecordList
                title="Anhänge"
                icon={ImageIcon}
                items={sample.anhaenge}
                addLabel="Anhang hinzufügen"
                onAdd={() => onAddAttachment(sample)}
                emptyLabel="Noch keine Anhänge hinterlegt."
              />

              <RecordList
                title="Dokumente"
                icon={FileText}
                items={sample.dokumente}
                addLabel="Dokument hochladen"
                onAdd={() => onAddDocument(sample)}
                emptyLabel="Noch keine Dokumente hinterlegt."
              />

              <RecordList
                title="Lieferscheine"
                icon={Truck}
                items={sample.lieferscheine}
                addLabel="Lieferschein hinzufügen"
                onAdd={() => onAddDeliveryNote(sample)}
                emptyLabel="Noch keine Lieferscheine hinterlegt."
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {sample.historie.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {sample.historie.map((entry) => (
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
                <Button type="button" variant="outline" onClick={() => onEdit(sample)}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/pruefungen" onClick={() => onEnterValues(sample)}>
                    <TestTubeDiagonal className="size-4" />
                    Prüfwerte eintragen
                  </Link>
                </Button>
                {canStart && (
                  <Button type="button" variant="outline" onClick={() => onStart(sample)}>
                    <PlayCircle className="size-4" />
                    In Prüfung starten
                  </Button>
                )}
                {canComplete && (
                  <Button type="button" variant="outline" onClick={() => onComplete(sample)}>
                    <CheckCircle2 className="size-4" />
                    Abschließen
                  </Button>
                )}
                {canReopen && (
                  <Button type="button" variant="outline" onClick={() => onReopen(sample)}>
                    <RotateCcw className="size-4" />
                    Wieder öffnen
                  </Button>
                )}
                {canArchive && (
                  <Button type="button" variant="outline" onClick={() => onArchive(sample)}>
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
                {canReactivate && (
                  <Button type="button" variant="outline" onClick={() => onReactivate(sample)}>
                    <ArchiveRestore className="size-4" />
                    Reaktivieren
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => onDuplicate(sample)}>
                  <Copy className="size-4" />
                  Duplizieren
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="col-span-2"
                  onClick={() => onDelete(sample)}
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
