import {
  Archive,
  FileText,
  FolderKanban,
  History,
  Pencil,
  Receipt,
  Truck,
  Upload,
  UserCheck,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CustomerTypeBadge } from "@/components/shared/CustomerTypeBadge";
import { CustomerStatusBadge } from "@/components/shared/CustomerStatusBadge";
import { RecordList } from "@/components/shared/RecordList";
import type { Customer } from "@/types/customer";

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
  onCreateProject: (customer: Customer) => void;
  onAddInvoice: (customer: Customer) => void;
  onAddDeliveryNote: (customer: Customer) => void;
  onUploadDocument: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onReactivate: (customer: Customer) => void;
  onArchive: (customer: Customer) => void;
}

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

export function CustomerDetailDrawer({
  customer,
  onOpenChange,
  onEdit,
  onCreateProject,
  onAddInvoice,
  onAddDeliveryNote,
  onUploadDocument,
  onDeactivate,
  onReactivate,
  onArchive,
}: CustomerDetailDrawerProps) {
  const status = customer?.status;
  const canDeactivate = status === "Aktiv";
  const canReactivate = status === "Inaktiv" || status === "Archiviert";
  const canArchive = status !== "Archiviert";

  return (
    <Drawer open={customer !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {customer && (
          <>
            <DrawerHeader>
              <DrawerTitle>{customer.name}</DrawerTitle>
              <p className="text-sm text-muted-foreground">{customer.number}</p>
              <div className="flex items-center gap-2">
                <CustomerStatusBadge status={customer.status} />
                <CustomerTypeBadge type={customer.type} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Kundentyp" value={customer.type} />
                  <DetailRow label="USt-ID" value={customer.vatId ?? "—"} />
                  <DetailRow label="Website" value={customer.website ?? "—"} />
                  <DetailRow label="Status" value={customer.status} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Adresse</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Straße" value={customer.street} />
                  <DetailRow label="PLZ / Ort" value={`${customer.postalCode} ${customer.city}`} />
                  <DetailRow label="Land" value={customer.country ?? "—"} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <SectionTitle>Ansprechpartner &amp; Kontakt</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Ansprechpartner" value={customer.contactPerson} />
                  <DetailRow label="E-Mail" value={customer.email} />
                  <DetailRow label="Telefon" value={customer.phone} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted-foreground" />
                  <SectionTitle>{`Projekte (${customer.projects.length})`}</SectionTitle>
                </div>
                {customer.projects.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {customer.projects.map((project) => (
                      <div key={project} className="px-3.5 py-2.5 text-sm text-foreground">
                        {project}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Noch keine Projekte verknüpft.
                  </div>
                )}
              </div>

              <RecordList
                title="Rechnungen"
                icon={Receipt}
                items={customer.invoices}
                addLabel="Rechnung hinzufügen"
                onAdd={() => onAddInvoice(customer)}
                emptyLabel="Noch keine Rechnungen hinterlegt."
              />

              <RecordList
                title="Lieferscheine"
                icon={Truck}
                items={customer.deliveryNotes}
                addLabel="Lieferschein hinzufügen"
                onAdd={() => onAddDeliveryNote(customer)}
                emptyLabel="Noch keine Lieferscheine hinterlegt."
              />

              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="size-3.5" />
                  Dokumente
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {customer.documentsCount}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {customer.history.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {customer.history.map((entry) => (
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
                <Button type="button" variant="outline" onClick={() => onEdit(customer)}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                <Button type="button" variant="outline" onClick={() => onCreateProject(customer)}>
                  <FolderKanban className="size-4" />
                  Projekt erstellen
                </Button>
                <Button type="button" variant="outline" onClick={() => onUploadDocument(customer)}>
                  <Upload className="size-4" />
                  Dokument hochladen
                </Button>
                {canDeactivate && (
                  <Button type="button" variant="outline" onClick={() => onDeactivate(customer)}>
                    <UserX className="size-4" />
                    Deaktivieren
                  </Button>
                )}
                {canReactivate && (
                  <Button type="button" variant="outline" onClick={() => onReactivate(customer)}>
                    <UserCheck className="size-4" />
                    Reaktivieren
                  </Button>
                )}
                {canArchive && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2"
                    onClick={() => onArchive(customer)}
                  >
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
