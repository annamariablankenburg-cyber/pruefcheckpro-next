import { Building2, Mail, Phone } from "lucide-react";

import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { customers } from "@/config/customers";

interface CustomerContactPreviewProps {
  kunde: string;
  ansprechpartner?: string;
  showCustomer: boolean;
  showContact: boolean;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-foreground">
      <span className="text-muted-foreground">{label}: </span>
      {value}
    </p>
  );
}

export function CustomerContactPreview({
  kunde,
  ansprechpartner,
  showCustomer,
  showContact,
}: CustomerContactPreviewProps) {
  const customer = customers.find((c) => c.name === kunde);
  const contactName = ansprechpartner || customer?.contactPerson || "—";

  if (!showCustomer && !showContact) {
    return (
      <p className="text-xs text-muted-foreground">
        Kundendaten und Ansprechpartner sind für diesen Bericht ausgeblendet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showCustomer && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Building2 className="size-3.5" />
            Kunde
          </div>
          <p className="text-sm font-semibold text-foreground">{kunde}</p>
          {customer ? (
            <>
              <DetailLine label="Kundennummer" value={customer.number} />
              <DetailLine label="Straße" value={customer.street} />
              <DetailLine label="PLZ/Ort" value={`${customer.postalCode} ${customer.city}`} />
              <DetailLine label="Land" value={customer.country ?? "—"} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Keine hinterlegte Kundenadresse gefunden – UI-Vorschau.
            </p>
          )}
        </div>
      )}

      {showContact && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <EmployeeAvatar
              size="sm"
              initials={contactName
                .split(" ")
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            />
            Ansprechpartner
          </div>
          <p className="text-sm font-semibold text-foreground">{contactName}</p>
          <DetailLine label="Funktion" value="Ansprechpartner" />
          {customer ? (
            <>
              <p className="flex items-center gap-1.5 text-sm text-foreground">
                <Mail className="size-3.5 text-muted-foreground" />
                {customer.email}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-foreground">
                <Phone className="size-3.5 text-muted-foreground" />
                {customer.phone}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Keine Kontaktdaten hinterlegt.</p>
          )}
          <p className="text-xs text-muted-foreground/70">Mobilnummer optional – nicht hinterlegt.</p>
        </div>
      )}
    </div>
  );
}
