import { StatusBadge } from "@/components/shared/StatusBadge";
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
    <StatusBadge
      value={testType}
      styles={testTypeStyles}
      label={testTypeLabels[testType]}
      className={className}
    />
  );
}
