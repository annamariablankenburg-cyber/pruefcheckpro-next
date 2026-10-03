import { deleteField, type DocumentData } from "firebase/firestore";

import { sanitizeForFirestore, withoutIdField } from "@/lib/firebase/firestoreSanitize";

// Baut den Payload für updateDoc()/tx.update() aus einem Änderungsobjekt.
//
// Update-Semantik: Ein Feld mit dem Wert `undefined` bedeutet "Feld entfernen"
// (z. B. Verknüpfung lösen). sanitizeForFirestore() verwirft `undefined` nur –
// bei einem Update würde der alte Wert stehen bleiben. Deshalb wird jedes
// undefined-Feld vorher auf deleteField() gesetzt; sanitizeForFirestore()
// lässt diesen Sentinel unverändert (kein Plain Object).
//
// Die `id` wird entfernt (Dokument-ID ist nie ein Datenfeld).
//
// Bewusst ohne Datenbank-Import, damit die Funktion auch in Skripten und
// Tests ohne App-Initialisierung nutzbar ist.
export function buildUpdatePayload<T extends object>(changes: T): DocumentData {
  const withRemovals: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(withoutIdField(changes))) {
    withRemovals[key] = value === undefined ? deleteField() : value;
  }
  return sanitizeForFirestore(withRemovals);
}
