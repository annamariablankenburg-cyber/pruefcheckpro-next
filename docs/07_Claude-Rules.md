# PrüfCheckPro – Claude Code Regeln

Version: 1.0

---

# Ziel

Diese Regeln gelten für alle Änderungen am Projekt.

Claude Code soll konsistenten, wartbaren und professionellen Code erzeugen.

---

# Grundregeln

- TypeScript verwenden
- Keine Inline-CSS
- Tailwind CSS verwenden
- shadcn/ui bevorzugen
- Wiederverwendbare Komponenten erstellen
- Mobile First entwickeln
- Responsive Layouts
- Barrierefreiheit beachten

---

# Komponenten

Neue Komponenten gehören ausschließlich in:

components/

Keine doppelten Komponenten erstellen.

---

# Farben

Nur Farben aus dem Design-System verwenden.

Keine neuen Farben erfinden.

---

# Buttons

Nur vorhandene Button-Komponenten verwenden.

Keine eigenen Buttons erstellen.

---

# Icons

Nur Lucide Icons.

---

# Animationen

Nur Framer Motion.

Keine CSS-Keyframes ohne Grund.

---

# Routing

Next.js App Router verwenden.

---

# Firebase

Alle Firebase-Aufrufe kapseln.

Keine Firebase-Logik direkt in Seiten.

---

# Firestore

Immer Security Rules beachten.

---

# Forms

React Hook Form

+

Zod

---

# Codequalität

Jede Funktion muss:

- verständlich
- klein
- dokumentiert
- testbar

sein.

---

# Kommentare

Nur dort kommentieren, wo Logik nicht offensichtlich ist.

---

# Performance

- Lazy Loading
- Dynamic Imports
- Optimierte Bilder
- Keine unnötigen Re-Renders

---

# UX

Jede Aktion benötigt:

- Ladezustand
- Fehlermeldung
- Erfolgsmeldung

---

# Verboten

- Inline Styles
- Any-Typen
- Doppelte Logik
- Hardcodierte Texte
- Ungenutzter Code