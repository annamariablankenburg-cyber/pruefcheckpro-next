import { PricingCard } from "@/components/shared/PricingCard";
import { CtaSection } from "@/components/shared/CtaSection";
import { pricingPlans } from "@/config/pricing";

export default function PreisePage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Preise
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Vom kostenlosen Einstieg für Azubis bis zur Enterprise-Lösung für Unternehmen mit
            mehreren Standorten.
          </p>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Noch Fragen zu unseren Plänen?"
        description="Unser Team hilft dir, den passenden Plan für dein Labor oder Unternehmen zu finden."
        primaryLabel="Kostenlos starten"
        primaryHref="/login"
        secondaryLabel="Kontakt aufnehmen"
        secondaryHref="/kontakt"
      />
    </>
  );
}
