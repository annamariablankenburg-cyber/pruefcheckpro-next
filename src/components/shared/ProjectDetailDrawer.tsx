import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  FileText,
  FlaskConical,
  History,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { DeliveryNoteList } from "@/components/shared/DeliveryNoteList";
import { ProjectFieldBadge } from "@/components/shared/ProjectFieldBadge";
import { ProjectStatusBadge } from "@/components/shared/ProjectStatusBadge";
import type { Project } from "@/types/project";

interface ProjectDetailDrawerProps {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (project: Project) => void;
  onViewSamples: (project: Project) => void;
  onNewSample: (project: Project) => void;
  onAddDeliveryNote: (project: Project) => void;
  onOpenCustomer: (project: Project) => void;
  onPause: (project: Project) => void;
  onResume: (project: Project) => void;
  onComplete: (project: Project) => void;
  onReopen: (project: Project) => void;
  onArchive: (project: Project) => void;
  onReactivate: (project: Project) => void;
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

export function ProjectDetailDrawer({
  project,
  onOpenChange,
  onEdit,
  onViewSamples,
  onNewSample,
  onAddDeliveryNote,
  onOpenCustomer,
  onPause,
  onResume,
  onComplete,
  onReopen,
  onArchive,
  onReactivate,
}: ProjectDetailDrawerProps) {
  const status = project?.status;
  const canPause = status === "Aktiv";
  const canResume = status === "Pausiert";
  const canComplete = status === "Aktiv" || status === "Pausiert";
  const canReopen = status === "Abgeschlossen";
  const canArchive = status !== "Archiviert";
  const canReactivate = status === "Archiviert";

  return (
    <Drawer open={project !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {project && (
          <>
            <DrawerHeader>
              <DrawerTitle>{project.name}</DrawerTitle>
              <p className="text-sm text-muted-foreground">{project.number}</p>
              <div className="flex items-center gap-2">
                <ProjectStatusBadge status={project.status} overdue={project.overdue} />
                <ProjectFieldBadge field={project.field} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <SectionTitle>Stammdaten</SectionTitle>
                <div className="divide-y divide-border">
                  <DetailRow label="Kunde" value={project.customer} />
                  <DetailRow label="Adresse / Baustelle" value={project.address} />
                  <DetailRow label="Ansprechpartner" value={project.contactPerson ?? "—"} />
                  <DetailRow label="Projektleiter" value={project.projectLead} />
                  <DetailRow label="Fachbereiche" value={project.field} />
                  <DetailRow label="Status" value={project.status} />
                  <DetailRow label="Startdatum" value={project.startDate} />
                  <DetailRow label="Fällig bis" value={project.dueDate} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>Fortschritt</SectionTitle>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="h-2 flex-1" />
                  <span className="text-sm font-semibold text-foreground">
                    {project.progress}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FlaskConical className="size-3.5" />
                    Proben
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {project.sampleCount}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5" />
                    Prüfungen
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">{project.testCount}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="size-3.5" />
                    Dokumente
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {project.documentsCount}
                  </p>
                </div>
              </div>

              <DeliveryNoteList
                notes={project.deliveryNotes}
                onAdd={() => onAddDeliveryNote(project)}
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <SectionTitle>Verlauf / Historie</SectionTitle>
                </div>
                {project.history.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {project.history.map((entry) => (
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
                <Button type="button" variant="outline" onClick={() => onEdit(project)}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                <Button type="button" variant="outline" onClick={() => onViewSamples(project)}>
                  <FlaskConical className="size-4" />
                  Proben anzeigen
                </Button>
                <Button type="button" variant="outline" onClick={() => onNewSample(project)}>
                  <Plus className="size-4" />
                  Neue Probe
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenCustomer(project)}>
                  <Users className="size-4" />
                  Kunden öffnen
                </Button>
                {canPause && (
                  <Button type="button" variant="outline" onClick={() => onPause(project)}>
                    <Pause className="size-4" />
                    Pausieren
                  </Button>
                )}
                {canResume && (
                  <Button type="button" variant="outline" onClick={() => onResume(project)}>
                    <Play className="size-4" />
                    Projekt fortsetzen
                  </Button>
                )}
                {canComplete && (
                  <Button type="button" variant="outline" onClick={() => onComplete(project)}>
                    <CheckCircle2 className="size-4" />
                    Abschließen
                  </Button>
                )}
                {canReopen && (
                  <Button type="button" variant="outline" onClick={() => onReopen(project)}>
                    <RotateCcw className="size-4" />
                    Wieder öffnen
                  </Button>
                )}
                {canArchive && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="col-span-2"
                    onClick={() => onArchive(project)}
                  >
                    <Archive className="size-4" />
                    Archivieren
                  </Button>
                )}
                {canReactivate && (
                  <Button
                    type="button"
                    variant="outline"
                    className="col-span-2"
                    onClick={() => onReactivate(project)}
                  >
                    <ArchiveRestore className="size-4" />
                    Reaktivieren
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
