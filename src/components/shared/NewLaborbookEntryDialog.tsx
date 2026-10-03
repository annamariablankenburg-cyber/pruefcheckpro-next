"use client";

import { useState } from "react";
import { Info, Loader2, Paperclip } from "lucide-react";

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
import { dateDEToIsoInput, isoInputToDateDE } from "@/lib/calendar/calendarDates";
import type { LaborbookFormValues } from "@/lib/laborbook/laborbookEntries";
import { useSamples } from "@/hooks/useSamples";
import { useProjects } from "@/hooks/useProjects";
import { useCustomers } from "@/hooks/useCustomers";
import { useDevices } from "@/hooks/useDevices";
import type { Customer } from "@/types/customer";
import type { Device } from "@/types/device";
import type { Project } from "@/types/project";
import type { Sample } from "@/types/sample";
import type { LaborbookEntry, LaborbookField, LaborbookType } from "@/types/laborbook";

const typeOptions: LaborbookType[] = ["Prüfung", "Gerät", "Kalibrierung", "Wartung", "Notiz", "Ereignis"];
const fachbereichOptions: LaborbookField[] = ["Beton", "Asphalt", "Geotechnik"];

// Radix-Select erlaubt keine leeren Werte. NONE = "keine Angabe",
// LEGACY = bisheriger Freitext ohne verknüpften Datensatz (nur Altdaten).
const NONE = "__none__";
const LEGACY = "__legacy__";

interface NewLaborbookEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Gesetzt = Bearbeitungsmodus für diesen Eintrag.
  entry?: LaborbookEntry | null;
  // Gibt true zurück, wenn gespeichert wurde. Bei false bleibt der Dialog offen.
  onSubmit: (values: LaborbookFormValues) => Promise<boolean>;
}

interface LaborbookFormState {
  typ: LaborbookType;
  datum: string;
  uhrzeit: string;
  titel: string;
  beschreibung: string;
  mitarbeiter: string;
  fachbereich: LaborbookField | "";
  projectId: string;
  customerId: string;
  probeId: string;
  deviceId: string;
}

interface LegacyTexts {
  projekt?: string;
  kunde?: string;
  geraet?: string;
}

function initialFormState(entry: LaborbookEntry | null): LaborbookFormState {
  if (!entry) {
    return {
      typ: typeOptions[0],
      datum: "",
      uhrzeit: "",
      titel: "",
      beschreibung: "",
      mitarbeiter: "",
      fachbereich: "",
      projectId: NONE,
      customerId: NONE,
      probeId: NONE,
      deviceId: NONE,
    };
  }
  return {
    typ: entry.typ,
    datum: dateDEToIsoInput(entry.datum),
    uhrzeit: entry.uhrzeit,
    titel: entry.titel,
    beschreibung: entry.beschreibung,
    mitarbeiter: entry.mitarbeiter,
    fachbereich: entry.fachbereich ?? "",
    // Text ohne ID (Altdaten) wird als "Bisheriger Eintrag" weitergeführt.
    projectId: entry.projectId ?? (entry.projekt ? LEGACY : NONE),
    customerId: entry.customerId ?? (entry.kunde ? LEGACY : NONE),
    probeId: entry.probeId ?? NONE,
    deviceId: entry.deviceId ?? (entry.geraet ? LEGACY : NONE),
  };
}

