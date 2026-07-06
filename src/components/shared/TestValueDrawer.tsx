import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AuditTrailPreview } from "@/components/shared/AuditTrailPreview";
import { TestTypeBadge } from "@/components/shared/TestTypeBadge";
import { TestValueForm } from "@/components/shared/TestValueForm";
import type { AuditEntry, TestEntry } from "@/types/testValue";

interface TestValueDrawerProps {
  entry: TestEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function TestValueDrawer({ entry, onOpenChange }: TestValueDrawerProps) {
  const auditEntries: AuditEntry[] = entry?.erfasst
    ? [
        { actor: entry.pruefer, action: "hat Werte eingetragen", timestamp: "01.03.2026, 09:12 Uhr" },
        { actor: "Laborleiter", action: "hat einen Wert korrigiert", timestamp: "01.03.2026, 14:30 Uhr" },
      ]
    : [];

  return (
    <Drawer open={entry !== null} onOpenChange={onOpenChange}>
      <DrawerContent>
        {entry && (
          <>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>{entry.sampleId}</DrawerTitle>
                <TestTypeBadge testType={entry.testType} />
              </div>
              <p className="text-sm text-muted-foreground">{entry.titel}</p>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-6">
              <TestValueForm
                testType={entry.testType}
                defaultPruefer={entry.pruefer}
                defaultPruefdatum={entry.pruefdatum}
              />

              <div className="border-t border-border pt-5">
                <AuditTrailPreview entries={auditEntries} />
              </div>
            </DrawerBody>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Werte speichern
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
