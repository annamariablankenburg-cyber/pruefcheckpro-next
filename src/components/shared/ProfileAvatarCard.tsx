import { Camera } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileData, ProfileStatus } from "@/types/settings";

const statusStyles: Record<ProfileStatus, string> = {
  Aktiv: "bg-success/10 text-success",
  Gesperrt: "bg-destructive/10 text-destructive",
  Ausstehend: "bg-warning/10 text-warning",
};

interface ProfileAvatarCardProps {
  profile: ProfileData;
  onChangeAvatar: () => void;
}

export function ProfileAvatarCard({ profile, onChangeAvatar }: ProfileAvatarCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="relative shrink-0">
          <Avatar size="lg" className="size-20 text-xl">
            <AvatarFallback>{profile.avatarInitials}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-label="Profilbild ändern"
            onClick={onChangeAvatar}
            className="absolute -right-1 -bottom-1 rounded-full shadow-sm"
          >
            <Camera className="size-3.5" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <p className="text-lg font-semibold break-words text-foreground">{profile.displayName}</p>
            <Badge variant="secondary" className={statusStyles[profile.status]}>
              {profile.status}
            </Badge>
          </div>
          <p className="text-sm break-words text-muted-foreground">
            {profile.role} · {profile.company}
          </p>
          <p className="text-xs break-words text-muted-foreground/80">
            {profile.location} · Mitarbeiter-ID {profile.employeeId}
          </p>
        </div>

        <Button type="button" variant="outline" onClick={onChangeAvatar} className="w-fit shrink-0">
          Profilbild ändern
        </Button>
      </CardContent>
    </Card>
  );
}
