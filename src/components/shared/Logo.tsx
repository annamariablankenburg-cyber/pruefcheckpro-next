import { Rocket } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
        <Rocket className="h-6 w-6" />
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight">
          PrüfCheckPro
        </h1>

        <p className="text-xs text-muted-foreground">
          Baustoffprüfung neu gedacht
        </p>
      </div>
    </div>
  );
}