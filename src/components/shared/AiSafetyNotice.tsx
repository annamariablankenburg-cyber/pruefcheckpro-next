import { ShieldAlert } from "lucide-react";

export function AiSafetyNotice() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-primary">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        PrüfCheck AI unterstützt bei Orientierung, Berechnungsvorbereitung und Dokumentation. Normen,
        Prüfberichte und Freigaben müssen fachlich geprüft werden.
      </p>
    </div>
  );
}
