"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CloudUpload, FlaskConical } from "lucide-react";

import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { SiteCameraPanel } from "@/components/shared/SiteCameraPanel";
import { SiteDetailDrawer } from "@/components/shared/SiteDetailDrawer";
import { SiteDeviceCard } from "@/components/shared/SiteDeviceCard";
import { SiteOfflineBanner } from "@/components/shared/SiteOfflineBanner";
import { SiteProjectCard } from "@/components/shared/SiteProjectCard";
import { SiteQuickActions } from "@/components/shared/SiteQuickActions";
import { SiteSampleCard } from "@/components/shared/SiteSampleCard";
import { SiteToastActions } from "@/components/shared/SiteToastActions";
import { StatCard } from "@/components/shared/StatCard";
import { activeSite, siteDevices, siteQuickActions, siteSamples } from "@/config/siteMode";
import type { SiteDevice, SiteQuickActionItem, SiteSample } from "@/types/siteMode";

export default function BaustellenmodusPage() {
  const router = useRouter();
  const [activeSample, setActiveSample] = useState<SiteSample | null>(null);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = {
    heute: siteSamples.filter((sample) => sample.status !== "Abgeschlossen").length,
    ueberfaellig: siteSamples.filter((sample) => sample.status === "Überfällig").length,
    zuSynchronisieren: siteSamples.length + siteDevices.length,
  };

  function handleQuickAction(action: SiteQuickActionItem) {
    showFeedback(`${action.label}: Diese Funktion wird später angebunden.`);
  }

  function handleDeviceSelect(device: SiteDevice) {
    showFeedback(`${device.name} ausgewählt (UI-Vorschau).`);
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Baustellenmodus
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Schneller Zugriff auf alle wichtigen Funktionen direkt auf der Baustelle.
        </p>
      </div>

      <SiteOfflineBanner onSync={() => showFeedback("Diese Funktion wird später angebunden.")} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={FlaskConical} label="Aktive Proben" value={kpis.heute} />
        <StatCard icon={AlertTriangle} label="Überfällig" value={kpis.ueberfaellig} tone="danger" />
        <StatCard icon={CloudUpload} label="Zu synchronisieren" value={kpis.zuSynchronisieren} tone="warning" />
      </div>

      <SiteProjectCard site={activeSite} onOpenProject={() => router.push("/projekte")} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Schnellaktionen</h2>
        <SiteQuickActions actions={siteQuickActions} onSelect={handleQuickAction} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Aktive Proben</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteSamples.map((sample) => (
            <SiteSampleCard key={sample.id} sample={sample} onOpen={setActiveSample} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Geräte</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteDevices.map((device) => (
            <SiteDeviceCard key={device.id} device={device} onSelect={handleDeviceSelect} />
          ))}
        </div>
      </div>

      <SiteCameraPanel
        onPhoto={() => showFeedback("Diese Funktion wird später angebunden.")}
        onPhotographDocument={() => showFeedback("Diese Funktion wird später angebunden.")}
        onQrCode={() => showFeedback("Diese Funktion wird später angebunden.")}
        onBarcode={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <SiteToastActions
        onSync={() => showFeedback("Diese Funktion wird später angebunden.")}
        onSaveOffline={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAttachPhoto={() => showFeedback("Diese Funktion wird später angebunden.")}
        onUseLocation={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAnalyzeWithAi={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <SiteDetailDrawer
        sample={activeSample}
        onOpenChange={(open) => !open && setActiveSample(null)}
        onPhoto={() => showFeedback("Diese Funktion wird später angebunden.")}
        onUpdateLocation={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddPhoto={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAddAttachment={() => showFeedback("Diese Funktion wird später angebunden.")}
        onOpenSample={() => router.push("/probekoerper")}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
