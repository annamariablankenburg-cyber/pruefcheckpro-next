import type { Project } from "@/types/project";

// Eingabeform für Neuanlagen: die id wird von der jeweiligen Implementierung
// vergeben (Firestore: Dokument-ID via addDoc, Mock: generierte ID) – siehe
// docs/firebase/project-firestore-slice.md. Die Projektnummer (`number`)
// ist ein reines Stammdatenfeld und bleibt davon unberührt.
export type NewProjectInput = Omit<Project, "id">;

// Bewusst eigene, Promise-basierte Signaturen nur für diese Domäne (statt der
// synchronen Bausteine aus src/lib/interfaces/base.ts), analog zu
// ICustomerService: Projekte sind der zweite Vertical Slice mit echter
// Firestore-Anbindung. Alle anderen Domänen bleiben unverändert synchron.
// Siehe docs/architecture/data-access-layer.md.
export interface IProjectService {
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  createProject(input: NewProjectInput): Promise<Project>;
  updateProject(id: string, changes: Partial<Project>): Promise<Project | undefined>;
  pauseProject(id: string): Promise<Project | undefined>;
  continueProject(id: string): Promise<Project | undefined>;
  completeProject(id: string): Promise<Project | undefined>;
  reopenProject(id: string): Promise<Project | undefined>;
  archiveProject(id: string): Promise<Project | undefined>;
  reactivateProject(id: string): Promise<Project | undefined>;
  removeProject(id: string): Promise<boolean>;
}
