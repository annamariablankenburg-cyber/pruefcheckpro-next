import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TestType } from "@/types/testValue";

export const testTypeLabels: Record<TestType, string> = {
  "beton-wuerfel": "Betonwürfel",
  "beton-prisma": "Prisma",
  proctor: "Proctor",
  asphalt: "Asphalt",
};

const testTypeStyles: Record<TestType, string> = {
  "beton-wuerfel": "bg-primary/10 text-primary",
  "beton-prisma": "bg-primary/10 text-primary",
  proctor: "bg-success/10 text-success",
  asphalt: "bg-warning/10 text-warning",
};

interface TestTypeBadgeProps {
  testType: TestType;
  className?: string;
}

export function TestTypeBadge({ testType, className }: TestTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("shrink-0", testTypeStyles[testType], className)}>
      {testTypeLabels[testType]}
    </Badge>
  );
}