function initialLegacy(entry: LaborbookEntry | null): LegacyTexts {
  return {
    projekt: entry && !entry.projectId ? entry.projekt : undefined,
    kunde: entry && !entry.customerId ? entry.kunde : undefined,
    geraet: entry && !entry.deviceId ? entry.geraet : undefined,
  };
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function ReadOnlyValue({ value, hint }: { value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SelectItemOption {
  value: string;
  label: string;
}

// Liste der wählbaren Datensätze. Ein bereits gesetzter Datensatz bleibt
// auswählbar, auch wenn er inzwischen archiviert ist. Eine unbekannte ID wird
// als "(nicht verfügbar)" angezeigt und blockiert das Speichern.
function itemsWithCurrent<T extends { id: string }>(
  active: T[],
  all: T[],
  currentId: string,
  toOption: (item: T) => SelectItemOption,
  unavailableLabel: string
): SelectItemOption[] {
  const options = active.map(toOption);
  if (currentId === NONE || currentId === LEGACY || active.some((item) => item.id === currentId)) {
    return options;
  }
  const current = all.find((item) => item.id === currentId);
  if (current) return [...options, toOption(current)];
  return [...options, { value: currentId, label: `${currentId} (${unavailableLabel})` }];
}

function RelationSelect({
  label,
  value,
  onValueChange,
  disabled,
  legacyLabel,
  options,
  showLabel = true,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  legacyLabel?: string;
  options: SelectItemOption[];
  // false, wenn die Beschriftung bereits vom umgebenden Feld gezeigt wird.
  showLabel?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {showLabel && <FieldLabel>{label}</FieldLabel>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Keine Angabe</SelectItem>
          {legacyLabel && <SelectItem value={LEGACY}>{legacyLabel}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface LaborbookEntryFormProps {
  entry: LaborbookEntry | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LaborbookFormValues) => Promise<boolean>;
}

function LaborbookEntryForm({ entry, onOpenChange, onSubmit }: LaborbookEntryFormProps) {
  const isEditMode = entry !== null;
  const [form, setForm] = useState<LaborbookFormState>(() => initialFormState(entry));
  const [legacy] = useState<LegacyTexts>(() => initialLegacy(entry));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samplesData = useSamples();
  const projectsData = useProjects();
  const customersData = useCustomers();
  const devicesData = useDevices();

  const relationsLoading =
    samplesData.loading || projectsData.loading || customersData.loading || devicesData.loading;
  const relationsError =
    samplesData.error || projectsData.error || customersData.error || devicesData.error;

  function refreshRelations() {
    samplesData.refreshSamples();
    projectsData.refreshProjects();
    customersData.refreshCustomers();
    devicesData.refreshDevices();
  }

  function update<K extends keyof LaborbookFormState>(key: K, value: LaborbookFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // Eine gewählte Probe leitet Fachbereich, Projekt, Kunde ab. Projekt und Kunde
  // ohne Probe kommen aus eigenen Listen. Ein Kunde kann auch aus dem Projekt
  // stammen, wenn das Projekt einen Kunden hat.
  const sample: Sample | undefined =
    form.probeId !== NONE ? samplesData.samples.find((candidate) => candidate.id === form.probeId) : undefined;
  const projectFromForm: Project | undefined = projectsData.projects.find(
    (candidate) => candidate.id === form.projectId
  );
  const customerFromProject: Customer | undefined = projectFromForm?.customerId
    ? customersData.customers.find((candidate) => candidate.id === projectFromForm.customerId)
    : undefined;
  const customerDerivedFromProject =
    !sample && projectFromForm?.customerId
      ? (customerFromProject?.name ?? projectFromForm.customer)
      : undefined;

  function buildValues(): { values: LaborbookFormValues } | { error: string } {
    const unavailable = "Die gewählte Verknüpfung ist nicht verfügbar. Bitte eine andere Auswahl treffen.";
    const dateDE = isoInputToDateDE(form.datum);
    const beschreibung = form.beschreibung.trim();

    let probeId: string | undefined;
    let fachbereich: LaborbookField | undefined = form.fachbereich || undefined;
    let projectId: string | undefined;
    let projekt: string | undefined;
    let customerId: string | undefined;
    let kunde: string | undefined;

    if (sample) {
      probeId = sample.id;
      fachbereich = sample.fachbereich;
      projectId = sample.projectId;
      projekt = sample.projekt;
      customerId = sample.customerId;
      kunde = sample.kunde;
    } else {
      if (form.probeId !== NONE) return { error: unavailable };
      if (form.projectId === LEGACY) {
        projekt = legacy.projekt;
      } else if (form.projectId !== NONE) {
        if (!projectFromForm) return { error: unavailable };
        projectId = projectFromForm.id;
        projekt = projectFromForm.name;
      }

      if (customerDerivedFromProject !== undefined && projectFromForm) {
        customerId = projectFromForm.customerId;
        kunde = customerDerivedFromProject;
      } else if (form.customerId === LEGACY) {
        kunde = legacy.kunde;
      } else if (form.customerId !== NONE) {
        const customer = customersData.customers.find((candidate) => candidate.id === form.customerId);
        if (!customer) return { error: unavailable };
        customerId = customer.id;
        kunde = customer.name;
      }
    }

    let deviceId: string | undefined;
    let geraet: string | undefined;
    if (form.deviceId === LEGACY) {
      geraet = legacy.geraet;
    } else if (form.deviceId !== NONE) {
      const device: Device | undefined = devicesData.devices.find((candidate) => candidate.id === form.deviceId);
      if (!device) return { error: unavailable };
      deviceId = device.id;
      geraet = `${device.name} (${device.inventoryNumber})`;
    }

    // Alle Schlüssel werden gesetzt (auch als undefined): bei Updates löst das
    // das Entfernen der alten Verknüpfung in Firestore aus.
    return {
      values: {
        typ: form.typ,
        datum: dateDE,
        uhrzeit: form.uhrzeit,
        titel: form.titel.trim() || beschreibung.slice(0, 60),
        beschreibung,
        mitarbeiter: form.mitarbeiter.trim(),
        fachbereich,
        projekt,
        projectId,
        kunde,
        customerId,
        probeId,
        geraet,
        deviceId,
      },
    };
  }

  async function handleSubmit() {
    setErrorMessage(null);

    if (relationsError) {
      setErrorMessage("Verknüpfungsdaten konnten nicht geladen werden. Bitte erneut versuchen.");
      return;
    }
    if (relationsLoading) {
      setErrorMessage("Verknüpfungsdaten werden noch geladen. Bitte kurz warten.");
      return;
    }
    if (!form.datum) {
      setErrorMessage("Bitte „Datum“ ausfüllen.");
      return;
    }
    if (!form.uhrzeit) {
      setErrorMessage("Bitte „Uhrzeit“ ausfüllen.");
      return;
    }
    if (form.beschreibung.trim() === "") {
      setErrorMessage("Bitte „Beschreibung“ ausfüllen.");
      return;
    }
    if (form.mitarbeiter.trim() === "") {
      setErrorMessage("Bitte „Mitarbeiter“ ausfüllen.");
      return;
    }

    const built = buildValues();
    if ("error" in built) {
      setErrorMessage(built.error);
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await onSubmit(built.values);
      if (saved) {
        onOpenChange(false);
      } else {
        setErrorMessage(isEditMode ? "Änderungen konnten nicht gespeichert werden." : "Eintrag konnte nicht angelegt werden.");
      }
    } catch {
      setErrorMessage(isEditMode ? "Änderungen konnten nicht gespeichert werden." : "Eintrag konnte nicht angelegt werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const probeItems = itemsWithCurrent(
    samplesData.activeSamples,
    samplesData.samples,
    form.probeId === NONE ? NONE : form.probeId,
    (item) => ({ value: item.id, label: `${item.id} — ${item.bezeichnung}` }),
    "nicht verfügbar"
  );
  const projectItems = itemsWithCurrent(
    projectsData.activeProjects,
    projectsData.projects,
    form.projectId,
    (item) => ({ value: item.id, label: item.name }),
    "nicht verfügbar"
  );
  const customerItems = itemsWithCurrent(
    customersData.activeCustomers,
    customersData.customers,
    form.customerId,
    (item) => ({ value: item.id, label: item.name }),
    "nicht verfügbar"
  );
  const deviceItems = itemsWithCurrent(
    devicesData.activeDevices,
    devicesData.devices,
    form.deviceId,
    (item) => ({ value: item.id, label: `${item.name} (${item.inventoryNumber})` }),
    "nicht verfügbar"
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Eintrag bearbeiten" : "Neuer Eintrag"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Passe die Daten des Laborbuch-Eintrags an. Verknüpfungen werden aus echten Datensätzen gewählt."
            : "Erfasse einen neuen Laborbuch-Eintrag. Verknüpfungen werden aus echten Datensätzen gewählt."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <FieldLabel required>Typ</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => update("typ", option)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium outline-none transition-[background-color,border-color,color,transform] duration-200 ease-(--ease-out-soft) focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-[0.97]",
                  form.typ === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Datum</FieldLabel>
            <Input type="date" value={form.datum} onChange={(event) => update("datum", event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Uhrzeit</FieldLabel>
            <Input type="time" value={form.uhrzeit} onChange={(event) => update("uhrzeit", event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Titel / Kurzbezeichnung</FieldLabel>
            <Input
              value={form.titel}
              onChange={(event) => update("titel", event.target.value)}
              placeholder="z. B. Druckfestigkeit erfasst"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Beschreibung</FieldLabel>
          <Textarea
            value={form.beschreibung}
            onChange={(event) => update("beschreibung", event.target.value)}
            placeholder="Was wurde durchgeführt oder beobachtet?"
          />
        </div>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Probe</FieldLabel>
            <RelationSelect
              label="Probe"
              showLabel={false}
              value={form.probeId}
              onValueChange={(value) => update("probeId", value)}
              disabled={relationsLoading || Boolean(relationsError)}
              options={probeItems}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Fachbereich</FieldLabel>
            {sample ? (
              <ReadOnlyValue value={sample.fachbereich} hint="Aus der Probe übernommen." />
            ) : (
              <Select
                value={form.fachbereich || NONE}
                onValueChange={(value) => update("fachbereich", value === NONE ? "" : (value as LaborbookField))}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Keine Angabe</SelectItem>
                  {fachbereichOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Projekt/Baustelle</FieldLabel>
            {sample ? (
              <ReadOnlyValue value={sample.projekt} hint="Aus der Probe übernommen." />
            ) : (
              <RelationSelect
                label="Projekt/Baustelle"
                showLabel={false}
                value={form.projectId}
                onValueChange={(value) => update("projectId", value)}
                disabled={relationsLoading || Boolean(relationsError)}
                legacyLabel={legacy.projekt ? `Bisheriger Eintrag: ${legacy.projekt}` : undefined}
                options={projectItems}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Kunde</FieldLabel>
            {sample ? (
              <ReadOnlyValue value={sample.kunde} hint="Aus der Probe übernommen." />
            ) : customerDerivedFromProject !== undefined ? (
              <ReadOnlyValue value={customerDerivedFromProject} hint="Aus dem Projekt übernommen." />
            ) : (
              <RelationSelect
                label="Kunde"
                showLabel={false}
                value={form.customerId}
                onValueChange={(value) => update("customerId", value)}
                disabled={relationsLoading || Boolean(relationsError)}
                legacyLabel={legacy.kunde ? `Bisheriger Eintrag: ${legacy.kunde}` : undefined}
                options={customerItems}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <RelationSelect
              label="Gerät"
              value={form.deviceId}
              onValueChange={(value) => update("deviceId", value)}
              disabled={relationsLoading || Boolean(relationsError)}
              legacyLabel={legacy.geraet ? `Bisheriger Eintrag: ${legacy.geraet}` : undefined}
              options={deviceItems}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Mitarbeiter</FieldLabel>
            <Input
              value={form.mitarbeiter}
              onChange={(event) => update("mitarbeiter", event.target.value)}
              placeholder="Name des zuständigen Mitarbeiters"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Fotos / Dokumente</FieldLabel>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <Paperclip className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Datei-Upload folgt später (nur Metadaten werden gespeichert).</p>
            <Button type="button" variant="outline" size="sm" disabled>
              Datei auswählen
            </Button>
          </div>
        </div>

        {relationsError && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <span>Verknüpfungsdaten konnten nicht geladen werden.</span>
            <Button type="button" variant="outline" size="sm" onClick={refreshRelations}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <Info className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEditMode ? "Änderungen speichern" : "Eintrag anlegen"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function NewLaborbookEntryDialog({ open, onOpenChange, entry = null, onSubmit }: NewLaborbookEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {open && (
          // Formularzustand lebt im Kind und wird pro Öffnen neu initialisiert.
          <LaborbookEntryForm
            key={entry?.id ?? "new"}
            entry={entry}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
