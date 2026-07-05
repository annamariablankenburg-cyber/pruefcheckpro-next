import { AlertTriangle } from "lucide-react";

export default function ImpressumPage() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Impressum
        </h1>

        <div className="mt-8 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            Platzhalter-Impressum. Die vollständigen Firmendaten der RALF FISCHER GmbH werden
            noch ergänzt.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-8 text-sm text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Angaben gemäß § 5 TMG</h2>
            <p className="mt-2">
              RALF FISCHER GmbH
              <br />
              [Straße und Hausnummer]
              <br />
              [PLZ und Ort]
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Vertreten durch</h2>
            <p className="mt-2">[Name der Geschäftsführung]</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
            <p className="mt-2">
              Telefon: [Telefonnummer]
              <br />
              E-Mail: [E-Mail-Adresse]
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Registereintrag</h2>
            <p className="mt-2">
              Eintragung im Handelsregister.
              <br />
              Registergericht: [Registergericht]
              <br />
              Registernummer: [HRB-Nummer]
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Umsatzsteuer-ID</h2>
            <p className="mt-2">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [USt-IdNr.]
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <p className="mt-2">[Name, Anschrift]</p>
          </div>
        </div>
      </div>
    </section>
  );
}
