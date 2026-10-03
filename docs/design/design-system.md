# PrüfCheckPro Design-System

Ziel: wirkt wie hochwertige Prüf-/Labor-Software, nicht wie ein generisches SaaS-Template. Ruhig, technisch, präzise. Keine Neon-Effekte, kein Glassmorphism, keine Betontexturen.

Alle Tokens und Hilfsklassen liegen in `src/app/globals.css`. Es wurde keine neue Abhängigkeit eingeführt (`framer-motion` war bereits im Projekt).

## 1. Oberflächen-Ebenen

Nicht jede Fläche ist dieselbe Card. `<Card variant="…">`:

| Variante | Verwendung |
|---|---|
| `default` | Standard, sehr leichter Schatten |
| `flat` | ruhige Nebenflächen, Hinweise, leere Zustände (kein Schatten) |
| `elevated` | Kennzahlen, große Dashboard-Karten, Kalender |
| `highlight` | Fokus/Empfehlung: feiner Primärfarb-Verlauf (z. B. KI-Karte, empfohlener Tarif) |

`interactive` ergänzt Hover-Anhebung, reagierenden Rand/Schatten und den Swosh (siehe 3). Nur für klickbare Karten verwenden. Kennzahlen-Karten sind bewusst nicht interaktiv.

CSS-Pendants für Nicht-Card-Elemente: `.surface-flat`, `.surface-raised`, `.surface-elevated`, `.surface-highlight`.

Schatten: `--elev-1/2/3` (leicht blau getönt, im Dunkelmodus angepasst). Verwendung: `shadow-(--elev-2)`.

## 2. Typografie

| Klasse | Zweck |
|---|---|
| `.page-title` | Seitenüberschrift (fluid, enge Laufweite) |
| `.display-title` | Marketing-Überschrift |
| `.section-title` | Abschnittstitel |
| `.label-caps` | ruhige Beschriftung (Labels, Eyebrows) |
| `.num` | Zahlen/KPIs: tabellarische Ziffern, enge Laufweite |

Schriftart (Geist) unverändert. **Einheiten nie versal setzen** (`N/mm²` darf nicht zu `N/MM²` werden), daher kein `uppercase` auf Einheiten.

## 3. Bewegung

- Dauer 150–250 ms (`--dur-fast/base/slow`), Easing `--ease-out-soft` (`ease-(--ease-out-soft)`).
- Spezifische Übergänge statt `transition-all`; nur `transform`, `box-shadow`, Farben, `opacity`. Keine Layout-Sprünge.
- Hover-Bewegung immer mit `motion-safe:`; Hover ist nie Voraussetzung für die Bedienung (Tailwind-`hover:` greift nur bei echtem Hover-Gerät).
- **Swosh** (`.swoosh`): feiner diagonaler Lichtstreifen, nur bei Hover/Fokus. Eingesetzt bei `interactive`-Cards (Pricing, Feature-Karten, Fachbereichskarten) und Schnellaktionen.
- Buttons: sanftes Anheben, Pfeil-Icons (`arrow-right`/`chevron-right`) rutschen minimal nach rechts, Press-Zustand.
- Tabellen: Zeilen-Hover mit Akzentlinie links (inset-Schatten, kein Layout-Shift), aktive Zeile wenn das Aktionsmenü offen ist.
- Tabs: Aktiv-Strich wächst weich ein.
- Dialog/Drawer: leichtes Einblenden/Hochgleiten mit weichem Easing.
- **Reduced Motion:** globale `prefers-reduced-motion`-Regel setzt Animationen/Übergänge praktisch aus, blendet Swosh/Shimmer aus; `FadeIn` überspringt den Versatz.

## 4. Technische Identität

Dezente Messtechnik-Details, nur als Hintergrund:

- `.tech-grid`, `.tech-grid-fine` (feines Raster), `.tech-fade` (Ausblenden zum Rand)
- `.ruler-x` (Messskala mit Teilstrichen), z. B. unter Sidebar-Logo, Hero, CTA, Company-Kopf
- Eyebrow-Marke mit Skalenstrichen in `SectionHeading`
- Logo: eigenes Zeichen (Häkchen über Messskala), `LogoMark` in `Logo.tsx`

## 5. Leere Zustände und Laden

- `EmptyState`: Icon-Kachel auf Raster, Erklärung, optional Titel/Aktion (`icon`, `title`, `action`, bestehende Aufrufe bleiben gültig).
- `.skeleton` / `.skeleton-rows`: strukturierte Platzhalter (Balken bzw. Tabellenzeilen) mit Shimmer statt grauer Boxen.

## 6. Barrierefreiheit

- Sichtbare Fokuszustände an Navigation, Chips, Karten-Links, Tabs, Buttons.
- `aria-current="page"` in Sidebar und Bottom-Navigation; Tabs mit `role="tablist"`/`aria-selected`.
- Dunkelmodus: `text-primary` nutzt dort ein helleres Blau (Kontrast ≥ 4,5:1); Flächen bleiben unverändert.
- Mobile: Bottom-Navigation berücksichtigt Safe-Area, Hover-Effekte sind reine Zugabe.

## 7. Bewusst nicht Teil des Passes

Keine Daten-, Service-, Hook-, Rules- oder Seed-Änderungen; keine Datenmodelle; keine neuen Abhängigkeiten.
