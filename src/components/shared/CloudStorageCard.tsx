import { CheckCircle2, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CloudStorageInfo } from "@/types/integration";

interface CloudStorageCardProps {
  storage: CloudStorageInfo;
}

export function CloudStorageCard({ storage }: CloudStorageCardProps) {
  const percent = Math.round((storage.usedGb / storage.totalGb) * 100);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Cloudspeicher</p>
          <p className="mt-1 text-sm text-muted-foreground">{storage.provider}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Speicher genutzt</span>
            <span className="font-semibold text-foreground">
              {storage.usedGb.toLocaleString("de-DE")} GB von {storage.totalGb.toLocaleString("de-DE")} GB
            </span>
          </div>
          <Progress value={percent} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Cloud verbunden</span>
          {storage.connected ? (
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="size-4" />
              Verbunden
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
              <XCircle className="size-4" />
              Nicht verbunden
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Letzte Synchronisierung</span>
          <span className="font-medium text-foreground">{storage.lastSync}</span>
        </div>
      </CardContent>
    </Card>
  );
}
