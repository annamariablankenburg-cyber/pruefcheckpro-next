"use client";

import { useState } from "react";
import { Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSamples } from "@/hooks/useSamples";
import type { NewReportInput } from "@/lib/interfaces/IReportService";
import type { ReportFormat, ReportLanguage, ReportTemplate, Report } from "@/types/report";

const formatOptions: ReportFormat[] = ["PDF", "Excel", "PDF & Excel"];
const spracheOptions: ReportLanguage[] = ["Deutsch", "Englisch"];
const berichtstypOptions: ReportTemplate[] = [
  "Standard-Prüfbericht",
  "Laborbericht",
  "Prüfprotokoll",
  "Baustellenbericht",
  "Kundenbericht",
  "Kompaktbericht",
];

interface ReportFormState {
  titel: string;
  berichtstyp: ReportTemplate;
  sampleId: string;
  format: ReportFormat;
  ansprechpartner: string;
  vorlage: string;
  sprache: ReportLanguage;
  bemerkungen: string;
}

const emptyFormState: ReportFormState = {
  titel: "",
  berichtstyp: berichtstypOptions[0],
  sampleId: "",
  format: formatOptions[0],
  ansprechpartner: "",
  vorlage: "",
  sprache: spracheOptions[0],
  bemerkungen: "",
};

interface NewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewReportInput) => Promise<Report>;
  onCreated?: (report: Report) => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function generateBerichtsnummer(): string {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-4);
  return `PRB-${year}-${suffix}`;
}

const requiredFields: Array<{ key: keyof ReportFormState; label: string }> = [
  { key: "titel", label: "Berichtstitel" },
  { key: "sampleId", label: "Probe" },
];

// Bericht gehört immer zu einer bestehenden Probe (read-only Zugriff über
// useSamples – kein eigener/paralleler Datenbestand). projekt/kunde/
// projectId/customerId/fachbereich/standort/pruefungen werden daraus
// abgeleitet statt frei eingegeben, damit keine widersprüchlichen IDs/Namen
// entstehen (siehe docs/firebase/report-firestore-slice.md).
export function NewReportDialog({ open, onOpenChange, onCreate, onCreated }: NewReportDialogProps) {
  const [form, setForm] = useState<ReportFormState>(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { activeSamples, loading: samplesLoading, error: samplesError, refreshSamples } = useSamples();

  const selectedSample = activeSamples.find((sample) => sample.id === form.sampleId);

  function update<K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetAndClose() {
    setForm(emptyFormState);
    setErrorMessage(null);
    onOpenChange(false);
  }

  async function handleSubmit() {
    setErrorMessage(null);

    if (samplesError) {
      setErrorMessage("Proben konnten nicht geladen werden. Bitte erneut versuchen.");
      return;
    }

    const missingField = requiredFields.find(({ key }) => form[key].toString().trim() === "");
    if (missingField) {
      setErrorMessage(`Bitte „${missingField.label}“ ausfüllen.`);
      return;
    }

    const sample = activeSamples.find((candidate) => candidate.id === form.sampleId);
    if (!sample) {
      setErrorMessage("Bitte eine gültige Probe auswählen.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toLocaleDateString("de-DE");
      const input: NewReportInput = {
        titel: form.titel,
        berichtsnummer: generateBerichtsnummer(),
        berichtstyp: form.berichtstyp,
        format: form.format,
        projekt: sample.projekt,
        projectId: sample.projectId,
        kunde: sample.kunde,
        customerId: sample.customerId,
        standort: sample.standort,
        probeId: sample.id,
        fachbereich: sample.fachbereich,
        pruefer: sample.pruefer,
        bearbeiter: sample.pruefer,
        ansprechpartner: form.ansprechpartner || undefined,
        vorlage: form.vorlage || undefined,
        sprache: form.sprache,
        erstelltAm: now,
        status: "Entwurf",
        pruefungen: sample.pruefungen.map((pruefung) => ({
          id: pruefung.id,
          name: pruefung.name,
          included: true,
        })),
        fotos: [],
        dokumente: [],
        lieferscheine: [],
        bemerkungen: form.bemerkungen,
        unterschriften: [
          { rolle: "Prüfer", name: sample.pruefer, signiert: false },
          { rolle: "Laborleiter", name: "—", signiert: false },
          { rolle: "Freigabe", name: "—", signiert: false },
        ],
        historie: [{ message: "Bericht angelegt.", timestamp: now }],
        emailStatus: "Noch nicht versendet",
        emailHistory: [],
      };
      const created = await onCreate(input);
      onCreated?.(created);
      resetAndClose();
    } catch {
      setErrorMessage("Bericht konnte nicht angelegt werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && (next ? onOpenChange(next) : resetAndClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Neuer Bericht</DialogTitle>
          <DialogDescription>Lege die Stammdaten für den Prüfbericht an.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Berichtstitel</FieldLabel>
            <Input
              value={form.titel}
              onChange={(event) => update("titel", event.target.value)}
              placeholder="z. B. Prüfbericht – Betonwürfel Druckfestigkeit"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Berichtstyp</FieldLabel>
              <Select
                value={form.berichtstyp}
                onValueChange={(value) => update("berichtstyp", value as ReportTemplate)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {berichtstypOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probe</FieldLabel>
              {samplesError ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive">
                  <span>Laden fehlgeschlagen.</span>
                  <Button type="button" variant="outline" size="sm" onClick={refreshSamples}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.sampleId}
                  onValueChange={(value) => update("sampleId", value)}
                  disabled={samplesLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={samplesLoading ? "Proben werden geladen…" : "Probe auswählen"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSamples.map((sample) => (
                      <SelectItem key={sample.id} value={sample.id}>
                        {sample.id} — {sample.bezeichnung}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Projekt/Baustelle</FieldLabel>
              <div className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                {samplesLoading ? "Wird geladen…" : (selectedSample?.projekt ?? "Wird aus der Probe übernommen")}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Kunde</FieldLabel>
              <div className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                {samplesLoading ? "Wird geladen…" : (selectedSample?.kunde ?? "Wird aus der Probe übernommen")}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Ansprechpartner</FieldLabel>
              <Input
                value={form.ansprechpartner}
                onChange={(event) => update("ansprechpartner", event.target.value)}
                placeholder="Abweichend vom Kundenstamm, optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Vorlage</FieldLabel>
              <Input
                value={form.vorlage}
                onChange={(event) => update("vorlage", event.target.value)}
                placeholder="z. B. Standardvorlage 2026"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Format</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("format", option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium outline-none transition-[background-color,border-color,color,transform] duration-200 ease-(--ease-out-soft) focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-[0.97]",
                    form.format === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>Sprache</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {spracheOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("sprache", option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium outline-none transition-[background-color,border-color,color,transform] duration-200 ease-(--ease-out-soft) focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-[0.97]",
                    form.sprache === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea
              value={form.bemerkungen}
              onChange={(event) => update("bemerkungen", event.target.value)}
              placeholder="Besonderheiten, Hinweise für die Berichtserstellung …"
            />
          </div>

          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              <Info className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
              <Info className="mt-0.5 size-4 shrink-0" />
              Export- und E-Mail-Funktionen werden später an echte Infrastruktur angebunden.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Bericht anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
