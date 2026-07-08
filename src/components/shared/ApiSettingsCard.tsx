"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApiSettings } from "@/types/integration";

interface ApiSettingsCardProps {
  settings: ApiSettings;
  onRegenerateKey: () => void;
  onCopyKey: () => void;
}

function maskKey(key: string) {
  return `${key.slice(0, 8)}${"•".repeat(Math.max(key.length - 12, 8))}${key.slice(-4)}`;
}

export function ApiSettingsCard({ settings, onRegenerateKey, onCopyKey }: ApiSettingsCardProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">REST API</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Direkter Zugriff auf PrüfCheckPro-Daten über die API – heute nur UI-Vorschau.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">API-Key</label>
          <div className="flex gap-2">
            <Input readOnly value={showKey ? settings.apiKey : maskKey(settings.apiKey)} className="font-mono" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={showKey ? "API-Key verbergen" : "API-Key anzeigen"}
              onClick={() => setShowKey((current) => !current)}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="API-Key kopieren" onClick={onCopyKey}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Base URL</label>
            <Input readOnly value={settings.baseUrl} className="font-mono" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">API-Version</label>
            <Input readOnly value={settings.apiVersion} className="font-mono" />
          </div>
        </div>

        <Button type="button" variant="outline" className="w-fit" onClick={onRegenerateKey}>
          <RefreshCw className="size-4" />
          API-Key neu generieren
        </Button>
      </CardContent>
    </Card>
  );
}
