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
import { dateDEToIsoInput, isoInputToDateDE } from "@/lib/calendar/calendarDates";
import { useSamples } from "@/hooks/useSamples";
import type { NewCalendarEventInput } from "@/lib/interfaces/ICalendarService";
import type { CalendarEvent, CalendarField, CalendarPriority } from "@/types/calendarEvent";

const fieldOptions: CalendarField[] = ["Beton", "Asphalt", "Geotechnik", "Sonstiges"];
const priorityOptions: CalendarPriority[] = ["hoch", "normal", "niedrig"];
// Radix-Select erlaubt keinen leeren Wert; dieser Platzhalter steht für
// "keine Probe" (Standalone-Termin).
const NO_SAMPLE = "__none__";

interface NewCalendarTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Gesetzt = Bearbeitungsmodus für diesen Termin.
  editingEvent?: CalendarEvent | null;
  // Vorbelegtes Datum (DD.MM.YYYY) für neue Termine.
  defaultDate?: string;
  // Gibt true zurück, wenn der Termin gespeichert wurde. Der Dialog schließt
  // sich nur dann; bei false bleibt er offen und zeigt einen Hinweis.
  onSubmit: (input: NewCalendarEventInput) => Promise<boolean>;
}

interface TaskFormState {
  title: string;
  // Wert von <input type="date"> ("YYYY-MM-DD").
  date: string;
  time: string;
  field: CalendarField;
  priority: CalendarPriority;
  // "" = Standalone-Termin ohne Probe.
  sampleId: string;
  pruefer: string;
  description: string;
}

function initialFormState(event: CalendarEvent | null, defaultDate?: string): TaskFormState {
  if (event) {
    return {
      title: event.title,
      date: dateDEToIsoInput(event.date),
      time: event.time,
      field: event.field,
      priority: event.priority ?? "normal",
      sampleId: event.sampleId ?? "",
      pruefer: event.pruefer ?? "",
      description: event.description ?? "",
    };
  }
  return {
    title: "",
    date: defaultDate ? dateDEToIsoInput(defaultDate) : "",
    time: "",
    field: "Beton",
    priority: "normal",
    sampleId: "",
    pruefer: "",
    description: "",
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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize outline-none transition-[background-color,border-color,color,transform] duration-200 ease-(--ease-out-soft) focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
            value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <div className="flex h-9 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
      {value}
    </div>
  );
}

interface CalendarTaskFormProps {
  editingEvent: CalendarEvent | null;
  defaultDate?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewCalendarEventInput) => Promise<boolean>;
}

