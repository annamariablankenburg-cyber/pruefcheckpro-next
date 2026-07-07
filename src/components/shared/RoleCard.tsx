import { Archive, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { RoleBadge, roleColorStyles } from "@/components/shared/RoleBadge";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/role";

interface RoleCardProps {
  role: Role;
  onClick: (role: Role) => void;
}

export function RoleCard({ role, onClick }: RoleCardProps) {
  return (
    <button type="button" onClick={() => onClick(role)} className="block w-full text-left">
      <Card
        className={cn(
          "h-full transition-all hover:-translate-y-0.5 hover:shadow-md",
          role.status === "Archiviert" && "opacity-60"
        )}
      >
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                roleColorStyles[role.color]
              )}
            >
              <Shield className="size-5" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <RoleBadge type={role.type} />
              {role.status === "Archiviert" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Archive className="size-3" />
                  Archiviert
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="font-semibold text-foreground">{role.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{role.description}</p>
          </div>

          <p className="text-sm font-medium text-foreground">{role.userCount} Benutzer</p>
        </CardContent>
      </Card>
    </button>
  );
}
