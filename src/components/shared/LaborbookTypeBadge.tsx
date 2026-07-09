import { Beaker, CalendarCheck, Cpu, FileText, Sparkles, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LaborbookType } from "@/types/laborbook";

export const laborbookTypeIcons: Record<LaborbookType, LucideIcon> = {
  Prüfung: Beaker,
  Gerät: Cpu,
  Kalibrierung: CalendarCheck,
  Wartung: Wrench,
  Notiz: FileText,
  Ereignis: Sparkles,
};

const typeStyles: Record<LaborbookType, string> = {
  Prüfung: "bg-primary/10 text-primary",
  Gerät: "bg-warning/10 text-warning",
  Kalibrierung: "bg-success/10 text-success",
  Wartung: "bg-destructive/10 text-destructive",
  Notiz: "bg-muted text-muted-foreground",
  Ereignis: "bg-accent/10 text-accent-foreground",
};

interface LaborbookTypeBadgeProps {
  typ: LaborbookType;
  className?: string;
}

export function LaborbookTypeBadge({ typ, className }: LaborbookTypeBadgeProps) {
  return (
    <StatusBadge value={typ} styles={typeStyles} icons={laborbookTypeIcons} className={className} />
  );
}
