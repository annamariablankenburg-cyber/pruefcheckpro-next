import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { Project } from "@/types/project";

export interface IProjectService {
  getProjects: GetAll<Project>;
  getProjectById: GetById<Project>;
  createProject: Create<Project>;
  updateProject: Update<Project>;
  archiveProject: StatusTransition<Project>;
  restoreProject: StatusTransition<Project>;
  removeProject: Remove;
}
