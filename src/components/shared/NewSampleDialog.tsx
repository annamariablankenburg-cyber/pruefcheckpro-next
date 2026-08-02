"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCustomers } from "@/hooks/useCustomers";
import { useProjects } from "@/hooks/useProjects";
import type { Sample, SampleField, SampleType } from "@/types/sample";

const pruefalterOptions = ["2 Tage", "7 Tage", "28 Tage", "56 Tage", "eigenes Prüfdatum"] as const;
type PruefalterOption = (typeof pruefalterOptions)[number];
const fachbereichOptions: SampleField[] = ["Beton", "Asphalt", "Geotechnik"];
const probenartOptions: SampleType[] = [
  "Würfel",
  "Prisma",
  "Zylinder",
  "Bohrkern",
  "Asphalt",
  "Boden",
  "Sonstige",
];

interface SampleFormState {
  id: string;
  bezeichnung: string;
  projectId: string;
  fachbereich: SampleField;
  probenart: SampleType;
  entnahmedatum: string;
  pruefer: string;
  pruefalter: PruefalterOption;
  pruefdatum: string;
  standort: string;
  qrCode: boolean;
  barcode: boolean;
}

const emptyFormState: SampleFormState = {
  id: "",
  bezeichnung: "",
  projectId: "",
  fachbereich: fachbereichOptions[0],
  probenart: probenartOptions[0],
  entnahmedatum: "",
  pruefer: "",
  pruefalter: "28 Tage",
  pruefdatum: "",
  standort: "",
  qrCode: false,
  barcode: false,
};

interface NewSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieser Probe.
  sample?: Sample | null;
  // Für die Duplikatsprüfung der Probennummer (siehe handleSubmit).
  samples: Sample[];
  onCreate: (sample: Sample) => Promise<Sample>;
  onUpdate: (id: string, changes: Partial<Sample>) => Promise<Sample | undefined>;
  onSaved?: (sample: Sample, mode: "create" | "edit") => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

const requiredFields: Array<{ key: keyof SampleFormState; label: string }> = [
  { key: "projectId", label: "Projekt/Baustelle" },
  { key: "id", label: "Probennummer" },
  { key: "entnahmedatum", label: "Erstellungsdatum" },
];

