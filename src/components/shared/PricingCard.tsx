import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, Check, FlaskConical, GraduationCap, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingTier = "starter" | "pro" | "enterprise";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  href: string;
  highlighted?: boolean;
  tier?: PricingTier;
}

// Jeder Tarif hat eine eigene Oberfläche, damit sie sich beim ersten Blick
// unterscheiden: neutral (Einstieg), Akzent (empfohlen), dunkel (Enterprise).
const tierIcons: Record<PricingTier, LucideIcon> = {
  starter: GraduationCap,
  pro: FlaskConical,
  enterprise: Building2,
};

const tierLabels: Record<PricingTier, string> = {
  starter: "Einstieg",
  pro: "Für Labore",
  enterprise: "Für Unternehmen",
};

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  ctaLabel,
  href,
  highlighted = false,
  tier = highlighted ? "pro" : "starter",
}: PricingCardProps) {
  const isDark = tier === "enterprise";
  const Icon = tierIcons[tier];

  // "Alles aus X" ist kein eigenes Feature, sondern der Verweis auf den
  // Vorgänger-Tarif – als Kopfzeile der Liste statt als gleichwertiger Punkt.
  const inherited = features.find((feature) => feature.startsWith("Alles aus"));
  const ownFeatures = features.filter((feature) => feature !== inherited);

  return (
    <div className={cn("relative h-full", highlighted && "lg:-my-3")}>
      <Card
        interactive
        variant={highlighted ? "highlight" : "default"}
        className={cn(
          "h-full gap-0 rounded-2xl py-0",
          highlighted && "ring-2 ring-primary/60 shadow-(--elev-3)",
          isDark && "bg-slate-950 text-slate-100 ring-white/10 shadow-(--elev-2)"
        )}
      >
        {/* Technischer Hintergrund: Raster blendet zum unteren Rand aus. */}
        <div
          aria-hidden="true"
          className={cn(
            "tech-grid-fine tech-fade pointer-events-none absolute inset-0 opacity-60",
            isDark && "[--grid-line:rgb(148_163_184/0.12)]"
          )}
        />
        {highlighted && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary"
          />
        )}

        <CardHeader className="relative gap-4 px-6 pt-7 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  isDark
                    ? "bg-white/10 text-white"
                    : highlighted
                      ? "bg-primary text-primary-foreground shadow-(--elev-2)"
                      : "bg-muted text-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="text-lg leading-tight font-semibold tracking-[-0.015em]">{name}</h3>
                <p className={cn("label-caps mt-0.5", isDark && "text-slate-400")}>{tierLabels[tier]}</p>
              </div>
            </div>
            {highlighted && <Badge>Empfohlen</Badge>}
          </div>

          <p className={cn("text-sm", isDark ? "text-slate-300" : "text-muted-foreground")}>{description}</p>

          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "num font-semibold",
                highlighted ? "text-6xl" : "text-5xl",
                isDark ? "text-white" : "text-foreground"
              )}
            >
              {price}
            </span>
            {period && (
              <span className={cn("text-sm", isDark ? "text-slate-400" : "text-muted-foreground")}>{period}</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative flex-1 border-t border-current/10 px-6 pt-5 pb-6">
          {inherited && (
            <p
              className={cn(
                "mb-4 flex items-center gap-2 text-sm font-semibold",
                isDark ? "text-white" : "text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  isDark ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                )}
              >
                <Plus className="size-3" />
              </span>
              {inherited}
            </p>
          )}
          <ul className="space-y-3">
            {ownFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                    isDark ? "bg-emerald-400/15 text-emerald-300" : "bg-success/12 text-success"
                  )}
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span className={isDark ? "text-slate-200" : "text-foreground/80"}>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="relative border-t-0 bg-transparent px-6 pt-0 pb-6">
          <Button
            asChild
            size="lg"
            variant={highlighted ? "default" : "outline"}
            className={cn(
              "h-10 w-full text-sm",
              isDark &&
                "border-transparent bg-white text-slate-950 shadow-none hover:border-transparent hover:bg-white/90 hover:text-slate-950 dark:border-transparent dark:bg-white dark:hover:border-transparent dark:hover:bg-white/90"
            )}
          >
            <Link href={href}>
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
