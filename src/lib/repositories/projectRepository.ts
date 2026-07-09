import { projects } from "@/config/projects";
import type { Project } from "@/types/project";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Project>(projects, (project) => project.id);

export const projectRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<Project>);
  },
  restore(id: string) {
    return base.update(id, { status: "Aktiv" } as Partial<Project>);
  },
};
