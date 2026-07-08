"use client";

import { useMemo, useState } from "react";
import {
  Cloud,
  Code2,
  Database,
  HardDrive,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ApiSettingsCard } from "@/components/shared/ApiSettingsCard";
import { CloudStorageCard } from "@/components/shared/CloudStorageCard";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { ExportSettingsCard } from "@/components/shared/ExportSettingsCard";
import { IntegrationCard } from "@/components/shared/IntegrationCard";
import { SecurityInfoCard } from "@/components/shared/SecurityInfoCard";
import { WebhookTable } from "@/components/shared/WebhookTable";
import { cn } from "@/lib/utils";
import {
  apiSettings as initialApiSettings,
  cloudStorage,
  exportFormats as initialExportFormats,
  integrations as initialIntegrations,
  webhooks as initialWebhooks,
} from "@/config/integrations";
import {
  integrationCategories,
  type ApiSettings,
  type ExportFormatToggle,
  type Integration,
  type IntegrationCategory,
  type Webhook,
} from "@/types/integration";

type ConfirmType = "connect" | "disconnect";

const confirmCopy: Record<
  ConfirmType,
  { title: string; description: string; confirmLabel: string }
> = {
  connect: {
    title: "Integration verbinden?",
    description: "Die Integration wird als verbunden markiert. Es findet keine echte Verbindung statt.",
    confirmLabel: "Verbinden",
  },
  disconnect: {
    title: "Integration trennen?",
    description: "Die Verbindung wird lokal aufgehoben. Zugriffsdaten werden heute nicht wirklich entfernt.",
    confirmLabel: "Trennen",
  },
};

const categoryIcons: Record<IntegrationCategory, typeof Cloud> = {
  Cloud,
  Speicher: HardDrive,
  Kommunikation: MessagesSquare,
  Entwicklung: Code2,
  Export: Database,
  Sonstige: Sparkles,
};

export default function IntegrationenPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [exportFormats, setExportFormats] = useState<ExportFormatToggle[]>(initialExportFormats);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ integration: Integration; type: ConfirmType } | null>(
    null
  );
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2500);
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<IntegrationCategory, number> = {
      Cloud: 0,
      Speicher: 0,
      Kommunikation: 0,
      Entwicklung: 0,
      Export: 0,
      Sonstige: 0,
    };
    integrations.forEach((integration) => {
      counts[integration.category] += 1;
    });
    return counts;
  }, [integrations]);

  const filteredIntegrations = useMemo(
    () =>
      selectedCategory
        ? integrations.filter((integration) => integration.category === selectedCategory)
        : integrations,
    [integrations, selectedCategory]
  );

  function handleConfirmAction(subject: Integration) {
    if (!confirmAction) return;
    const nextStatus = confirmAction.type === "connect" ? "Verbunden" : "Nicht verbunden";
    setIntegrations((current) =>
      current.map((item) =>
        item.id === subject.id
          ? {
              ...item,
              status: nextStatus,
              lastSync: nextStatus === "Verbunden" ? "Gerade eben" : undefined,
            }
          : item
      )
    );
    setConfirmAction(null);
  }

  function handleRegenerateKey() {
    const key = `pcp_live_${Array.from({ length: 32 }, () =>
      "0123456789abcdef"[Math.floor(Math.random() * 16)]
    ).join("")}`;
    setApiSettings((current) => ({ ...current, apiKey: key }));
    setRegenerateConfirm(false);
    showFeedback("Neuer API-Key wurde generiert.");
  }

  function handleCopyKey() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(apiSettings.apiKey)
        .then(() => showFeedback("API-Key kopiert."))
        .catch(() => showFeedback("Kopieren nicht möglich."));
    } else {
      showFeedback("Kopieren nicht möglich.");
    }
  }

  function handleDeleteWebhook(webhook: Webhook) {
    setWebhooks((current) => current.filter((item) => item.id !== webhook.id));
    showFeedback("Webhook entfernt.");
  }

  function handleToggleExportFormat(format: ExportFormatToggle) {
    setExportFormats((current) =>
      current.map((item) => (item.id === format.id ? { ...item, enabled: !item.enabled } : item))
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Integrationen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verbinde PrüfCheckPro mit externen Diensten und Systemen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {integrationCategories.map((category) => {
          const Icon = categoryIcons[category];
          const isActive = selectedCategory === category;
          return (
            <Card
              key={category}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCategory((current) => (current === category ? null : category))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedCategory((current) => (current === category ? null : category));
                }
              }}
              className={cn(
                "cursor-pointer py-0 transition-colors hover:border-primary/40 hover:bg-primary/5",
                isActive && "border-primary bg-primary/10"
              )}
            >
              <CardContent className="flex flex-col items-center gap-2 px-3 py-5 text-center">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">{category}</p>
                <p className="text-xs text-muted-foreground">{categoryCounts[category]} Integrationen</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Integrationen</h2>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Alle anzeigen
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={(item) => setConfirmAction({ integration: item, type: "connect" })}
              onSettings={() => showFeedback("Diese Funktion wird später angebunden.")}
              onDisconnect={(item) => setConfirmAction({ integration: item, type: "disconnect" })}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApiSettingsCard
          settings={apiSettings}
          onRegenerateKey={() => setRegenerateConfirm(true)}
          onCopyKey={handleCopyKey}
        />
        <CloudStorageCard storage={cloudStorage} />
      </div>

      <WebhookTable
        webhooks={webhooks}
        onAdd={() => showFeedback("Diese Funktion wird später angebunden.")}
        onDelete={handleDeleteWebhook}
      />

      <ExportSettingsCard formats={exportFormats} onToggle={handleToggleExportFormat} />

      <SecurityInfoCard />

      <ConfirmActionDialog<Integration>
        subject={confirmAction?.integration ?? null}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ""}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].confirmLabel : ""}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog<boolean>
        subject={regenerateConfirm ? true : null}
        title="API-Key neu generieren?"
        description="Der bisherige API-Key wird ungültig. Bestehende Integrationen müssten den neuen Key verwenden."
        confirmLabel="Neu generieren"
        confirmVariant="destructive"
        onOpenChange={(open) => !open && setRegenerateConfirm(false)}
        onConfirm={handleRegenerateKey}
      />

      {feedback && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}
