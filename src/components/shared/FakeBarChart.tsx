"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BarChartDetails {
  beton: number;
  asphalt: number;
  geotechnik: number;
  abgeschlossen: number;
  offen: number;
  ueberfaellig: number;
  beispiele: string[];
}

export interface BarChartDatum {
  label: string;
  value: number;
  heightClass: string;
  highlight?: boolean;
  details?: BarChartDetails;
}

interface FakeBarChartProps {
  data: BarChartDatum[];
  selectedLabel?: string;
  onSelect?: (datum: BarChartDatum) => void;
}

export function FakeBarChart({ data, selectedLabel, onSelect }: FakeBarChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    const el = scrollRef.current;
    updateScrollState();
    if (!el) return;

    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [data]);

  function scrollByStep(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByStep(-1)}
        disabled={!canScrollLeft}
        aria-label="Diagramm nach links scrollen"
        className="absolute top-1/2 left-0 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card p-1.5 text-foreground shadow-md transition-opacity sm:flex disabled:pointer-events-none disabled:opacity-0"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div
        ref={scrollRef}
        className="scroll-smooth overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max items-end gap-2 px-1 sm:gap-3 sm:px-2">
          {data.map((datum) => {
            const isSelected = selectedLabel === datum.label;
            return (
              <button
                key={datum.label}
                type="button"
                onClick={() => onSelect?.(datum)}
                aria-pressed={isSelected}
                className={cn(
                  "flex w-14 shrink-0 flex-col items-center gap-2 rounded-lg py-1 transition-colors sm:w-16",
                  "hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isSelected && "bg-primary/5"
                )}
              >
                <span className="text-xs font-medium text-muted-foreground">{datum.value}</span>
                <div className="flex h-32 w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      datum.highlight ? "bg-primary" : "bg-primary/25",
                      isSelected && "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card",
                      datum.heightClass
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    datum.highlight || isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {datum.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollByStep(1)}
        disabled={!canScrollRight}
        aria-label="Diagramm nach rechts scrollen"
        className="absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card p-1.5 text-foreground shadow-md transition-opacity sm:flex disabled:pointer-events-none disabled:opacity-0"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
