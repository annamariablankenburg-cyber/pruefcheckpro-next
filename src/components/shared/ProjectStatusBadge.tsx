import { TriangleAlert } from "lucide-react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ProjectStatus } from "@/types/project";

const statusStyles: Record<ProjectStatus, string> = {
  Aktiv: "bg-success/10 text-success",
  Pausiert: "bg-warning/10 text-warning",
  Abgeschlossen: "bg-muted text-muted-foreground",
  Archiviert: "border border-border bg-transparent text-muted-foreground",
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  // Rein visueller Hinweis für aktive, aber überfällige Projekte – kein
  // eigener Status.
  overdue?: boolean;
  className?: string;
}

export function ProjectStatusBadge({ status, overdue, className }: ProjectStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusBadge value={status} styles={statusStyles} className={className} />
      {overdue && status === "Aktiv" && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
          <TriangleAlert className="size-3.5" />
          Überfällig
        </span>
      )}
    </span>
  );
}
