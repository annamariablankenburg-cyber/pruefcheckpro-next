// Reine, Firebase-SDK-unabhängige Hilfsfunktionen für die Berichte-
// Firestore-Schreib-Pipeline (siehe docs/firebase/report-firestore-slice.md,
// Abschnitt "Undefined-Werte/id-Feld"). Bewusst OHNE Import von
// src/lib/firebase/firebase.ts (keine Seiteneffekte beim Import) – diese
// Datei wird sowohl von firestoreReportService.ts (App-Laufzeit) als auch
// von scripts/seedReports.ts (eigener, emulator-only Firestore-Client)
// genutzt und darf daher nie die echte firebaseConfig anfassen.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// Entfernt rekursiv alle Properties mit dem Wert `undefined` – Firestore
// lehnt solche Felder bei addDoc()/updateDoc()/setDoc() ab ("Unsupported
// field value: undefined"). Bewusst NUR `undefined` gefiltert: `false`, `0`,
// `""`, leere Arrays/Objekte (`[]`/`{}`) und `null` sind gültige, bewusst
// gesetzte Werte und bleiben unverändert erhalten. Steigt in Arrays und
// einfache Objekte ab (z. B. Report.emailHistory[].cc/bcc); in Arrays werden
// `undefined`-Elemente zusätzlich entfernt (nicht nur auf `undefined`
// gesetzt belassen), da Firestore auch `undefined` als Array-Element ablehnt
// – alle übrigen Elemente werden wie Objekt-Properties rekursiv sanitized.
// Lässt Spezialobjekte (Date, Firestore-FieldValue-Sentinels wie
// deleteField()) unverändert, da deren Prototyp nicht Object.prototype ist.
export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) continue;
      result[key] = sanitizeForFirestore(entry);
    }
    return result as T;
  }
  return value;
}

// Entfernt ein eventuell vorhandenes "id"-Feld aus einem Objekt, bevor es als
// Firestore-Dokumentinhalt geschrieben wird. Report.id ist ausschließlich die
// Firestore-Dokument-ID (vom reportConverter beim Lesen injiziert, siehe
// converters/reportConverter.ts) – sie darf nie zusätzlich als normales
// Datenfeld im Dokument landen, unabhängig davon, ob ein Caller versehentlich
// ein vollständiges Report-Objekt (inkl. id) statt eines reinen Änderungs-/
// Eingabe-Objekts übergibt (z. B. { ...subject, status: nextStatus }).
export function withoutIdField<T extends object>(value: T): Omit<T, "id"> {
  const rest = { ...value } as unknown as Record<string, unknown>;
  delete rest.id;
  return rest as Omit<T, "id">;
}
