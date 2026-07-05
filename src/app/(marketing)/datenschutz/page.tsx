import { AlertTriangle } from "lucide-react";

const sections = [
  {
    title: "1. Verantwortlicher",
    text: "Verantwortlich für die Datenverarbeitung auf dieser Website ist die RALF FISCHER GmbH. Die vollständigen Kontaktdaten werden gemeinsam mit dem Impressum ergänzt.",
  },
  {
    title: "2. Erhebung und Speicherung personenbezogener Daten",
    text: "Beim Besuch dieser Website sowie bei der Nutzung von PrüfCheckPro werden personenbezogene Daten verarbeitet, etwa bei der Registrierung, im Kontaktformular oder durch die Nutzung einzelner Funktionen. Details zu Art, Umfang und Zweck der Verarbeitung folgen in der finalen Fassung.",
  },
  {
    title: "3. Cookies und Tracking",
    text: "PrüfCheckPro kann technisch notwendige Cookies einsetzen. Ob und in welchem Umfang Analyse- oder Marketing-Tools eingesetzt werden, wird vor dem Launch final festgelegt und dokumentiert.",
  },
  {
    title: "4. Hosting und Firebase",
    text: "PrüfCheckPro nutzt für Authentifizierung, Datenbank und Speicher Dienste von Firebase (Google). Eine detaillierte Beschreibung der Datenverarbeitung durch Firebase folgt, sobald die Integration produktiv ist.",
  },
  {
    title: "5. Deine Rechte",
    text: "Dir stehen die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch zu. Details zur Ausübung dieser Rechte werden in der finalen Fassung ergänzt.",
  },
  {
    title: "6. Änderungen dieser Datenschutzerklärung",
    text: "Diese Datenschutzerklärung wird vor dem Launch von PrüfCheckPro final rechtlich geprüft und bei Bedarf angepasst.",
  },
];

export default function DatenschutzPage() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Datenschutzerklärung
        </h1>

        <div className="mt-8 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            Diese Datenschutzerklärung ist ein strukturierter Platzhalter und wird vor dem
            Launch final rechtlich geprüft.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-8 text-sm text-muted-foreground">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
