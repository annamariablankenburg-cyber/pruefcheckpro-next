import type { LucideIcon } from "lucide-react";

interface FieldAreaHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function FieldAreaHeader({ icon: Icon, title, subtitle }: FieldAreaHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
    </div>
  );
}
