import { projectRepository } from "@/lib/repositories/projectRepository";
import { firestoreProjectService } from "@/lib/firebase/services/firestoreProjectService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { IProjectService } from "@/lib/interfaces/IProjectService";
import type { Project } from "@/types/project";

// Facade: branch je nach NEXT_PUBLIC_DATA_SOURCE zwischen dem synchronen
// Mock-Repository und der echten Firestore-Implementierung. Aufrufer (Hook,
// UI) kennen nur diese IProjectService-Signatur und wissen nicht, welche
// Quelle gerade aktiv ist – siehe docs/architecture/data-access-layer.md und
// docs/firebase/project-firestore-slice.md.
function generateMockProjectId(): string {
  return `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const projectService: IProjectService = {
  async getProjects() {
    if (isFirestoreDataSource) {
      return firestoreProjectService.getProjects(await resolveActiveCompanyId());
    }
    return projectRepository.getAll();
  },

  async getProjectById(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.getProjectById(await resolveActiveCompanyId(), id);
    }
    return projectRepository.getById(id);
  },

  async createProject(input) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.createProject(await resolveActiveCompanyId(), input);
    }
    const project: Project = { ...input, id: generateMockProjectId() };
    return projectRepository.create(project);
  },

  async updateProject(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.updateProject(await resolveActiveCompanyId(), id, changes);
    }
    return projectRepository.update(id, changes);
  },

  async pauseProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.pauseProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.update(id, { status: "Pausiert" });
  },

  async continueProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.continueProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.update(id, { status: "Aktiv" });
  },

  async completeProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.completeProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.update(id, { status: "Abgeschlossen" });
  },

  async reopenProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.reopenProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.update(id, { status: "Aktiv" });
  },

  async archiveProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.archiveProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.archive(id);
  },

  async reactivateProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.reactivateProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.restore(id);
  },

  async removeProject(id) {
    if (isFirestoreDataSource) {
      return firestoreProjectService.removeProject(await resolveActiveCompanyId(), id);
    }
    return projectRepository.remove(id);
  },
};
