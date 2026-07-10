import Link from "next/link";
import { ArrowRight, Circle, CircleCheck, ClipboardList, Info, Star, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { FieldAreaProcedure } from "@/types/fieldArea";

interface ProcedureDetailDrawerProps {
  procedure: FieldAreaProcedure | null;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite: (procedure: FieldAreaProcedure) => void;
  onToggleLearned: (procedure: FieldAreaProcedure) => void;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-foreground">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ProcedureDetailDrawer({
  procedure,
  onOpenChange,
  onToggleFavorite,
  onToggleLearned,
}: ProcedureDetailDrawerProps) {
  return (
    <Drawer open={procedure !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {procedure && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{procedure.title}</DrawerTitle>
                <Badge variant="outline">{procedure.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{procedure.shortDescription}</p>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                Fachliche Kurzorientierung – betriebliche Anweisungen und gültige Normen beachten.
              </div>

              <div className="flex flex-col gap-1.5">
                <SectionTitle>Zweck</SectionTitle>
                <p className="text-sm text-foreground">{procedure.purpose}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <SectionTitle>Benötigte Geräte</SectionTitle>
                <BulletList items={procedure.equipment} />
              </div>

              <div className="flex flex-col gap-1.5">
                <SectionTitle>Vorbereitung</SectionTitle>
                <BulletList items={procedure.preparation} />
              </div>

              <div className="flex flex-col gap-1.5">
                <SectionTitle>Arbeitsschritte</SectionTitle>
                <ol className="flex flex-col gap-1.5">
                  {procedure.steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <SectionTitle>Eingabewerte</SectionTitle>
                  <BulletList items={procedure.inputs} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <SectionTitle>Ergebnisfelder</SectionTitle>
                  <BulletList items={procedure.outputs} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <SectionTitle>Typische Fehlerquellen</SectionTitle>
                <ul className="flex flex-col gap-1.5">
                  {procedure.pitfalls.map((pitfall) => (
                    <li key={pitfall} className="flex items-start gap-2 text-sm text-foreground">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                      {pitfall}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted px-3.5 py-3 text-sm text-muted-foreground">
                <ClipboardList className="mt-0.5 size-4 shrink-0" />
                {procedure.normHint}
              </div>
            </DrawerBody>

            <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/pruefungen">
                    <ArrowRight className="size-4" />
                    Zur Prüfwert-Erfassung
                  </Link>
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/lernen">
                    <ArrowRight className="size-4" />
                    Zum Lernen
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={procedure.learned ? "secondary" : "default"}
                  onClick={() => onToggleLearned(procedure)}
                >
                  {procedure.learned ? <CircleCheck className="size-4" /> : <Circle className="size-4" />}
                  {procedure.learned ? "Als bekannt markiert" : "Als bekannt markieren"}
                </Button>
                <Button type="button" variant="outline" onClick={() => onToggleFavorite(procedure)}>
                  <Star className={cn("size-4", procedure.favorite && "fill-warning text-warning")} />
                  {procedure.favorite ? "Favorit entfernen" : "Favorit setzen"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
