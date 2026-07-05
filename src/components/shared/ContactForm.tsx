"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <Input id="name" name="name" placeholder="Dein Name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-Mail
        </label>
        <Input id="email" name="email" type="email" placeholder="du@beispiel.de" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-foreground">
          Nachricht
        </label>
        <Textarea id="message" name="message" rows={5} placeholder="Wie können wir helfen?" required />
      </div>
      <Button type="submit" className="w-fit">
        Nachricht senden
      </Button>
    </form>
  );
}
