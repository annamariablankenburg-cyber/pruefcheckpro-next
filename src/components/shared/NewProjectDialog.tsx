"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCustomers } from "@/hooks/useCustomers";
import type { NewProjectInput } from "@/lib/interfaces/IProjectService";
import type { Project, ProjectField } from "@/types/project";

const fieldOptions: ProjectField[] = ["Beton", "Asphalt", "Geotechnik", "Mehrere"];

interface ProjectFormState {
  name: string;
  number: string;
  customerId: string;
  address: string;
  field: ProjectField;
  startDate: string;
  dueDate: string;
  projectLead: string;
  contactPerson: string;
  phone: string;
  email: string;
  orderNumber: string;
  notes: string;
}

const emptyFormState: ProjectFormState = {
  name: "",
  number: "",
  customerId: "",
  address: "",
  field: fieldOptions[0],
  startDate: "",
  dueDate: "",
  projectLead: "",
  contactPerson: "",
  phone: "",
  email: "",
  orderNumber: "",
  notes: "",
};

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Wenn gesetzt, öffnet sich der Dialog im Bearbeiten-Modus, vorbefüllt mit
  // den Daten dieses Projekts.
  project?: Project | null;
  // Für die Duplikatsprüfung der Projektnummer (siehe handleSubmit).
  projects: Project[];
  onCreate: (input: NewProjectInput) => Promise<Project>;
  onUpdate: (id: string, changes: Partial<Project>) => Promise<Project | undefined>;
  onSaved?: (project: Project, mode: "create" | "edit") => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function initialsFromName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "?";
}

const requiredFields: Array<{ key: keyof ProjectFormState; label: string }> = [
  { key: "name", label: "Projektname" },
  { key: "number", label: "Projektnummer" },
  { key: "customerId", label: "Kunde" },
  { key: "address", label: "Baustelle / Adresse" },
  { key: "startDate", label: "Startdatum" },
  { key: "dueDate", label: "Fällig bis" },
  { key: "projectLead", label: "Projektleiter" },
];

