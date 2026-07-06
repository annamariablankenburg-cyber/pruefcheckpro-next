import { FileText, History, TestTubeDiagonal } from "lucide-react";

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SampleStatusBadge } from "@/components/shared/SampleStatusBadge";
import type { Sample } from "@/types/sample";

interface SampleDetailDrawerProps {
  sample: Sample | null;
  onOpenChange: (open: boolean) => void;
}

const pruefwertePlatzhalter = ["Maße", "Bruchlast", "Druckfestigkeit", "Mittelwert", "Bemerkung"];

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

export function SampleDetailDrawer({ sample, onOpenChange }: SampleDetailDrawerProps) {
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
                  <DetailRow label="Projekt/Baustelle" value={sample.projekt} />
                  <DetailRow label="Kunde" value={sample.kunde} />
                  <DetailRow label="Fachbereich" value={sample.fachbereich} />
                  <DetailRow label="Prüfung" value={sample.pruefverfahren} />
                  <DetailRow label="Prüfer" value={sample.pruefer} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Termine</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Entnahmedatum" value={sample.entnahmedatum} />
                  <DetailRow label="Prüfdatum" value={sample.pruefdatum} />
                  <DetailRow label="Prüfalter" value={sample.pruefalter} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TestTubeDiagonal className="size-4 text-muted-foreground" />
                  <SectionTitle>Prüfwerte</SectionTitle>
                </div>
                <div className="rounded-xl border border-dashed border-border p-4">
                  <div className="divide-y divide-border">
                    {pruefwertePlatzhalter.map((label) => (
                      <DetailRow key={label} label={label} value="—" />
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Noch keine Werte erfasst. Berechnung folgt in einem späteren Sprint.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <SectionTitle>Dokumente</SectionTitle>
                </div>
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Noch keine Dokumente hinterlegt.
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Noch keine Historie vorhanden.
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
