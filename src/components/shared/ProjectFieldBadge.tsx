import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectField } from "@/types/project";

// Farbzuordnung bewusst konsistent mit den Fachbereichs-Farben aus dem
// Smart-Kalender (Beton=primary, Asphalt=warning, Geotechnik=success).
const fieldStyles: Record<ProjectField, string> = {
  Beton: "bg-primary/10 text-primary",
  Asphalt: "bg-warning/10 text-warning",
  Geotechnik: "bg-success/10 text-success",
  Mehrere: "bg-muted text-muted-foreground",
};

interface ProjectFieldBadgeProps {
  field: ProjectField;
  className?: string;
}

export function ProjectFieldBadge({ field, className }: ProjectFieldBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", fieldStyles[field], className)}>
      {field}
    </Badge>
  );
}
