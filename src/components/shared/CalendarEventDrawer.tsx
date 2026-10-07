"use client";

import { useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CalendarActionMenu } from "@/components/shared/CalendarActionMenu";
import type { CalendarUiAccess } from "@/lib/permissions/domainAccess";
import { CalendarDeleteDialog } from "@/components/shared/CalendarDeleteDialog";
import { CalendarEventInfo } from "@/components/shared/CalendarEventInfo";
import { CalendarFieldBadge } from "@/components/shared/CalendarLegend";
import { CalendarStatusBadge } from "@/components/shared/CalendarStatusBadge";
import type { CalendarEvent } from "@/types/calendarEvent";

interface CalendarEventDrawerProps {
  event: CalendarEvent | null;
  access: CalendarUiAccess;
  onOpenChange: (open: boolean) => void;
  onOpenSample: (event: CalendarEvent) => void;
  onEnterValues: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onMove: (event: CalendarEvent) => void;
  onDuplicate: (event: CalendarEvent) => void;
  // Gibt true zurück, wenn der Termin tatsächlich gelöscht wurde; nur dann
  // schließt sich der Drawer.
  onDelete: (event: CalendarEvent) => Promise<boolean>;
}

export function CalendarEventDrawer({
  event,
  onOpenChange,
  access,
  onOpenSample,
  onEnterValues,
  onEdit,
  onMove,
  onDuplicate,
  onDelete,
}: CalendarEventDrawerProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(current: CalendarEvent) {
    setIsDeleting(true);
    try {
      const deleted = await onDelete(current);
      if (deleted) {
        setIsDeleteOpen(false);
        onOpenChange(false);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Drawer open={event !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {event && (
          <>
            <DrawerHeader>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Kalendertermin
              </p>
              <DrawerTitle>{event.title}</DrawerTitle>
              <div className="flex items-center gap-2">
                <CalendarStatusBadge status={event.status} />
                <CalendarFieldBadge field={event.field} />
              </div>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Informationen
                </p>
                <CalendarEventInfo event={event} />
              </div>

              {event.description && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Beschreibung
                  </p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}

              {event.sampleId && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Verknüpfte Probe
                  </p>
                  <Card>
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{event.sampleId}</p>
                        {event.bezeichnung && (
                          <p className="truncate text-sm text-muted-foreground">
                            {event.bezeichnung}
                          </p>
                        )}
                      </div>
                      {access.openSample && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => onOpenSample(event)}
                        >
                          Probe öffnen
                          <ArrowRight className="size-3.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {event.sampleId && access.enterValues && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Prüfung
                  </p>
                  <Button type="button" variant="outline" className="w-fit" onClick={() => onEnterValues(event)}>
                    <FlaskConical className="size-4" />
                    Prüfwerte eintragen
                  </Button>
                </div>
              )}

              {(access.edit || access.move || access.duplicate || access.delete) && (
              <div className="flex flex-col gap-2 border-t border-border pt-5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Aktionen
                </p>
                <CalendarActionMenu
                  access={access}
                  onEdit={() => onEdit(event)}
                  onMove={() => onMove(event)}
                  onDuplicate={() => onDuplicate(event)}
                  onDelete={() => setIsDeleteOpen(true)}
                />
              </div>
              )}
            </DrawerBody>

            <div className="flex justify-end border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>

            <CalendarDeleteDialog
              event={isDeleteOpen ? event : null}
              isLoading={isDeleting}
              onOpenChange={(open) => !isDeleting && setIsDeleteOpen(open)}
              onConfirm={() => handleDelete(event)}
            />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
