"use client";

import { useState } from "react";
import { Info, Loader2 } from "lucide-react";

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
import { employeeRoles } from "@/config/employees";
import {
  DEFAULT_EXPIRY_DAYS,
  INVITATION_EXPIRY_OPTIONS,
  InvitationRuleError,
  isPlausibleEmail,
  type InvitationFormValues,
} from "@/lib/invitations/invitationRules";
import type { EmployeeRole } from "@/types/employee";
import type { Invitation } from "@/types/invitation";
import type { CompanyLocationDetail } from "@/types/location";

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  // Aktive Standorte der Standortverwaltung (Wert = ID, Label = Name).
  locations: CompanyLocationDetail[];
  locationsLoading?: boolean;
  locationsError?: string | null;
  // Speichert die Einladung (nur Datensatz!). Muss bei Fehlern werfen; der
  // Dialog schließt nur nach Erfolg.
  onCreate: (values: InvitationFormValues) => Promise<Invitation>;
  onCreated?: (invitation: Invitation) => void;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function InviteForm({
  onOpenChange,
  title,
  description,
  locations,
  locationsLoading,
  locationsError,
  onCreate,
  onCreated,
  isSubmitting,
  onSubmittingChange,
}: Omit<InviteEmployeeDialogProps, "open"> & {
  isSubmitting: boolean;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("Prüfer");
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [expiryDays, setExpiryDays] = useState<number>(DEFAULT_EXPIRY_DAYS);
  const [activateImmediately, setActivateImmediately] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Falls die Standortliste erst nach dem Öffnen geladen wurde oder sich
  // geändert hat, fällt die Auswahl auf den ersten aktiven Standort zurück.
  const selectedLocation =
    locations.find((location) => location.id === locationId) ?? locations[0] ?? null;
  const locationsUnavailable = Boolean(locationsLoading) || Boolean(locationsError);

  async function handleSubmit() {
    if (isSubmitting) return;
    setErrorMessage(null);

    if (name.trim() === "") {
      setErrorMessage("Bitte „Name“ ausfüllen.");
      return;
    }
    if (!isPlausibleEmail(email)) {
      setErrorMessage("Bitte eine gültige E-Mail-Adresse angeben.");
      return;
    }
    if (locationsUnavailable || !selectedLocation) {
      setErrorMessage("Es ist kein aktiver Standort verfügbar. Bitte zuerst einen Standort anlegen.");
      return;
    }

    onSubmittingChange(true);
    try {
      const created = await onCreate({
        name,
        email,
        role,
        locationId: selectedLocation.id,
        location: selectedLocation.name,
        message,
        activateImmediately,
        expiresInDays: expiryDays,
      });
      onCreated?.(created);
      onOpenChange(false);
    } catch (caught) {
      setErrorMessage(
        caught instanceof InvitationRuleError ? caught.message : "Einladung konnte nicht gespeichert werden."
      );
    } finally {
      onSubmittingChange(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Name</FieldLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Sophie Bauer"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>E-Mail</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="sophie@musterlabor.de"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Rolle</FieldLabel>
            <Select value={role} onValueChange={(value) => setRole(value as EmployeeRole)} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {employeeRoles.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Standort</FieldLabel>
            <Select
              value={selectedLocation?.id ?? ""}
              onValueChange={setLocationId}
              disabled={isSubmitting || locationsUnavailable || locations.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    locationsLoading
                      ? "Standorte werden geladen…"
                      : locationsError
                        ? "Laden fehlgeschlagen"
                        : "Kein aktiver Standort"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border pt-5">
          <FieldLabel>Nachricht</FieldLabel>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Persönliche Nachricht an die eingeladene Person …"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Einladung läuft ab nach</FieldLabel>
            <Select
              value={String(expiryDays)}
              onValueChange={(value) => setExpiryDays(Number(value))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITATION_EXPIRY_OPTIONS.map((option) => (
                  <SelectItem key={option.days} value={String(option.days)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox
                checked={activateImmediately}
                onCheckedChange={(value) => setActivateImmediately(value === true)}
                disabled={isSubmitting}
              />
              Direkt aktivieren nach Annahme
            </label>
          </div>
        </div>

        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            <Info className="mt-0.5 size-4 shrink-0" />
            {errorMessage}
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            Die Einladung wird nur als Datensatz gespeichert. E-Mail-Versand, Einladungslink und Annahme
            folgen später serverseitig; es wird kein Mitarbeiter und kein Konto angelegt.
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || locationsUnavailable}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Einladung speichern
        </Button>
      </DialogFooter>
    </>
  );
}

export function InviteEmployeeDialog({
  open,
  onOpenChange,
  title = "Mitarbeiter einladen",
  description = "Lege eine Einladung mit Rolle und Standort an. Sie wird als Datensatz gespeichert – der E-Mail-Versand wird später serverseitig angebunden.",
  ...rest
}: InviteEmployeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    // ESC, Overlay und Close-Button werden während des Speicherns ignoriert.
    // Der Formularzustand lebt im Kind und wird pro Öffnen neu initialisiert.
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {open && (
          <InviteForm
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            isSubmitting={isSubmitting}
            onSubmittingChange={setIsSubmitting}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
