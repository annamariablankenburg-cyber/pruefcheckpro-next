import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  href: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  ctaLabel,
  href,
  highlighted = false,
}: PricingCardProps) {
  return (
    <Card className={cn("relative flex h-full flex-col", highlighted && "ring-2 ring-primary")}>
      {highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Beliebt</Badge>
      )}

      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight text-foreground">{price}</span>
          {period && <span className="text-sm text-muted-foreground">{period}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button asChild variant={highlighted ? "default" : "outline"} className="w-full">
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
