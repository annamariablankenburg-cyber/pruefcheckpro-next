import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export function CtaSection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaSectionProps) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-(--elev-3)">
          {/* Technischer Hintergrund: Raster + diagonaler Verlauf + Messskala */}
          <div
            aria-hidden="true"
            className="tech-grid tech-fade pointer-events-none absolute inset-0 -z-10 opacity-70 [--grid-line:rgb(255_255_255/0.12)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/10 via-transparent to-slate-950/30"
          />
          <div
            aria-hidden="true"
            className="ruler-x pointer-events-none absolute inset-x-0 bottom-0 h-3 [color:rgb(255_255_255/0.35)]"
          />

          <div className="flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-16">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
              {title}
            </h2>
            <p className="max-w-xl text-lg text-pretty text-primary-foreground/80">{description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" className="h-10 px-4 text-sm" asChild>
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-10 border-primary-foreground/30 bg-transparent px-4 text-sm text-primary-foreground shadow-none hover:border-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
