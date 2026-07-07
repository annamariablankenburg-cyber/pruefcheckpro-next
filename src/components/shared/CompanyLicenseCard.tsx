import { Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LicenseOverview } from "@/types/company";

interface CompanyLicenseCardProps {
  license: LicenseOverview;
}

export function CompanyLicenseCard({ license }: CompanyLicenseCardProps) {
  const storagePercentage = Math.round((license.storageUsedGb / license.storageTotalGb) * 100);
  const userPercentage = Math.round((license.usedUsers / license.userLimit) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lizenz &amp; Speicherplatz</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Speicherplatz verwendet</p>
            <p className="text-2xl font-semibold text-foreground">
              {license.storageUsedGb} GB
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                von {license.storageTotalGb} GB
              </span>
            </p>
            <Progress value={storagePercentage} />
            <p className="text-xs text-muted-foreground">{storagePercentage}%</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Aktueller Tarif</p>
            <Badge className="w-fit gap-1 border border-warning/30 bg-warning/10 text-warning">
              <Crown className="size-3" />
              {license.plan}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">Ablaufdatum</p>
            <p className="text-sm font-medium text-foreground">{license.expiresAt}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Nutzerlizenz</p>
            <p className="text-2xl font-semibold text-foreground">
              {license.usedUsers}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                von {license.userLimit}
              </span>
            </p>
            <Progress value={userPercentage} />
            <p className="text-xs text-muted-foreground">{userPercentage}%</p>
          </div>
        </div>

        <button
          type="button"
          className="flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Tarif verwalten
        </button>
      </CardContent>
    </Card>
  );
}
