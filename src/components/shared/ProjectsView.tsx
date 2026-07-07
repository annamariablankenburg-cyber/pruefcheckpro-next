"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FlaskConical, FolderKanban, Plus, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { NewProjectDialog } from "@/components/shared/NewProjectDialog";
import { ProjectDetailDrawer } from "@/components/shared/ProjectDetailDrawer";
import { ProjectFilters, type ProjectFilter } from "@/components/shared/ProjectFilters";
import { ProjectTable } from "@/components/shared/ProjectTable";
import { StatCard } from "@/components/shared/StatCard";
import { projects as initialProjects } from "@/config/projects";
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
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("Alle");
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    project: Project;
    type: ConfirmActionType;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Archivierte Projekte erscheinen nie in "Alle" oder anderen Filtern – nur
  // im eigenen "Archiviert"-Filter.
  const activeProjects = useMemo(
    () => projects.filter((project) => project.status !== "Archiviert"),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool = filter === "Archiviert" ? projects.filter((p) => p.status === "Archiviert") : activeProjects;

    return pool.filter((project) => {
      const matchesFilter =
        filter === "Alle" ||
        filter === "Archiviert" ||
        (filter === "Überfällig" ? project.overdue === true : filter === project.status || filter === project.field);

      const matchesSearch =
        query.length === 0 ||
        project.name.toLowerCase().includes(query) ||
        project.customer.toLowerCase().includes(query) ||
        project.address.toLowerCase().includes(query) ||
        project.number.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [projects, activeProjects, search, filter]);

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

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2000);
  }

  function updateProject(id: string, changes: Partial<Project>) {
    setProjects((current) =>
      current.map((project) => (project.id === id ? { ...project, ...changes } : project))
    );
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
        onViewDetails={setDetailProject}
        onEdit={() => {}}
        onViewSamples={() => router.push("/probekoerper")}
        onNewSample={() => router.push("/probekoerper")}
        onAddDeliveryNote={() =>
          showFeedback("Lieferschein-Upload folgt in einem späteren Sprint (nur UI)")
        }
        onOpenCustomer={() => showFeedback("Kundenverwaltung folgt in einem späteren Sprint")}
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
        onEdit={() => {}}
        onViewSamples={() => router.push("/probekoerper")}
        onNewSample={() => router.push("/probekoerper")}
        onAddDeliveryNote={() =>
          showFeedback("Lieferschein-Upload folgt in einem späteren Sprint (nur UI)")
        }
        onOpenCustomer={() => showFeedback("Kundenverwaltung folgt in einem späteren Sprint")}
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

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}
