"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CloudUpload, FlaskConical } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { SiteActiveSelectionCard } from "@/components/shared/SiteActiveSelectionCard";
import { SiteCameraPanel } from "@/components/shared/SiteCameraPanel";
import { SiteDetailDrawer } from "@/components/shared/SiteDetailDrawer";
import { SiteDeviceCard } from "@/components/shared/SiteDeviceCard";
import { SiteDeviceSelectDialog } from "@/components/shared/SiteDeviceSelectDialog";
import { SiteLocationCaptureDialog } from "@/components/shared/SiteLocationCaptureDialog";
import { SiteOfflineBanner } from "@/components/shared/SiteOfflineBanner";
import { SitePhotoCaptureDialog } from "@/components/shared/SitePhotoCaptureDialog";
import { SiteProjectCard } from "@/components/shared/SiteProjectCard";
import { SiteQuickActions } from "@/components/shared/SiteQuickActions";
import { SiteSampleCard } from "@/components/shared/SiteSampleCard";
import { SiteScannerDialog } from "@/components/shared/SiteScannerDialog";
import { SiteToastActions } from "@/components/shared/SiteToastActions";
import { StatCard } from "@/components/shared/StatCard";
import { activeSite, siteDevices, siteQuickActions, siteSamples } from "@/config/siteMode";
import type { SiteDevice, SiteQuickActionItem, SiteSample } from "@/types/siteMode";

export default function BaustellenmodusPage() {
  const router = useRouter();
  const [activeSample, setActiveSample] = useState<SiteSample | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<SiteDevice | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<string | null>(null);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"qr" | "barcode" | null>(null);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = {
    heute: siteSamples.filter((sample) => sample.status !== "Abgeschlossen").length,
    ueberfaellig: siteSamples.filter((sample) => sample.status === "Überfällig").length,
    zuSynchronisieren: siteSamples.length + siteDevices.length,
  };

  function handleOpenSample(sample: SiteSample) {
    setActiveSample(sample);
    setSelectedSampleId(sample.id);
  }

  function handleQuickAction(action: SiteQuickActionItem) {
    switch (action.id) {
      case "qa-neue-probe":
        router.push("/probekoerper");
        break;
      case "qa-pruefung-starten":
        router.push("/pruefungen");
        break;
      case "qa-geraet-waehlen":
        setIsDeviceDialogOpen(true);
        break;
      case "qa-foto":
        setIsPhotoDialogOpen(true);
        break;
      case "qa-qr":
        setScannerMode("qr");
        break;
      case "qa-barcode":
        setScannerMode("barcode");
        break;
      case "qa-standort":
        setIsLocationDialogOpen(true);
        break;
      case "qa-kunde":
        router.push("/kunden");
        break;
      default:
        showFeedback("Diese Funktion wird später angebunden.");
    }
  }

  function handleDeviceSelect(device: SiteDevice) {
    setSelectedDevice(device);
    setIsDeviceDialogOpen(false);
    showFeedback(`${device.name} ausgewählt.`);
  }

  function handleScan(mode: "qr" | "barcode") {
    setScannerMode(null);
    showFeedback(
      mode === "qr" ? "QR-Code-Scanner wird später angebunden." : "Barcode-Scanner wird später angebunden."
    );
  }

  function handleOpenCamera() {
    setIsPhotoDialogOpen(false);
    showFeedback("Diese Funktion wird später angebunden.");
  }

  function handleChooseFile() {
    setIsPhotoDialogOpen(false);
    showFeedback("Diese Funktion wird später angebunden.");
  }

  function handleLocationConfirm() {
    setCapturedLocation(activeSite.gps);
    setIsLocationDialogOpen(false);
    showFeedback("Standort wurde für die aktuelle Baustelle übernommen.");
  }

  function handleSyncConfirm() {
    setIsSyncConfirmOpen(false);
    showFeedback("Synchronisierung wird später mit dem Offline-Modus angebunden.");
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

      <SiteOfflineBanner onSync={() => setIsSyncConfirmOpen(true)} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={FlaskConical} label="Aktive Proben" value={kpis.heute} />
        <StatCard icon={AlertTriangle} label="Überfällig" value={kpis.ueberfaellig} tone="danger" />
        <StatCard icon={CloudUpload} label="Zu synchronisieren" value={kpis.zuSynchronisieren} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <SiteProjectCard site={activeSite} onOpenProject={() => router.push("/projekte")} />
        <SiteActiveSelectionCard
          project={activeSite.projekt}
          sampleLabel={selectedSampleId}
          deviceLabel={selectedDevice?.name ?? null}
          locationLabel={capturedLocation}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Schnellaktionen</h2>
        <SiteQuickActions actions={siteQuickActions} onSelect={handleQuickAction} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Aktive Proben</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteSamples.map((sample) => (
            <SiteSampleCard key={sample.id} sample={sample} onOpen={handleOpenSample} />
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
        onPhoto={() => setIsPhotoDialogOpen(true)}
        onPhotographDocument={() => setIsPhotoDialogOpen(true)}
        onQrCode={() => setScannerMode("qr")}
        onBarcode={() => setScannerMode("barcode")}
      />

      <SiteToastActions
        onSync={() => setIsSyncConfirmOpen(true)}
        onSaveOffline={() => showFeedback("Diese Funktion wird später angebunden.")}
        onAttachPhoto={() => setIsPhotoDialogOpen(true)}
        onUseLocation={() => setIsLocationDialogOpen(true)}
        onAnalyzeWithAi={() => showFeedback("Diese Funktion wird später angebunden.")}
      />

      <SiteDetailDrawer
        sample={activeSample}
        onOpenChange={(open) => !open && setActiveSample(null)}
        onPhoto={() => setIsPhotoDialogOpen(true)}
        onUpdateLocation={() => setIsLocationDialogOpen(true)}
        onAddPhoto={() => setIsPhotoDialogOpen(true)}
        onAddAttachment={() => showFeedback("Diese Funktion wird später angebunden.")}
        onOpenSample={() => router.push("/probekoerper")}
      />

      <SiteDeviceSelectDialog
        open={isDeviceDialogOpen}
        onOpenChange={setIsDeviceDialogOpen}
        devices={siteDevices}
        onSelect={handleDeviceSelect}
      />

      <SitePhotoCaptureDialog
        open={isPhotoDialogOpen}
        onOpenChange={setIsPhotoDialogOpen}
        onOpenCamera={handleOpenCamera}
        onChooseFile={handleChooseFile}
      />

      <SiteScannerDialog
        mode={scannerMode}
        onOpenChange={(open) => !open && setScannerMode(null)}
        onScan={handleScan}
      />

      <SiteLocationCaptureDialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        currentLocation={activeSite.gps}
        onConfirm={handleLocationConfirm}
      />

      <ConfirmActionDialog<boolean>
        subject={isSyncConfirmOpen ? true : null}
        title="Synchronisierung"
        description="Synchronisierung wird später mit dem Offline-Modus angebunden."
        confirmLabel="Verstanden"
        onOpenChange={(open) => !open && setIsSyncConfirmOpen(false)}
        onConfirm={handleSyncConfirm}
      />

      <FeedbackToast message={feedback} />
    </div>
  );
}
