import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

// Gemeinsamer Baustein für die domänenspezifischen Converter in diesem
// Ordner: Firestore speichert die Dokument-ID separat (snapshot.id), nicht
// als Datenfeld, während die Domänentypen (Customer, Project, ...) ihre ID
// als normales Feld führen (meist "id", bei TestEntry "sampleId"). Reines
// Feld-Mapping – keine Firestore-Lese-/Schreibaufrufe.
export function createIdConverter<T extends object, K extends keyof T & string>(
  idField: K
): FirestoreDataConverter<T> {
  return {
    toFirestore(item: T): DocumentData {
      const data = { ...item } as Record<string, unknown>;
      delete data[idField];
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      const data = snapshot.data(options);
      return { ...(data as T), [idField]: snapshot.id } as T;
    },
  };
}
