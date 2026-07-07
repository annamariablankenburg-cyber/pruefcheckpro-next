import { TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
      <Badge variant="secondary" className={cn("shrink-0", statusStyles[status], className)}>
        {status}
      </Badge>
      {overdue && status === "Aktiv" && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
          <TriangleAlert className="size-3.5" />
          Überfällig
        </span>
      )}
    </span>
  );
}
