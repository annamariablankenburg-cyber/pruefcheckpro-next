"use client";

import { projectService } from "@/lib/services/projectService";
import { useEntityList } from "@/hooks/shared/useEntityList";
import { useSearchAndFilter } from "@/hooks/shared/useSearchAndFilter";
import type { ProjectFilter } from "@/components/shared/ProjectFilters";
import type { Project } from "@/types/project";

export function useProjects() {
  const { items: projects, update, remove, add } = useEntityList<Project>(
    projectService.getProjects(),
    (project) => project.id
  );

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

  function updateProject(id: string, changes: Partial<Project>) {
    update(id, changes);
  }

  function archiveProject(id: string) {
    update(id, { status: "Archiviert" });
  }

  function restoreProject(id: string) {
    update(id, { status: "Aktiv" });
  }

  function removeProject(id: string) {
    remove(id);
  }

  function createProject(project: Project) {
    add(project);
  }

  return {
    projects,
    activeProjects,
    filteredProjects,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    updateProject,
    archiveProject,
    restoreProject,
    removeProject,
    createProject,
  };
}
