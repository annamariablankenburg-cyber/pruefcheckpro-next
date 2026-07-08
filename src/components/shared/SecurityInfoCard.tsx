import { ShieldCheck } from "lucide-react";

export function SecurityInfoCard() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm text-primary">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      <p>Alle Integrationen werden später verschlüsselt gespeichert.</p>
    </div>
  );
}