function CalendarTaskForm({ editingEvent, defaultDate, onOpenChange, onSubmit }: CalendarTaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(() => initialFormState(editingEvent, defaultDate));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { samples, activeSamples, loading: samplesLoading, error: samplesError, refreshSamples } = useSamples();

  // Die verknüpfte Probe wird aus der echten Probenliste gelesen – nie aus
  // Freitext. Ist sie inzwischen archiviert, bleibt sie trotzdem auswählbar,
  // damit ein bestehender Termin nicht stillschweigend seine Verknüpfung verliert.
  const linkedSample = form.sampleId ? samples.find((sample) => sample.id === form.sampleId) : undefined;
  const selectableSamples =
    linkedSample && !activeSamples.some((sample) => sample.id === linkedSample.id)
      ? [...activeSamples, linkedSample]
      : activeSamples;

  function update<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildInput(): NewCalendarEventInput {
    const sample = linkedSample;
    // Testwert-Verweis nur behalten, solange dieselbe Probe verknüpft bleibt.
    const sameSample = (editingEvent?.sampleId ?? undefined) === (sample?.id ?? undefined);
    return {
      title: form.title.trim(),
      date: isoInputToDateDE(form.date),
      time: form.time,
      duration: editingEvent?.duration,
      field: sample ? sample.fachbereich : form.field,
      status: editingEvent?.status ?? "geplant",
      priority: form.priority,
      sampleId: sample?.id,
      bezeichnung: sample?.bezeichnung,
      projectId: sample?.projectId,
      projekt: sample?.projekt,
      kunde: sample?.kunde,
      pruefer: sample ? sample.pruefer : (form.pruefer.trim() || undefined),
      description: form.description.trim() || undefined,
      testValueId: sameSample ? editingEvent?.testValueId : undefined,
      deviceId: editingEvent?.deviceId,
    };
  }

  async function handleSubmit() {
    setErrorMessage(null);

    if (form.title.trim() === "") {
      setErrorMessage("Bitte „Titel“ ausfüllen.");
      return;
    }
    if (!form.date) {
      setErrorMessage("Bitte „Datum“ ausfüllen.");
      return;
    }
    if (!form.time) {
      setErrorMessage("Bitte „Uhrzeit“ ausfüllen.");
      return;
    }
    if (form.sampleId && !linkedSample) {
      setErrorMessage(
        samplesLoading
          ? "Proben werden noch geladen. Bitte kurz warten."
          : "Die verknüpfte Probe ist nicht verfügbar. Bitte eine andere Probe wählen."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await onSubmit(buildInput());
      if (saved) {
        onOpenChange(false);
      } else {
        setErrorMessage("Termin konnte nicht gespeichert werden.");
      }
    } catch {
      setErrorMessage("Termin konnte nicht gespeichert werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldValue = linkedSample ? linkedSample.fachbereich : form.field;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingEvent ? "Termin bearbeiten" : "Neue Kalenderaufgabe"}</DialogTitle>
        <DialogDescription>
          {editingEvent
            ? "Ändere Titel, Termin oder die Probenverknüpfung."
            : "Plane eine Prüfung oder Laboraufgabe. Optional mit einer bestehenden Probe verknüpfen."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Titel</FieldLabel>
          <Input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="z. B. 28-Tage-Prüfung BET-2026-015"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Datum</FieldLabel>
            <Input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Uhrzeit</FieldLabel>
            <Input type="time" value={form.time} onChange={(event) => update("time", event.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel required>Fachbereich</FieldLabel>
          <SegmentedControl
            options={fieldOptions}
            value={fieldValue}
            onChange={(value) => update("field", value)}
            disabled={linkedSample !== undefined}
          />
          {linkedSample && (
            <p className="text-xs text-muted-foreground">Aus der verknüpften Probe übernommen.</p>
          )}
        </div>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <FieldLabel>Probe</FieldLabel>
            {samplesError ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive">
                <span>Proben konnten nicht geladen werden.</span>
                <Button type="button" variant="outline" size="sm" onClick={refreshSamples}>
                  Erneut versuchen
                </Button>
              </div>
            ) : (
              <Select
                value={form.sampleId || NO_SAMPLE}
                onValueChange={(value) => update("sampleId", value === NO_SAMPLE ? "" : value)}
                disabled={samplesLoading}
              >
                <SelectTrigger className="h-9">
                  <SelectValue
                    placeholder={samplesLoading ? "Proben werden geladen…" : "Keine Probe (Standalone-Termin)"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SAMPLE}>Keine Probe (Standalone-Termin)</SelectItem>
                  {selectableSamples.map((sample) => (
                    <SelectItem key={sample.id} value={sample.id}>
                      {sample.id} — {sample.bezeichnung}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Projekt</FieldLabel>
            <ReadOnlyValue value={linkedSample ? linkedSample.projekt : "—"} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Prüfer</FieldLabel>
            {linkedSample ? (
              <ReadOnlyValue value={linkedSample.pruefer} />
            ) : (
              <Input
                value={form.pruefer}
                onChange={(event) => update("pruefer", event.target.value)}
                placeholder="Name des zuständigen Prüfers"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <FieldLabel required>Priorität</FieldLabel>
          <SegmentedControl options={priorityOptions} value={form.priority} onChange={(value) => update("priority", value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Notizen</FieldLabel>
          <Textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Besonderheiten, Hinweise für die Aufgabe …"
          />
        </div>

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
          {editingEvent ? "Speichern" : "Aufgabe anlegen"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function NewCalendarTaskDialog({
  open,
  onOpenChange,
  editingEvent = null,
  defaultDate,
  onSubmit,
}: NewCalendarTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {open && (
          // Formularzustand lebt im Kind und wird pro Öffnen neu initialisiert.
          <CalendarTaskForm
            key={editingEvent?.id ?? "new"}
            editingEvent={editingEvent}
            defaultDate={defaultDate}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
