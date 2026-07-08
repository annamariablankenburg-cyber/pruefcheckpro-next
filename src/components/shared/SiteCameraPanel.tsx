import { Barcode, Camera, FileText, QrCode } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface SiteCameraPanelProps {
  onPhoto: () => void;
  onPhotographDocument: () => void;
  onQrCode: () => void;
  onBarcode: () => void;
}

const actions = [
  { key: "photo", label: "Foto aufnehmen", icon: Camera },
  { key: "document", label: "Dokument fotografieren", icon: FileText },
  { key: "qr", label: "QR-Code", icon: QrCode },
  { key: "barcode", label: "Barcode", icon: Barcode },
] as const;

export function SiteCameraPanel({ onPhoto, onPhotographDocument, onQrCode, onBarcode }: SiteCameraPanelProps) {
  const handlers: Record<(typeof actions)[number]["key"], () => void> = {
    photo: onPhoto,
    document: onPhotographDocument,
    qr: onQrCode,
    barcode: onBarcode,
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kamera</p>
          <p className="mt-1 text-sm text-muted-foreground">Nur UI-Vorschau – keine echte Kamerafunktion.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={handlers[key]}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center transition-colors hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
            >
              <Icon className="size-6 text-primary" />
              <span className="px-2 text-sm font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
