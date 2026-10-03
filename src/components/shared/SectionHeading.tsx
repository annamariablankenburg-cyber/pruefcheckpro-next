import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          {/* Messmarke: kurze Linie mit Teilstrichen, wie ein Skalenanfang */}
          <span aria-hidden="true" className="flex items-end gap-[3px]">
            <span className="h-2 w-px bg-current opacity-50" />
            <span className="h-3 w-px bg-current" />
            <span className="h-2 w-px bg-current opacity-50" />
          </span>
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