export function NewSampleDialog({
  open,
  onOpenChange,
  sample,
  samples,
  onCreate,
  onUpdate,
  onSaved,
}: NewSampleDialogProps) {
  const isEditMode = Boolean(sample);

  const [form, setForm] = useState<SampleFormState>(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read-only Projekt-/Kundenzugriff: beide über die bestehenden Hooks, keine
  // eigene/parallele Liste. Das Projekt bestimmt den Kunden (siehe unten),
  // daher kein separates Kunden-Dropdown.
  const {
    projects,
    activeProjects,
    loading: projectsLoading,
    error: projectsError,
    refreshProjects,
  } = useProjects();
  const {
    customers,
    loading: customersLoading,
    error: customersError,
    refreshCustomers,
  } = useCustomers();

  const refsLoading = projectsLoading || customersLoading;
  const refsError = projectsError || customersError;

  // Dropdown-Optionen: aktive Projekte (nicht archiviert). Ist das Projekt
  // der aktuell bearbeiteten Probe inzwischen archiviert, bleibt es als
  // vorhandene Auswahl sichtbar (sonst würde Bearbeiten ohne Projektwechsel
  // fehlschlagen), ist aber für neue Zuordnungen nicht wählbar.
  const projectOptions = useMemo(() => {
    const options = [...activeProjects];
    if (sample?.projectId && !options.some((project) => project.id === sample.projectId)) {
      const archivedCurrent = projects.find((project) => project.id === sample.projectId);
      if (archivedCurrent) options.push(archivedCurrent);
    }
    return options;
  }, [activeProjects, projects, sample]);

  const selectedProject = projectOptions.find((project) => project.id === form.projectId);

  // Formular bei jedem Öffnen frisch aus der übergebenen Probe (Bearbeiten)
  // oder leer (Neuanlage) befüllen – der Dialog bleibt zwischen Öffnungen
  // gemountet, ein reiner useState-Default würde also nur beim ersten Öffnen
  // greifen.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMessage(null);
    setForm(
      sample
        ? {
            id: sample.id,
            bezeichnung: sample.bezeichnung,
            projectId: sample.projectId ?? "",
            fachbereich: sample.fachbereich,
            probenart: sample.probenart,
            entnahmedatum: sample.entnahmedatum,
            pruefer: sample.pruefer,
            pruefalter: (sample.pruefalter as PruefalterOption | undefined) ?? "28 Tage",
            pruefdatum: sample.pruefdatum,
            standort: sample.standort ?? "",
            qrCode: sample.qrCode ?? false,
            barcode: sample.barcode ?? false,
          }
        : emptyFormState
    );
  }, [open, sample]);

  function update<K extends keyof SampleFormState>(key: K, value: SampleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setErrorMessage(null);

    if (refsError) {
      setErrorMessage("Projekte/Kunden konnten nicht geladen werden. Bitte erneut versuchen.");
      return;
    }

    const missingField = requiredFields.find(({ key }) => form[key].toString().trim() === "");
    if (missingField) {
      setErrorMessage(`Bitte „${missingField.label}“ ausfüllen.`);
      return;
    }

    const project = projects.find((candidate) => candidate.id === form.projectId);
    if (!project) {
      setErrorMessage("Bitte ein gültiges Projekt auswählen.");
      return;
    }
    if (!project.customerId) {
      setErrorMessage("Das gewählte Projekt hat keinen zugeordneten Kunden.");
      return;
    }
    const customer = customers.find((candidate) => candidate.id === project.customerId);
    if (!customer) {
      setErrorMessage("Der zugeordnete Kunde konnte nicht gefunden werden.");
      return;
    }

    if (!isEditMode) {
      const normalizedId = form.id.trim().toLowerCase();
      const isDuplicate = samples.some((existing) => existing.id.trim().toLowerCase() === normalizedId);
      if (isDuplicate) {
        setErrorMessage("Diese Probennummer ist bereits vergeben.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const sharedFields = {
        bezeichnung: form.bezeichnung,
        projekt: project.name,
        projectId: project.id,
        kunde: customer.name,
        customerId: customer.id,
        fachbereich: form.fachbereich,
        probenart: form.probenart,
        entnahmedatum: form.entnahmedatum,
        pruefdatum: form.pruefdatum,
        pruefalter: form.pruefalter,
        standort: form.standort || undefined,
        pruefer: form.pruefer,
        qrCode: form.qrCode,
        barcode: form.barcode,
      };

      if (isEditMode && sample) {
        const updated = await onUpdate(sample.id, sharedFields);
        if (updated) onSaved?.(updated, "edit");
      } else {
        const pruefverfahren =
          form.pruefalter !== "eigenes Prüfdatum"
            ? `${form.pruefalter}-Prüfung`
            : "Prüfung nach individuellem Prüfdatum";
        const newSample: Sample = {
          id: form.id,
          ...sharedFields,
          pruefverfahren,
          status: "Offen",
          pruefungen: [],
          anhaenge: [],
          dokumente: [],
          lieferscheine: [],
          historie: [
            { message: "Probe angelegt.", timestamp: new Date().toLocaleDateString("de-DE") },
          ],
        };
        const created = await onCreate(newSample);
        onSaved?.(created, "create");
      }
      onOpenChange(false);
    } catch {
      setErrorMessage(
        isEditMode ? "Probe konnte nicht aktualisiert werden." : "Probe konnte nicht angelegt werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent key={sample?.id ?? "new"} className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Probe bearbeiten" : "Neue Probe anlegen"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Stammdaten der Probe an."
              : "Erfasse die Stammdaten der Probe."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projekt/Baustelle</FieldLabel>
              {refsError ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive">
                  <span>Laden fehlgeschlagen.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refreshProjects();
                      refreshCustomers();
                    }}
                  >
                    Erneut versuchen
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.projectId}
                  onValueChange={(value) => update("projectId", value)}
                  disabled={refsLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={refsLoading ? "Projekte werden geladen…" : "Projekt auswählen"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.status !== "Aktiv" ? ` (${project.status})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Auftraggeber/Kunde</FieldLabel>
              <div className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                {refsLoading
                  ? "Wird geladen…"
                  : (selectedProject?.customer ?? "Wird automatisch aus dem Projekt übernommen")}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probennummer</FieldLabel>
              <Input
                value={form.id}
                onChange={(event) => update("id", event.target.value)}
                placeholder="z. B. BET-2026-015"
                required
                disabled={isEditMode}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Probenart</FieldLabel>
              <Select value={form.probenart} onValueChange={(value) => update("probenart", value as SampleType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {probenartOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Erstellungsdatum</FieldLabel>
              <Input
                type="date"
                value={form.entnahmedatum}
                onChange={(event) => update("entnahmedatum", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Freie Probenbezeichnung / Sorte</FieldLabel>
              <Input
                value={form.bezeichnung}
                onChange={(event) => update("bezeichnung", event.target.value)}
                placeholder="z. B. Beton C25/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Fachbereich</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {fachbereichOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("fachbereich", option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    form.fachbereich === option
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
            <FieldLabel>Prüfalter</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {pruefalterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("pruefalter", option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    form.pruefalter === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>

            {form.pruefalter === "eigenes Prüfdatum" ? (
              <div className="mt-1 flex flex-col gap-1.5 sm:max-w-xs">
                <FieldLabel>Prüfdatum</FieldLabel>
                <Input
                  type="date"
                  value={form.pruefdatum}
                  onChange={(event) => update("pruefdatum", event.target.value)}
                />
              </div>
            ) : (
              <div className="mt-1 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
                <Info className="mt-0.5 size-4 shrink-0" />
                Kalendereinträge werden automatisch erstellt.
              </div>
            )}
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Entnahmestelle</FieldLabel>
              <Input
                value={form.standort}
                onChange={(event) => update("standort", event.target.value)}
                placeholder="z. B. Baustelle Nord, Achse 3"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Probennehmer</FieldLabel>
              <Input placeholder="Name der entnehmenden Person" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Prüfer</FieldLabel>
              <Input
                value={form.pruefer}
                onChange={(event) => update("pruefer", event.target.value)}
                placeholder="Name des zuständigen Prüfers"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Lagerort</FieldLabel>
              <Input placeholder="z. B. Regal 4, Klimakammer" disabled />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea placeholder="Besonderheiten, Hinweise für die Prüfung …" disabled />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Anhänge</FieldLabel>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <Paperclip className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Dateien hierher ziehen oder auswählen
              </p>
              <Button type="button" variant="outline" size="sm" disabled>
                Datei auswählen
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-sm font-medium text-foreground">Kennzeichnung (optional)</p>
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox
                checked={form.qrCode}
                onCheckedChange={(value) => update("qrCode", value === true)}
              />
              QR-Code generieren
            </label>
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox
                checked={form.barcode}
                onCheckedChange={(value) => update("barcode", value === true)}
              />
              Barcode generieren
            </label>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              <Info className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isEditMode ? "Änderungen speichern" : "Probe anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
