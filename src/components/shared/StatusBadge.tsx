import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps<T extends string> {
  value: T;
  styles: Record<T, string>;
  icons?: Record<T, LucideIcon>;
  label?: string;
  className?: string;
}

// Generische Basis für die vielen "Status/Typ als farbiges Badge"-Komponenten
// (SampleStatusBadge, DeviceStatusBadge, ReportFormatBadge, ...). Jede
// Domäne behält ihre eigene benannte Komponente und Styles-Map – hier wird
// nur das identische Badge+cn-Rendering gebündelt.
export function StatusBadge<T extends string>({
  value,
  styles,
  icons,
  label,
  className,
}: StatusBadgeProps<T>) {
  const Icon: LucideIcon | undefined = icons?.[value];
  return (
    <Badge variant="secondary" className={cn("shrink-0", Icon && "gap-1", styles[value], className)}>
      {Icon && <Icon className="size-3.5" />}
      {label ?? value}
    </Badge>
  );
}
