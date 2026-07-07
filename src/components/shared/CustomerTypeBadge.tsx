import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerType } from "@/types/customer";

const typeStyles: Record<CustomerType, string> = {
  Bauunternehmen: "bg-primary/10 text-primary",
  Behörde: "bg-warning/10 text-warning",
  Privatkunde: "bg-success/10 text-success",
  Industriekunde: "bg-primary/10 text-primary",
  Sonstige: "bg-muted text-muted-foreground",
};

interface CustomerTypeBadgeProps {
  type: CustomerType;
  className?: string;
}

export function CustomerTypeBadge({ type, className }: CustomerTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", typeStyles[type], className)}>
      {type}
    </Badge>
  );
}
