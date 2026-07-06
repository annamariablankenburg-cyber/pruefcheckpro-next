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
import { CalendarDeleteDialog } from "@/components/shared/CalendarDeleteDialog";
import { CalendarEventInfo } from "@/components/shared/CalendarEventInfo";
import { CalendarFieldBadge } from "@/components/shared/CalendarLegend";
import { CalendarStatusBadge } from "@/components/shared/CalendarStatusBadge";
import type { CalendarEvent } from "@/types/calendarEvent";

interface CalendarEventDrawerProps {
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
}

export function CalendarEventDrawer({ event, onOpenChange }: CalendarEventDrawerProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
                      <Button type="button" variant="outline" size="sm" className="shrink-0">
                        Probe öffnen
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {event.sampleId && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Prüfung
                  </p>
                  <Button type="button" variant="outline" className="w-fit">
                    <FlaskConical className="size-4" />
                    Prüfwerte eintragen
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-border pt-5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Aktionen
                </p>
                <CalendarActionMenu
                  onEdit={() => {}}
                  onMove={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => setIsDeleteOpen(true)}
                />
              </div>
            </DrawerBody>

            <div className="flex justify-end border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>

            <CalendarDeleteDialog
              event={isDeleteOpen ? event : null}
              onOpenChange={(open) => setIsDeleteOpen(open)}
              onConfirm={() => {
                setIsDeleteOpen(false);
                onOpenChange(false);
              }}
            />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
