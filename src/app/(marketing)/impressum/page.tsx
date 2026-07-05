export default function ImpressumPage() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Impressum
        </h1>

        <div className="mt-10 flex flex-col gap-8 text-sm text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Angaben gemäß § 5 DDG</h2>
            <p className="mt-2">
              RALF FISCHER GmbH
              <br />
              Michaelsteiner Straße 29 c
              <br />
              38889 Blankenburg
              <br />
              Deutschland
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Vertreten durch</h2>
            <p className="mt-2">Ralf Fischer</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Registereintrag</h2>
            <p className="mt-2">
              Eintragung im Handelsregister.
              <br />
              Registergericht: Amtsgericht Stendal
              <br />
              Registernummer: HRB 20634
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Kontakt</h2>
            <p className="mt-2">
              Telefon: 03944 36 28 96
              <br />
              Telefax: 03944 362897
              <br />
              E-Mail: info-pruefcheckpro@web.de
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Umsatzsteuer-ID</h2>
            <p className="mt-2">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE295720384
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Berufshaftpflichtversicherung</h2>
            <p className="mt-2">
              ÖSA Magdeburg
              <br />
              Am Alten Theater 7
              <br />
              39104 Magdeburg
              <br />
              Geltungsraum der Versicherung: Deutschland
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Redaktionell verantwortlich gemäß § 18 Abs. 2 MStV
            </h2>
            <p className="mt-2">Ralf Fischer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
