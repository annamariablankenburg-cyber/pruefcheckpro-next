import { Send, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function AiPage() {
  return (
    <PagePlaceholder
      icon={Sparkles}
      title="PrüfCheck AI"
      description="Dein intelligenter Assistent für Prüfverfahren, DIN-Normen und Berechnungen."
      items={[
        "Fragen beantworten",
        "DIN-Normen erklären",
        "Berechnungen durchführen",
        "PDF-Berichte analysieren",
        "Bilder analysieren",
        "Lernkarten automatisch erstellen",
      ]}
    >
      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            <Sparkles className="size-4 shrink-0 text-primary" />
            Frag PrüfCheck AI zu DIN-Normen, Berechnungen oder Prüfverfahren …
          </div>
          <button
            type="button"
            disabled
            aria-label="Nachricht senden"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground opacity-50"
          >
            <Send className="size-4" />
          </button>
        </CardContent>
      </Card>
    </PagePlaceholder>
  );
}
