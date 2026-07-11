"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FlaskConical } from "lucide-react";

import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { FeedbackToast, useFeedbackToast } from "@/components/shared/FeedbackToast";
import { SiteActiveSelectionCard } from "@/components/shared/SiteActiveSelectionCard";
import { SiteChecklistCard } from "@/components/shared/SiteChecklistCard";
import { SiteDetailDrawer } from "@/components/shared/SiteDetailDrawer";
import { SiteDeviceCard } from "@/components/shared/SiteDeviceCard";
import { SiteDeviceSelectDialog } from "@/components/shared/SiteDeviceSelectDialog";
import { SiteLocationCaptureDialog } from "@/components/shared/SiteLocationCaptureDialog";
import { SiteNoteDialog } from "@/components/shared/SiteNoteDialog";
import { SiteNotesList } from "@/components/shared/SiteNotesList";
import { SitePhotoCaptureDialog } from "@/components/shared/SitePhotoCaptureDialog";
import { SitePhotoGallery } from "@/components/shared/SitePhotoGallery";
import { SiteProjectCard } from "@/components/shared/SiteProjectCard";
import { SiteQuickActions } from "@/components/shared/SiteQuickActions";
import { SiteSampleCard } from "@/components/shared/SiteSampleCard";
import { SiteScannerDialog } from "@/components/shared/SiteScannerDialog";
import { SiteSyncQueueCard } from "@/components/shared/SiteSyncQueueCard";
import { StatCard } from "@/components/shared/StatCard";
import {
  activeSite,
  siteChecklistItems,
  siteDevices,
  siteNotes,
  sitePhotos,
  siteQuickActions,
  siteSamples,
} from "@/config/siteMode";
import type {
  SiteChecklistItem,
  SiteDevice,
  SiteNote,
  SitePhoto,
  SiteQuickActionItem,
  SiteSample,
  SiteSyncQueueEntry,
} from "@/types/siteMode";

const photoColorRotation = ["bg-primary/15", "bg-success/15", "bg-warning/15", "bg-destructive/15"];
let photoCounter = sitePhotos.length;

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
  const [photos, setPhotos] = useState<SitePhoto[]>(sitePhotos);
  const [notes, setNotes] = useState<SiteNote[]>(siteNotes);
  const [checklist, setChecklist] = useState<SiteChecklistItem[]>(siteChecklistItems);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; note: SiteNote | null }>({
    open: false,
    note: null,
  });
  const { message: feedback, showFeedback } = useFeedbackToast();

  const kpis = {
    heute: siteSamples.filter((sample) => sample.status !== "Abgeschlossen").length,
    ueberfaellig: siteSamples.filter((sample) => sample.status === "Überfällig").length,
  };

  const syncQueue: SiteSyncQueueEntry[] = useMemo(() => {
    const proben = siteSamples.filter((sample) => sample.status !== "Abgeschlossen").length;
    const messwerte = siteSamples.reduce(
      (sum, sample) => sum + sample.pruefungen.filter((p) => p.status !== "Abgeschlossen").length,
      0
    );
    return [
      { category: "Proben", count: proben },
      { category: "Fotos", count: photos.length },
      { category: "Messwerte", count: messwerte },
      { category: "Notizen", count: notes.length },
    ];
  }, [photos.length, notes.length]);

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
      case "qa-notiz":
        setNoteDialog({ open: true, note: null });
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

  function addMockPhoto() {
    photoCounter += 1;
    const colorClass = photoColorRotation[photoCounter % photoColorRotation.length];
    const timestamp = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    setPhotos((current) => [
      {
        id: `photo-${photoCounter}`,
        colorClass,
        description: "",
        favorite: false,
        capturedAt: `Heute, ${timestamp} Uhr`,
      },
      ...current,
    ]);
    setIsPhotoDialogOpen(false);
    showFeedback("Foto wurde lokal zur Galerie hinzugefügt.");
  }

  function handleTogglePhotoFavorite(photo: SitePhoto) {
    setPhotos((current) =>
      current.map((item) => (item.id === photo.id ? { ...item, favorite: !item.favorite } : item))
    );
  }

  function handlePhotoDescriptionChange(photo: SitePhoto, description: string) {
    setPhotos((current) => current.map((item) => (item.id === photo.id ? { ...item, description } : item)));
  }

  function handleDeletePhoto(photo: SitePhoto) {
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    showFeedback("Foto wurde gelöscht.");
  }

  function handleSaveNote(text: string) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    if (noteDialog.note) {
      setNotes((current) =>
        current.map((item) => (item.id === noteDialog.note!.id ? { ...item, text: trimmed } : item))
      );
      showFeedback("Notiz wurde aktualisiert.");
    } else {
      const timestamp = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      setNotes((current) => [
        { id: `note-${Date.now()}`, text: trimmed, author: "Anna Neumann", timestamp: `Heute, ${timestamp} Uhr` },
        ...current,
      ]);
      showFeedback("Notiz wurde hinzugefügt.");
    }
    setNoteDialog({ open: false, note: null });
  }

  function handleDeleteNote(note: SiteNote) {
    setNotes((current) => current.filter((item) => item.id !== note.id));
    showFeedback("Notiz wurde gelöscht.");
  }

  function handleToggleChecklistItem(item: SiteChecklistItem) {
    setChecklist((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, checked: !entry.checked } : entry))
    );
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

      <SiteSyncQueueCard entries={syncQueue} isOnline={false} onSync={() => setIsSyncConfirmOpen(true)} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={FlaskConical} label="Aktive Proben" value={kpis.heute} />
        <StatCard icon={AlertTriangle} label="Überfällig" value={kpis.ueberfaellig} tone="danger" />
        <StatCard
          icon={AlertTriangle}
          label="Zu synchronisieren"
          value={syncQueue.reduce((sum, entry) => sum + entry.count, 0)}
          tone="warning"
        />
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

      <SitePhotoGallery
        photos={photos}
        onToggleFavorite={handleTogglePhotoFavorite}
        onDescriptionChange={handlePhotoDescriptionChange}
        onDelete={handleDeletePhoto}
        onAdd={() => setIsPhotoDialogOpen(true)}
      />

      <SiteNotesList
        notes={notes}
        onAdd={() => setNoteDialog({ open: true, note: null })}
        onEdit={(note) => setNoteDialog({ open: true, note })}
        onDelete={handleDeleteNote}
      />

      <SiteChecklistCard items={checklist} onToggle={handleToggleChecklistItem} />

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
        onOpenCamera={addMockPhoto}
        onChooseFile={addMockPhoto}
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

      <SiteNoteDialog
        open={noteDialog.open}
        note={noteDialog.note}
        onOpenChange={(open) => setNoteDialog((current) => ({ ...current, open }))}
        onSave={handleSaveNote}
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
