import { Cloud, ExternalLink, MapPin, Navigation, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeAvatar } from "@/components/shared/EmployeeAvatar";
import type { ActiveSite } from "@/types/siteMode";

interface SiteProjectCardProps {
  site: ActiveSite;
  onOpenProject: () => void;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SiteProjectCard({ site, onOpenProject }: SiteProjectCardProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Aktive Baustelle
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{site.projekt}</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onOpenProject}>
            <ExternalLink className="size-4" />
            Projekt öffnen
          </Button>
        </div>

        <div className="divide-y divide-border">
          <InfoRow label="Kunde" value={site.kunde} />
          <InfoRow label="Standort" value={site.standort} />
          <div className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-muted-foreground">Ansprechpartner</span>
            <span className="flex items-center gap-2 text-right font-medium text-foreground">
              <EmployeeAvatar initials={initialsOf(site.ansprechpartner)} size="sm" />
              {site.ansprechpartner}
            </span>
          </div>
          <InfoRow label="Telefon" value={site.telefon} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3.5">
            <Cloud className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Wetter</p>
              <p className="text-sm font-medium text-foreground">{site.wetter}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3.5">
            <MapPin className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Koordinaten</p>
              <p className="text-sm font-medium text-foreground">{site.gps}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <a
            href={`tel:${site.telefon.replace(/\s+/g, "")}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Phone className="size-4" />
            Ansprechpartner anrufen
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Navigation className="size-4" />
            Navigation öffnen
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
