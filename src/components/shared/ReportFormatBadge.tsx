import { FileSpreadsheet, FileText, Files } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportFormat } from "@/types/report";

const formatIcons: Record<ReportFormat, LucideIcon> = {
  PDF: FileText,
  Excel: FileSpreadsheet,
  "PDF & Excel": Files,
};

const formatStyles: Record<ReportFormat, string> = {
  PDF: "bg-destructive/10 text-destructive",
  Excel: "bg-success/10 text-success",
  "PDF & Excel": "bg-primary/10 text-primary",
};

interface ReportFormatBadgeProps {
  format: ReportFormat;
  className?: string;
}

export function ReportFormatBadge({ format, className }: ReportFormatBadgeProps) {
  const Icon = formatIcons[format];
  return (
    <Badge variant="secondary" className={cn("shrink-0 gap-1", formatStyles[format], className)}>
      <Icon className="size-3.5" />
      {format}
    </Badge>
  );
}
