import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

// Gemeinsamer Abschnitts-Rahmen für /profil, /einstellungen und /admin, damit
// nicht drei unabhängige Card-Layouts entstehen.
export function SettingsSection({ title, description, actions, children }: SettingsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">{children}</CardContent>
    </Card>
  );
}
