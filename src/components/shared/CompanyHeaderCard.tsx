import { Building2, Crown, FlaskConical, HardDrive, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CompanyProfile } from "@/types/company";

interface CompanyHeaderCardProps {
  profile: CompanyProfile;
}

function StatBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function CompanyHeaderCard({ profile }: CompanyHeaderCardProps) {
  const storagePercentage = Math.round((profile.storageUsedGb / profile.storageTotalGb) * 100);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:size-20">
            <FlaskConical className="size-8" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-xs text-muted-foreground">Firmen-ID: {profile.id}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge className="gap-1 border border-warning/30 bg-warning/10 text-warning">
                <Crown className="size-3" />
                {profile.plan}
              </Badge>
              <span className="text-xs text-muted-foreground">{profile.billingCycle}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:flex sm:flex-wrap sm:items-center sm:gap-8">
          <StatBlock icon={Building2} label="Standorte" value={profile.locationsCount} />
          <StatBlock icon={Users} label="Mitarbeiter" value={profile.employeesCount} />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HardDrive className="size-3.5" />
              Speicherplatz
            </div>
            <p className="text-lg font-semibold text-foreground">
              {profile.storageUsedGb} GB
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                von {profile.storageTotalGb} GB
              </span>
            </p>
            <Progress value={storagePercentage} className="h-1.5 w-28" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Lizenzstatus
            </div>
            <p className="text-lg font-semibold text-success">{profile.licenseStatus}</p>
            <p className="text-xs text-muted-foreground">Gültig bis {profile.licenseValidUntil}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
