import { projectRepository } from "@/lib/repositories/projectRepository";
import type { IProjectService } from "@/lib/interfaces/IProjectService";

export const projectService: IProjectService = {
  getProjects() {
    return projectRepository.getAll();
  },
  getProjectById(id) {
    return projectRepository.getById(id);
  },
  createProject(project) {
    return projectRepository.create(project);
  },
  updateProject(id, changes) {
    return projectRepository.update(id, changes);
  },
  archiveProject(id) {
    return projectRepository.archive(id);
  },
  restoreProject(id) {
    return projectRepository.restore(id);
  },
  removeProject(id) {
    return projectRepository.remove(id);
  },
};
