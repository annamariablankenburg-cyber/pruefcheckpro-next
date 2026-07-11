import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProjectActionsMenu } from "@/components/shared/ProjectActionsMenu";
import { ProjectFieldBadge } from "@/components/shared/ProjectFieldBadge";
import { ProjectStatusBadge } from "@/components/shared/ProjectStatusBadge";
import type { Project } from "@/types/project";

interface ProjectTableActionHandlers {
  onViewDetails: (project: Project) => void;
  onEdit: (project: Project) => void;
  onViewSamples: (project: Project) => void;
  onNewSample: (project: Project) => void;
  onAddDeliveryNote: (project: Project) => void;
  onOpenCustomer: (project: Project) => void;
  onPause: (project: Project) => void;
  onResume: (project: Project) => void;
  onComplete: (project: Project) => void;
  onReopen: (project: Project) => void;
  onArchive: (project: Project) => void;
  onReactivate: (project: Project) => void;
}

interface ProjectTableProps extends ProjectTableActionHandlers {
  projects: Project[];
  onResetFilters?: () => void;
}

function ProjectProgress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={value} className="h-1.5 w-20" />
      <span className="text-xs font-medium text-muted-foreground">{value}%</span>
    </div>
  );
}

export function ProjectTable({ projects, onResetFilters, ...handlers }: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <EmptyState message="Keine Projekte gefunden. Passe Suche oder Filter an." onReset={onResetFilters} />
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 whitespace-nowrap">Projekt</th>
                <th className="px-4 py-3 whitespace-nowrap">Kunde</th>
                <th className="px-4 py-3 whitespace-nowrap">Baustelle / Adresse</th>
                <th className="px-4 py-3 whitespace-nowrap">Fachbereich</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Startdatum</th>
                <th className="px-4 py-3 whitespace-nowrap">Fällig bis</th>
                <th className="px-4 py-3 whitespace-nowrap">Proben</th>
                <th className="px-4 py-3 whitespace-nowrap">Prüfungen</th>
                <th className="px-4 py-3 whitespace-nowrap">Fortschritt</th>
                <th className="px-4 py-3 whitespace-nowrap">Projektleiter</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlers.onViewDetails(project)}
                      className="text-left"
                    >
                      <span className="block font-medium text-foreground hover:underline">
                        {project.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {project.number}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {project.customer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {project.address}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ProjectFieldBadge field={project.field} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ProjectStatusBadge status={project.status} overdue={project.overdue} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {project.startDate}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {project.dueDate}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {project.sampleCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {project.testCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ProjectProgress value={project.progress} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <EmployeeAvatar initials={project.projectLeadInitials} />
                      <span className="text-foreground">{project.projectLead}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <ProjectActionsMenu
                      project={project}
                      onViewDetails={() => handlers.onViewDetails(project)}
                      onEdit={() => handlers.onEdit(project)}
                      onViewSamples={() => handlers.onViewSamples(project)}
                      onNewSample={() => handlers.onNewSample(project)}
                      onAddDeliveryNote={() => handlers.onAddDeliveryNote(project)}
                      onOpenCustomer={() => handlers.onOpenCustomer(project)}
                      onPause={() => handlers.onPause(project)}
                      onResume={() => handlers.onResume(project)}
                      onComplete={() => handlers.onComplete(project)}
                      onReopen={() => handlers.onReopen(project)}
                      onArchive={() => handlers.onArchive(project)}
                      onReactivate={() => handlers.onReactivate(project)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlers.onViewDetails(project)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate font-semibold text-foreground" title={project.name}>
                    {project.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{project.number}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <ProjectStatusBadge status={project.status} overdue={project.overdue} />
                  <ProjectActionsMenu
                    project={project}
                    onViewDetails={() => handlers.onViewDetails(project)}
                    onEdit={() => handlers.onEdit(project)}
                    onViewSamples={() => handlers.onViewSamples(project)}
                    onNewSample={() => handlers.onNewSample(project)}
                    onAddDeliveryNote={() => handlers.onAddDeliveryNote(project)}
                    onOpenCustomer={() => handlers.onOpenCustomer(project)}
                    onPause={() => handlers.onPause(project)}
                    onResume={() => handlers.onResume(project)}
                    onComplete={() => handlers.onComplete(project)}
                    onReopen={() => handlers.onReopen(project)}
                    onArchive={() => handlers.onArchive(project)}
                    onReactivate={() => handlers.onReactivate(project)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Kunde</p>
                  <p className="font-medium text-foreground">{project.customer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fachbereich</p>
                  <ProjectFieldBadge field={project.field} className="mt-0.5" />
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Baustelle / Adresse</p>
                  <p className="font-medium text-foreground">{project.address}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Startdatum</p>
                  <p className="font-medium text-foreground">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fällig bis</p>
                  <p className="font-medium text-foreground">{project.dueDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proben / Prüfungen</p>
                  <p className="font-medium text-foreground">
                    {project.sampleCount} / {project.testCount}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Projektleiter</p>
                  <p className="font-medium text-foreground">{project.projectLead}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Fortschritt</p>
                  <ProjectProgress value={project.progress} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