export function NewProjectDialog({
  open,
  onOpenChange,
  project,
  projects,
  onCreate,
  onUpdate,
  onSaved,
}: NewProjectDialogProps) {
  const isEditMode = Boolean(project);

  const [form, setForm] = useState<ProjectFormState>(emptyFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read-only Kundenzugriff: Kunden für das Dropdown kommen über den
  // bestehenden Kunden-Hook (Mock oder Firestore, siehe useCustomers), keine
  // eigene/parallele Kundenliste. Keine Schreibzugriffe auf Kundendaten.
  const {
    customers,
    activeCustomers,
    loading: customersLoading,
    error: customersError,
    refreshCustomers,
  } = useCustomers();

  // Dropdown-Optionen: aktive/inaktive Kunden (nicht archiviert). Ist der
  // Kunde des aktuell bearbeiteten Projekts inzwischen archiviert, bleibt er
  // als vorhandene Auswahl sichtbar (sonst würde Bearbeiten ohne Kundenwechsel
  // fehlschlagen), aber nicht neu auswählbar für andere Projekte.
  const customerOptions = useMemo(() => {
    const options = [...activeCustomers];
    if (project?.customerId && !options.some((customer) => customer.id === project.customerId)) {
      const archivedCurrent = customers.find((customer) => customer.id === project.customerId);
      if (archivedCurrent) options.push(archivedCurrent);
    }
    return options;
  }, [activeCustomers, customers, project]);

  // Formular bei jedem Öffnen frisch aus dem übergebenen Projekt (Bearbeiten)
  // oder leer (Neuanlage) befüllen – der Dialog bleibt zwischen Öffnungen
  // gemountet, ein reiner useState-Default würde also nur beim ersten Öffnen
  // greifen.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorMessage(null);
    setForm(
      project
        ? {
            name: project.name,
            number: project.number,
            customerId: project.customerId ?? "",
            address: project.address,
            field: project.field,
            startDate: project.startDate,
            dueDate: project.dueDate,
            projectLead: project.projectLead,
            contactPerson: project.contactPerson ?? "",
            phone: project.phone ?? "",
            email: project.email ?? "",
            orderNumber: project.orderNumber ?? "",
            notes: project.notes ?? "",
          }
        : emptyFormState
    );
  }, [open, project]);

  function update<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setErrorMessage(null);

    if (customersError) {
      setErrorMessage("Kunden konnten nicht geladen werden. Bitte erneut versuchen.");
      return;
    }

    const missingField = requiredFields.find(({ key }) => form[key].toString().trim() === "");
    if (missingField) {
      setErrorMessage(`Bitte „${missingField.label}“ ausfüllen.`);
      return;
    }

    const selectedCustomer = customers.find((customer) => customer.id === form.customerId);
    if (!selectedCustomer) {
      setErrorMessage("Bitte einen gültigen Kunden auswählen.");
      return;
    }

    const normalizedNumber = form.number.trim().toLowerCase();
    const isDuplicateNumber = projects.some(
      (existing) =>
        existing.number.trim().toLowerCase() === normalizedNumber && existing.id !== project?.id
    );
    if (isDuplicateNumber) {
      setErrorMessage("Diese Projektnummer ist bereits vergeben.");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectLeadInitials = initialsFromName(form.projectLead);
      const sharedFields = {
        name: form.name,
        number: form.number,
        customer: selectedCustomer.name,
        customerId: selectedCustomer.id,
        address: form.address,
        field: form.field,
        startDate: form.startDate,
        dueDate: form.dueDate,
        projectLead: form.projectLead,
        projectLeadInitials,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        orderNumber: form.orderNumber || undefined,
        notes: form.notes || undefined,
      };

      if (isEditMode && project) {
        const updated = await onUpdate(project.id, sharedFields);
        if (updated) onSaved?.(updated, "edit");
      } else {
        const input: NewProjectInput = {
          ...sharedFields,
          status: "Aktiv",
          progress: 0,
          sampleCount: 0,
          testCount: 0,
          documentsCount: 0,
          deliveryNotes: [],
          history: [
            { message: "Projekt angelegt.", timestamp: new Date().toLocaleDateString("de-DE") },
          ],
        };
        const created = await onCreate(input);
        onSaved?.(created, "create");
      }
      onOpenChange(false);
    } catch {
      setErrorMessage(
        isEditMode ? "Projekt konnte nicht aktualisiert werden." : "Projekt konnte nicht angelegt werden."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent
        key={project?.id ?? "new"}
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Projekt bearbeiten" : "Neues Projekt"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Passe die Stammdaten des Projekts an."
              : "Erfasse die Stammdaten des Projekts."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Projektname</FieldLabel>
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="z. B. Neubau Wohnanlage Parkblick"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projektnummer</FieldLabel>
              <Input
                value={form.number}
                onChange={(event) => update("number", event.target.value)}
                placeholder="z. B. P-2026-0458"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Kunde</FieldLabel>
              {customersError ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-sm text-destructive">
                  <span>Kunden konnten nicht geladen werden.</span>
                  <Button type="button" variant="outline" size="sm" onClick={refreshCustomers}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.customerId}
                  onValueChange={(value) => update("customerId", value)}
                  disabled={customersLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={customersLoading ? "Kunden werden geladen…" : "Kunde auswählen"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.status !== "Aktiv" ? ` (${customer.status})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel required>Baustelle / Adresse</FieldLabel>
              <Input
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="z. B. Parkstraße 15, Stuttgart"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Startdatum</FieldLabel>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Projektleiter</FieldLabel>
              <Input
                value={form.projectLead}
                onChange={(event) => update("projectLead", event.target.value)}
                placeholder="Name des Projektleiters"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel required>Fachbereich</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {fieldOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => update("field", option)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    form.field === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Fällig bis</FieldLabel>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Ansprechpartner</FieldLabel>
              <Input
                value={form.contactPerson}
                onChange={(event) => update("contactPerson", event.target.value)}
                placeholder="Name der Ansprechperson"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Telefonnummer</FieldLabel>
              <Input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+49 …"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>E-Mail</FieldLabel>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="kontakt@kunde.de"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <FieldLabel>Auftragsnummer</FieldLabel>
              <Input
                value={form.orderNumber}
                onChange={(event) => update("orderNumber", event.target.value)}
                placeholder="z. B. AB-2026-0092"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Notizen</FieldLabel>
            <Textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Besonderheiten zum Projekt …"
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
              Projekt wird später mit Proben, Lieferscheinen und Prüfungen verknüpft.
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
            {isEditMode ? "Änderungen speichern" : "Projekt anlegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
