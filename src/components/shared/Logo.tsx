// Eigenes Markenzeichen: Prüf-Häkchen über einer Messskala. Passt zu
// Baustoffprüfung/Messtechnik, ohne Bauklischees.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_6px_14px_-4px_rgb(37_99_235/0.55)] " +
        (className ?? "size-10")
      }
    >
      <span className="tech-grid-fine pointer-events-none absolute inset-0 opacity-30 [--grid-line:rgb(255_255_255/0.35)]" />
      <svg viewBox="0 0 24 24" fill="none" className="relative size-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.2 11.2 10.4 15.4 17.8 7" strokeWidth="2.4" />
        <path d="M4.5 20h15" strokeWidth="1.5" opacity="0.9" />
        <path d="M6.5 20v-1.6M9.5 20v-1.6M12 20v-2.6M14.5 20v-1.6M17.5 20v-1.6" strokeWidth="1.5" opacity="0.9" />
      </svg>
    </span>
  );
}

export default function Logo({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />

      <div>
        <span className="block text-lg leading-tight font-bold tracking-[-0.02em]">
          Prüf<span className="text-primary">Check</span>Pro
        </span>

        {showTagline && (
          <p className="text-[11px] leading-tight tracking-wide text-muted-foreground">
            Baustoffprüfung neu gedacht
          </p>
        )}
      </div>
    </div>
  );
}
