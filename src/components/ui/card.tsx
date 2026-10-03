import * as React from "react"

import { cn } from "@/lib/utils"

// Oberflächen-Ebenen (statt "alles sieht gleich aus"):
// - default:   Standard-Card, sehr leichter Schatten
// - flat:      ruhige Fläche ohne Schatten (Info-/Nebenbereiche)
// - elevated:  hervorgehobene Karte mit deutlicherem Schatten
// - highlight: Akzentfläche mit feinem Primärfarb-Verlauf (Empfehlung/Fokus)
const cardVariants = {
  default: "bg-card shadow-(--elev-1) ring-foreground/10",
  flat: "bg-muted/40 shadow-none ring-foreground/[0.07]",
  elevated: "bg-card shadow-(--elev-2) ring-foreground/10",
  highlight:
    "bg-gradient-to-br from-primary/[0.09] via-card to-card shadow-(--elev-2) ring-primary/25",
} as const

// interactive: Hover-Anhebung, reagierender Rand/Schatten und feiner
// Lichtstreifen ("Swosh"). Reine Zugabe – die Bedienbarkeit hängt nie am Hover.
const cardInteractive =
  "swoosh transition-[transform,box-shadow] duration-200 ease-(--ease-out-soft) motion-safe:hover:-translate-y-0.5 hover:shadow-(--elev-3) hover:ring-primary/35"

function Card({
  className,
  size = "default",
  variant = "default",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: keyof typeof cardVariants
  interactive?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl py-(--card-spacing) text-sm text-card-foreground ring-1 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        cardVariants[variant],
        interactive && cardInteractive,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-semibold tracking-[-0.012em] group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
