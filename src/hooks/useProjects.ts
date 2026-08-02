"use client";

import { useCallback, useEffect, useState } from "react";

import { projectService } from "@/lib/services/projectService";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { ProjectFilter } from "@/components/shared/ProjectFilters";
import type { NewProjectInput } from "@/lib/interfaces/IProjectService";
import type { Project } from "@/types/project";

// Lädt Projekte über projectService (Mock oder Firestore, siehe
// src/config/dataSource.ts) und hält sie als lokalen State. Mutationen laufen
// über den Service (nicht mehr nur über lokalen React-State wie zuvor) und
// aktualisieren den State optimistisch mit dem vom Service zurückgegebenen
// Ergebnis. Fehler bei Mutationen werden bewusst NICHT hier abgefangen,
// sondern an die aufrufende UI (Dialoge, Aktionen) weitergereicht, damit dort
// gezielt reagiert werden kann (Dialog offen lassen, Inline-Fehler zeigen).
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch {
      setError("Projektdaten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lädt die Projektliste beim ersten Mount vom Service (Mock oder Firestore).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProjects();
  }, [refreshProjects]);

  const {
    search,
    setSearch,
    filter,
    setFilter,
    activeItems: activeProjects,
    filteredItems: filteredProjects,
    resetFilters,
  } = useSearchAndFilter<Project, ProjectFilter>(projects, {
    defaultFilter: "Alle",
    archivedFilterValue: "Archiviert",
    isArchived: (project) => project.status === "Archiviert",
    matchesFilter: (project, filterValue) =>
      filterValue === "Überfällig" ? project.overdue === true : filterValue === project.status || filterValue === project.field,
    matchesSearch: (project, query) =>
      project.name.toLowerCase().includes(query) ||
      project.customer.toLowerCase().includes(query) ||
      project.address.toLowerCase().includes(query) ||
      project.number.toLowerCase().includes(query),
  });

  function replaceProject(updated: Project | undefined) {
    if (!updated) return;
    setProjects((current) => current.map((project) => (project.id === updated.id ? updated : project)));
  }

  async function createProject(input: NewProjectInput): Promise<Project> {
    const created = await projectService.createProject(input);
    setProjects((current) => [created, ...current]);
    return created;
  }

  async function updateProject(id: string, changes: Partial<Project>) {
    const updated = await projectService.updateProject(id, changes);
    replaceProject(updated);
    return updated;
  }

  async function pauseProject(id: string) {
    const updated = await projectService.pauseProject(id);
    replaceProject(updated);
    return updated;
  }

  async function continueProject(id: string) {
    const updated = await projectService.continueProject(id);
    replaceProject(updated);
    return updated;
  }

  async function completeProject(id: string) {
    const updated = await projectService.completeProject(id);
    replaceProject(updated);
    return updated;
  }

  async function reopenProject(id: string) {
    const updated = await projectService.reopenProject(id);
    replaceProject(updated);
    return updated;
  }

  async function archiveProject(id: string) {
    const updated = await projectService.archiveProject(id);
    replaceProject(updated);
    return updated;
  }

  async function reactivateProject(id: string) {
    const updated = await projectService.reactivateProject(id);
    replaceProject(updated);
    return updated;
  }

  async function removeProject(id: string) {
    const success = await projectService.removeProject(id);
    if (success) {
      setProjects((current) => current.filter((project) => project.id !== id));
    }
    return success;
  }

  return {
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
    removeProject,
  };
}
