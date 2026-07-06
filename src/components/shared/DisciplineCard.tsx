import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DisciplineCardProps {
  image: string;
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  items: string[];
  href: string;
}

export function DisciplineCard({
  image,
  icon: Icon,
  iconClassName,
  title,
  description,
  items,
  href,
}: DisciplineCardProps) {
  return (
    <Card className="group flex h-full flex-col gap-0 rounded-3xl border border-border py-0 shadow-xl shadow-foreground/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-foreground/15">
      <div className="relative px-4 pt-4">
        <div className="relative h-56 w-full overflow-hidden rounded-3xl sm:h-64 lg:h-96">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>

        <div
          className={cn(
            "absolute -bottom-6 left-10 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-foreground/30 ring-4 ring-card",
            iconClassName
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-6 px-8 pt-10 pb-8">
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>

        <Button variant="outline" className="mt-auto w-fit" asChild>
          <Link href={href}>
            Mehr erfahren
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
