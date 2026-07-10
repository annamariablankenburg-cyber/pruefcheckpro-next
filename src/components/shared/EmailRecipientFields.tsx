"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RecipientListProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  addLabel: string;
}

function RecipientList({ label, values, onChange, required, addLabel }: RecipientListProps) {
  function updateAt(index: number, value: string) {
    onChange(values.map((item, i) => (i === index ? value : item)));
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...values, ""]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <div className="flex flex-col gap-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="email"
              value={value}
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder="name@beispiel.de"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Empfänger entfernen"
              onClick={() => removeAt(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {values.length === 0 && (
          <p className="text-xs text-muted-foreground">Keine Adresse hinterlegt.</p>
        )}
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

interface EmailRecipientFieldsProps {
  to: string[];
  onToChange: (values: string[]) => void;
  cc: string[];
  onCcChange: (values: string[]) => void;
  bcc: string[];
  onBccChange: (values: string[]) => void;
  replyTo: string;
  onReplyToChange: (value: string) => void;
}

export function EmailRecipientFields({
  to,
  onToChange,
  cc,
  onCcChange,
  bcc,
  onBccChange,
  replyTo,
  onReplyToChange,
}: EmailRecipientFieldsProps) {
  const [showOptional, setShowOptional] = useState(cc.length > 0 || bcc.length > 0 || replyTo.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <RecipientList label="Empfänger" values={to} onChange={onToChange} required addLabel="Weiterer Empfänger" />

      {!showOptional && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit text-muted-foreground"
          onClick={() => setShowOptional(true)}
        >
          CC / BCC / Antwortadresse hinzufügen
        </Button>
      )}

      {showOptional && (
        <>
          <RecipientList label="CC" values={cc} onChange={onCcChange} addLabel="CC hinzufügen" />
          <RecipientList label="BCC" values={bcc} onChange={onBccChange} addLabel="BCC hinzufügen" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Antwortadresse</label>
            <Input
              type="email"
              value={replyTo}
              onChange={(event) => onReplyToChange(event.target.value)}
              placeholder="Standard: eigene E-Mail-Adresse"
            />
          </div>
        </>
      )}
    </div>
  );
}
