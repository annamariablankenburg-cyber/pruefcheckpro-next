import { Mail } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContactForm } from "@/components/shared/ContactForm";

export default function KontaktPage() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Kontakt
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Fragen zu PrüfCheckPro? Wir freuen uns auf deine Nachricht.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <CardTitle className="mt-4 text-lg">Direkter Kontakt</CardTitle>
              <CardDescription>
                Schreib uns jederzeit eine E-Mail, wir melden uns zeitnah zurück.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:kontakt@pruefcheckpro.de"
                className="text-sm font-medium text-primary hover:underline"
              >
                kontakt@pruefcheckpro.de
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nachricht senden</CardTitle>
              <CardDescription>
                Die Formularanbindung wird in einem späteren Schritt ergänzt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
