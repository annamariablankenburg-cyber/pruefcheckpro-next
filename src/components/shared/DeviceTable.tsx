import { Card, CardContent } from "@/components/ui/card";
import { DeviceActionsMenu } from "@/components/shared/DeviceActionsMenu";
import { DeviceStatusBadge } from "@/components/shared/DeviceStatusBadge";
import { DeviceTypeBadge } from "@/components/shared/DeviceTypeBadge";
import type { Device } from "@/types/device";

interface DeviceTableActionHandlers {
  onViewDetails: (device: Device) => void;
  onEdit: (device: Device) => void;
  onDocumentCalibration: (device: Device) => void;
  onDocumentMaintenance: (device: Device) => void;
  onUploadDocument: (device: Device) => void;
  onDeactivate: (device: Device) => void;
  onReactivate: (device: Device) => void;
  onArchive: (device: Device) => void;
}

interface DeviceTableProps extends DeviceTableActionHandlers {
  devices: Device[];
}

export function DeviceTable({ devices, ...handlers }: DeviceTableProps) {
  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Keine Geräte gefunden. Passe Suche oder Filter an.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop/Tablet: Tabelle */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 whitespace-nowrap">Inventarnummer</th>
                <th className="px-4 py-3 whitespace-nowrap">Gerät</th>
                <th className="px-4 py-3 whitespace-nowrap">Typ</th>
                <th className="px-4 py-3 whitespace-nowrap">Hersteller</th>
                <th className="px-4 py-3 whitespace-nowrap">Modell</th>
                <th className="px-4 py-3 whitespace-nowrap">Standort</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Letzte Kalibrierung</th>
                <th className="px-4 py-3 whitespace-nowrap">Nächste Kalibrierung</th>
                <th className="px-4 py-3 whitespace-nowrap">Wartung</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlers.onViewDetails(device)}
                      className="font-medium text-foreground hover:underline"
                    >
                      {device.inventoryNumber}
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{device.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DeviceTypeBadge type={device.type} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {device.manufacturer}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {device.model}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {device.location}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DeviceStatusBadge status={device.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {device.lastCalibration ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {device.nextCalibration ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {device.nextMaintenance ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <DeviceActionsMenu
                      device={device}
                      onViewDetails={() => handlers.onViewDetails(device)}
                      onEdit={() => handlers.onEdit(device)}
                      onDocumentCalibration={() => handlers.onDocumentCalibration(device)}
                      onDocumentMaintenance={() => handlers.onDocumentMaintenance(device)}
                      onUploadDocument={() => handlers.onUploadDocument(device)}
                      onDeactivate={() => handlers.onDeactivate(device)}
                      onReactivate={() => handlers.onReactivate(device)}
                      onArchive={() => handlers.onArchive(device)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: Karten */}
      <div className="flex flex-col gap-3 md:hidden">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlers.onViewDetails(device)}
                  className="min-w-0 text-left"
                >
                  <span className="block truncate font-semibold text-foreground">
                    {device.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {device.inventoryNumber}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <DeviceStatusBadge status={device.status} />
                  <DeviceActionsMenu
                    device={device}
                    onViewDetails={() => handlers.onViewDetails(device)}
                    onEdit={() => handlers.onEdit(device)}
                    onDocumentCalibration={() => handlers.onDocumentCalibration(device)}
                    onDocumentMaintenance={() => handlers.onDocumentMaintenance(device)}
                    onUploadDocument={() => handlers.onUploadDocument(device)}
                    onDeactivate={() => handlers.onDeactivate(device)}
                    onReactivate={() => handlers.onReactivate(device)}
                    onArchive={() => handlers.onArchive(device)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Typ</p>
                  <DeviceTypeBadge type={device.type} className="mt-0.5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Standort</p>
                  <p className="font-medium text-foreground">{device.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hersteller</p>
                  <p className="font-medium text-foreground">{device.manufacturer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Modell</p>
                  <p className="font-medium text-foreground">{device.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Letzte Kalibrierung</p>
                  <p className="font-medium text-foreground">{device.lastCalibration ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nächste Kalibrierung</p>
                  <p className="font-medium text-foreground">{device.nextCalibration ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Nächste Wartung</p>
                  <p className="font-medium text-foreground">{device.nextMaintenance ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
