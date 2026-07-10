"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CalculatorDefinition } from "@/types/fieldArea";

interface CalculatorCardProps {
  definition: CalculatorDefinition;
}

function emptyValues(definition: CalculatorDefinition): Record<string, string> {
  return Object.fromEntries(definition.inputs.map((field) => [field.key, ""]));
}

function formatResult(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export function CalculatorCard({ definition }: CalculatorCardProps) {
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(definition));

  const allFilled = definition.inputs.every((field) => values[field.key]?.trim().length > 0);
  const result = useMemo(() => {
    if (!allFilled) return null;
    const computed = definition.compute(values);
    return computed !== null && Number.isFinite(computed) ? computed : null;
  }, [allFilled, definition, values]);

  function handleChange(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleReset() {
    setValues(emptyValues(definition));
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{definition.name}</CardTitle>
        <CardDescription>{definition.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {definition.inputs.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label htmlFor={`${definition.id}-${field.key}`} className="text-xs font-medium text-muted-foreground">
                {field.label}
                {field.unit ? ` (${field.unit})` : ""}
              </label>
              <Input
                id={`${definition.id}-${field.key}`}
                type={field.type ?? "number"}
                inputMode={field.type === "date" ? undefined : "decimal"}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(event) => handleChange(field.key, event.target.value)}
                className="h-9"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
          <span className="text-sm font-medium text-foreground">{definition.resultLabel}</span>
          <span className="text-lg font-semibold text-foreground">
            {result === null ? "–" : `${formatResult(result)}${definition.resultUnit ? ` ${definition.resultUnit}` : ""}`}
          </span>
        </div>

        {definition.plausibilityHint && (
          <p className="text-xs text-muted-foreground">{definition.plausibilityHint}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Ergebnis dient der rechnerischen Unterstützung und muss fachlich geprüft werden.
        </p>

        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={handleReset}>
          <RotateCcw className="size-3.5" />
          Zurücksetzen
        </Button>
      </CardContent>
    </Card>
  );
}
