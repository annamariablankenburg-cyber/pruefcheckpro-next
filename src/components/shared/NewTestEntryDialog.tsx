"use client";

import { useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildTestEntryFromSample } from "@/config/testValues";
import { useSamples } from "@/hooks/useSamples";
import type { TestEntry } from "@/types/testValue";

interface NewTestEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Für die "keine doppelte Probe"-Prüfung (siehe handleSubmit).
  testEntries: TestEntry[];
  onCreate: (entry: TestEntry) => Promise<TestEntry>;
  onCreated: (entry: TestEntry) => void;
}

// Kompakter Auswahl-Dialog (bewusst so schlank wie BulkFieldDialog gehalten,
// kein volles Formular): "Neue Prüfung" braucht nur eine gültige Probe – alle
// übrigen Felder (Titel, Fachbereich, Kunde/Projekt-Snapshot, …) werden aus
// der Probe abgeleitet (siehe config/testValues.ts, buildTestEntryFromSample).
export function NewTestEntryDialog({ open, onOpenChange, testEntries, onCreate, onCreated }: NewTestEntryDialogProps) {
  const { activeSamples, loading: samplesLoading, error: samplesError, refreshSamples } = useSamples();
  const [sampleId, setSampleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const existingSampleIds = useMemo(() => new Set(testEntries.map((entry) => entry.sampleId)), [testEntries]);

  // Nur Proben ohne bestehende Prüfung anbieten – archivierte Proben sind
  // über activeSamples bereits ausgeschlossen (siehe useSamples.ts).
  const availableSamples = useMemo(
    () => activeSamples.filter((sample) => !existingSampleIds.has(sample.id)),
    [activeSamples, existingSampleIds]
  );

  async function handleSubmit() {
    setErrorMessage(null);

    if (samplesError) {
      setErrorMessage("Proben konnten nicht geladen werden. Bitte erneut versuchen.");
      return;
    }
    if (!sampleId) {
      setErrorMessage("Bitte eine Probe auswählen.");
      return;
    }
    const sample = availableSamples.find((candidate) => candidate.id === sampleId);
    if (!sample) {
      setErrorMessage("Bitte eine gültige Probe auswählen.");
      return;
    }
    if (existingSampleIds.has(sample.id)) {
      setErrorMessage("Für diese Probe existiert bereits eine Prüfung.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onCreate(buildTestEntryFromSample(sample));
      onCreated(created);
      setSampleId("");
      onOpenChange(false);
    } catch {
      setErrorMessage("Prüfung konnte nicht angelegt werden.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSubmitting) return;
        if (next) setSampleId("");
        setErrorMessage(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Prüfung</DialogTitle>
          <DialogDescription>
            Wähle die Probe, für die eine neue Prüfung angelegt werden soll.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-test-entry-sample" className="text-sm font-medium text-foreground">
            Probe
          </label>
          {samplesError ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive">
              <span>Proben konnten nicht geladen werden.</span>
              <Button type="button" variant="outline" size="sm" onClick={refreshSamples}>
                Erneut versuchen
              </Button>
            </div>
          ) : (
            <Select value={sampleId} onValueChange={setSampleId} disabled={samplesLoading}>
              <SelectTrigger id="new-test-entry-sample" className="h-9">
                <SelectValue
                  placeholder={samplesLoading ? "Proben werden geladen…" : "Probe auswählen"}
                />
              </SelectTrigger>
              <SelectContent>
                {availableSamples.map((sample) => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.id} — {sample.bezeichnung}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!samplesLoading && !samplesError && availableSamples.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Alle aktiven Proben haben bereits eine Prüfung.
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <Info className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || availableSamples.length === 0}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Prüfung anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
