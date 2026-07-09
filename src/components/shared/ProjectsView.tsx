"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FlaskConical, FolderKanban, Plus, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewProjectDialog } from "@/components/shared/NewProjectDialog";
import { ProjectDetailDrawer } from "@/components/shared/ProjectDetailDrawer";
import { ProjectFilters } from "@/components/shared/ProjectFilters";
import { ProjectTable } from "@/components/shared/ProjectTable";
import { StatCard } from "@/components/shared/StatCard";
import { useProjects } from "@/hooks/useProjects";
import type { Project, ProjectStatus } from "@/types/project";

type ConfirmActionType = "pause" | "resume" | "complete" | "reopen" | "archive" | "reactivate";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; nextStatus: ProjectStatus }
> = {
  pause: {
    title: "Projekt pausieren?",
    description:
      "Neue Proben und Prüfungen werden für dieses Projekt vorübergehend deaktiviert.",
    confirmLabel: "Bestätigen",
    nextStatus: "Pausiert",
  },
  resume: {
    title: "Projekt fortsetzen?",
    description:
      "Das Projekt wird wieder aktiviert. Neue Proben, Prüfungen und Termine können anschließend wieder erstellt werden.",
    confirmLabel: "Fortsetzen",
    nextStatus: "Aktiv",
  },
  complete: {
    title: "Projekt abschließen?",
    description:
      "Das Projekt wird als abgeschlossen markiert. Bestehende Berichte und Proben bleiben erhalten.",
    confirmLabel: "Bestätigen",
    nextStatus: "Abgeschlossen",
  },
  reopen: {
    title: "Projekt wieder öffnen?",
    description:
      "Das Projekt wird wieder als aktiv markiert. Bestehende Proben, Prüfungen und Berichte bleiben erhalten.",
    confirmLabel: "Wieder öffnen",
    nextStatus: "Aktiv",
  },
  archive: {
    title: "Projekt archivieren?",
    description:
      "Das Projekt wird aus aktiven Ansichten ausgeblendet, bleibt aber historisch erhalten.",
    confirmLabel: "Bestätigen",
    nextStatus: "Archiviert",
  },
  reactivate: {
    title: "Projekt reaktivieren?",
    description: "Das Projekt wird wieder in den aktiven Ansichten angezeigt.",
    confirmLabel: "Reaktivieren",
    nextStatus: "Aktiv",
  },
};

export function ProjectsView() {
  const router = useRouter();
  const {
    activeProjects,
    filteredProjects,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateProject: updateProjectData,
  } = useProjects();
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    project: Project;
    type: ConfirmActionType;
  } | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = useMemo(
    () => ({
      total: activeProjects.length,
      active: activeProjects.filter((project) => project.status === "Aktiv").length,
      completed: activeProjects.filter((project) => project.status === "Abgeschlossen").length,
      overdue: activeProjects.filter((project) => project.status === "Aktiv" && project.overdue)
        .length,
      samples: activeProjects.reduce((sum, project) => sum + project.sampleCount, 0),
    }),
    [activeProjects]
  );

  function updateProject(id: string, changes: Partial<Project>) {
    updateProjectData(id, changes);
    setDetailProject((current) =>
      current && current.id === id ? { ...current, ...changes } : current
    );
  }

  function handleConfirmAction(project: Project) {
    if (!confirmAction) return;
    updateProject(project.id, { status: confirmCopy[confirmAction.type].nextStatus });
    setConfirmAction(null);
  }

  function openConfirm(project: Project, type: ConfirmActionType) {
    setConfirmAction({ project, type });
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Projekte
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalte Baustellen, Aufträge, Proben und Projektfortschritte.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          Neues Projekt
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={FolderKanban} label="Projekte gesamt" value={kpis.total} />
        <StatCard icon={CheckCircle2} label="Aktiv" value={kpis.active} tone="success" />
        <StatCard icon={CheckCircle2} label="Abgeschlossen" value={kpis.completed} />
        <StatCard icon={TriangleAlert} label="Überfällig" value={kpis.overdue} tone="danger" />
        <StatCard icon={FlaskConical} label="Proben gesamt" value={kpis.samples} />
      </div>

      <ProjectFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      <ProjectTable
        projects={filteredProjects}
        onResetFilters={resetFilters}
        onViewDetails={setDetailProject}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewSamples={() => router.push("/probekoerper")}
        onNewSample={() => router.push("/probekoerper")}
        onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
        onOpenCustomer={() => router.push("/kunden")}
        onPause={(project) => openConfirm(project, "pause")}
        onResume={(project) => openConfirm(project, "resume")}
        onComplete={(project) => openConfirm(project, "complete")}
        onReopen={(project) => openConfirm(project, "reopen")}
        onArchive={(project) => openConfirm(project, "archive")}
        onReactivate={(project) => openConfirm(project, "reactivate")}
      />

      <ProjectDetailDrawer
        project={detailProject}
        onOpenChange={(open) => !open && setDetailProject(null)}
        onEdit={() => showFeedback("Diese Funktion wird später angebunden.")}
        onViewSamples={() => router.push("/probekoerper")}
        onNewSample={() => router.push("/probekoerper")}
        onAddDeliveryNote={() => showFeedback("Diese Funktion wird später angebunden.")}
        onOpenCustomer={() => router.push("/kunden")}
        onPause={(project) => openConfirm(project, "pause")}
        onResume={(project) => openConfirm(project, "resume")}
        onComplete={(project) => openConfirm(project, "complete")}
        onReopen={(project) => openConfirm(project, "reopen")}
        onArchive={(project) => openConfirm(project, "archive")}
        onReactivate={(project) => openConfirm(project, "reactivate")}
      />

      <NewProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <ConfirmActionDialog
        subject={confirmAction?.project ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
