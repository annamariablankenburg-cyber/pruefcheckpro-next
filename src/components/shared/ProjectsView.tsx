"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  FolderKanban,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { NewProjectDialog } from "@/components/shared/NewProjectDialog";
import { ProjectDetailDrawer } from "@/components/shared/ProjectDetailDrawer";
import { ProjectFilters } from "@/components/shared/ProjectFilters";
import { ProjectTable } from "@/components/shared/ProjectTable";
import { StatCard } from "@/components/shared/StatCard";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types/project";

type ConfirmActionType = "pause" | "resume" | "complete" | "reopen" | "archive" | "reactivate";

const confirmCopy: Record<
  ConfirmActionType,
  { title: string; description: string; confirmLabel: string; successMessage: string }
> = {
  pause: {
    title: "Projekt pausieren?",
    description:
      "Neue Proben und Prüfungen werden für dieses Projekt vorübergehend deaktiviert.",
    confirmLabel: "Bestätigen",
    successMessage: "Projekt pausiert.",
  },
  resume: {
    title: "Projekt fortsetzen?",
    description:
      "Das Projekt wird wieder aktiviert. Neue Proben, Prüfungen und Termine können anschließend wieder erstellt werden.",
    confirmLabel: "Fortsetzen",
    successMessage: "Projekt fortgesetzt.",
  },
  complete: {
    title: "Projekt abschließen?",
    description:
      "Das Projekt wird als abgeschlossen markiert. Bestehende Berichte und Proben bleiben erhalten.",
    confirmLabel: "Bestätigen",
    successMessage: "Projekt abgeschlossen.",
  },
  reopen: {
    title: "Projekt wieder öffnen?",
    description:
      "Das Projekt wird wieder als aktiv markiert. Bestehende Proben, Prüfungen und Berichte bleiben erhalten.",
    confirmLabel: "Wieder öffnen",
    successMessage: "Projekt wieder geöffnet.",
  },
  archive: {
    title: "Projekt archivieren?",
    description:
      "Das Projekt wird aus aktiven Ansichten ausgeblendet, bleibt aber historisch erhalten. Verknüpfte Proben und Berichte werden nicht automatisch gelöscht.",
    confirmLabel: "Bestätigen",
    successMessage: "Projekt archiviert.",
  },
  reactivate: {
    title: "Projekt reaktivieren?",
    description: "Das Projekt wird wieder in den aktiven Ansichten angezeigt.",
    confirmLabel: "Reaktivieren",
    successMessage: "Projekt reaktiviert.",
  },
};

type ProjectDialogState = { mode: "create" } | { mode: "edit"; project: Project } | null;

export function ProjectsView() {
  const router = useRouter();
  const {
    projects,
    activeProjects,
    filteredProjects,
    loading,
    error,
    refreshProjects,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    createProject,
    updateProject,
    pauseProject,
    continueProject,
    completeProject,
    reopenProject,
    archiveProject,
    reactivateProject,
  } = useProjects();
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>(null);
  const [confirmAction, setConfirmAction] = useState<{
    project: Project;
    type: ConfirmActionType;
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);
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

  function applyUpdatedProject(updated: Project | undefined) {
    if (!updated) return;
    setDetailProject((current) => (current && current.id === updated.id ? updated : current));
  }

  async function handleConfirmAction(project: Project) {
    if (!confirmAction || actionPending) return;
    setActionPending(true);
    try {
      let updated: Project | undefined;
      switch (confirmAction.type) {
        case "pause":
          updated = await pauseProject(project.id);
          break;
        case "resume":
          updated = await continueProject(project.id);
          break;
        case "complete":
          updated = await completeProject(project.id);
          break;
        case "reopen":
          updated = await reopenProject(project.id);
          break;
        case "archive":
          updated = await archiveProject(project.id);
          break;
        case "reactivate":
          updated = await reactivateProject(project.id);
          break;
      }
      applyUpdatedProject(updated);
      setConfirmAction(null);
      showFeedback(confirmCopy[confirmAction.type].successMessage);
    } catch {
      showFeedback("Aktion konnte nicht ausgeführt werden.");
    } finally {
      setActionPending(false);
    }
  }

  function openConfirm(project: Project, type: ConfirmActionType) {
    setConfirmAction({ project, type });
  }

  function openEditDialog(project: Project) {
    setProjectDialog({ mode: "edit", project });
  }

  const hasBlockingState = loading || Boolean(error);

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
        <Button
          type="button"
          onClick={() => setProjectDialog({ mode: "create" })}
          disabled={hasBlockingState}
        >
          <Plus className="size-4" />
          Neues Projekt
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="h-[104px] animate-pulse bg-muted/40" />
            ))}
          </div>
          <Card className="h-72 animate-pulse bg-muted/40" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={refreshProjects}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
            onEdit={openEditDialog}
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
        </>
      )}

      <ProjectDetailDrawer
        project={detailProject}
        onOpenChange={(open) => !open && setDetailProject(null)}
        onEdit={openEditDialog}
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

      <NewProjectDialog
        open={projectDialog !== null}
        onOpenChange={(open) => !open && setProjectDialog(null)}
        project={projectDialog?.mode === "edit" ? projectDialog.project : null}
        projects={projects}
        onCreate={createProject}
        onUpdate={updateProject}
        onSaved={(saved, mode) => {
          applyUpdatedProject(saved);
          showFeedback(mode === "edit" ? "Projekt aktualisiert." : "Projekt angelegt.");
        }}
      />

      <ConfirmActionDialog
        subject={confirmAction?.project ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        isLoading={actionPending}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
