import { FileText, Gauge } from "lucide-react";

// Dekorative Produktvorschau für den Hero: eine Messreihe (Druckfestigkeit)
// mit Skala. Reine Darstellung mit Beispieldaten, kein Datenzugriff.
// Rechnung: Würfel 150 mm (22 500 mm²), fc = F / A.
const specimens = [
  { id: "W1", load: 868, strength: 38.6 },
  { id: "W2", load: 878, strength: 39.0 },
  { id: "W3", load: 851, strength: 37.8 },
];
const mean = 38.5;
const scaleMin = 36;
const scaleMax = 40;

function position(value: number) {
  return `${((value - scaleMin) / (scaleMax - scaleMin)) * 100}%`;
}

export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto" aria-hidden="true">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/20 blur-3xl" />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 shadow-2xl shadow-slate-950/60 backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-blue-300">
              <Gauge className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-100">Druckfestigkeit</p>
              <p className="font-mono text-[11px] text-slate-400">BET-2026-014 · 28 Tage</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            In Bearbeitung
          </span>
        </div>

        <div className="px-4 pt-3">
          <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-3 pb-2 text-[10px] font-semibold tracking-[0.06em] text-slate-500">
            <span>Probe</span>
            <span className="text-right">Last in kN</span>
            <span className="text-right">fc in N/mm²</span>
          </div>
          {specimens.map((specimen) => (
            <div
              key={specimen.id}
              className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-3 border-t border-white/5 py-2 font-mono text-sm text-slate-200 tabular-nums"
            >
              <span className="text-slate-400">{specimen.id}</span>
              <span className="text-right">{specimen.load}</span>
              <span className="text-right font-semibold text-white">
                {specimen.strength.toFixed(1).replace(".", ",")}
              </span>
            </div>
          ))}
        </div>

        {/* Skala mit Messpunkten und Mittelwert-Marke */}
        <div className="px-4 pt-4 pb-5">
          <div className="relative h-10">
            <div className="absolute inset-x-0 top-5 h-px bg-white/15" />
            <div className="ruler-x absolute inset-x-0 top-[10px] h-2.5 [color:rgb(148_163_184/0.45)]" />
            {specimens.map((specimen) => (
              <span
                key={specimen.id}
                className="absolute top-[14px] size-2.5 -translate-x-1/2 rounded-full bg-slate-300 ring-2 ring-slate-900"
                style={{ left: position(specimen.strength) }}
              />
            ))}
            <span
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: position(mean) }}
            >
              <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                Ø {mean.toFixed(1).replace(".", ",")}
              </span>
              <span className="h-2 w-px bg-primary" />
            </span>
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
            <span>{scaleMin}</span>
            <span>{(scaleMin + scaleMax) / 2}</span>
            <span>{scaleMax}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5" />
            Prüfbericht als Entwurf
          </span>
          <span>Beispieldaten</span>
        </div>
      </div>
    </div>
  );
}
