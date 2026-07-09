import type { Timestamp } from "firebase/firestore";

// Gemeinsame Hilfstypen für Converter (siehe src/lib/firebase/converters/).
// Rein strukturell – keine Firestore-Aufrufe.

// Die meisten Domänentypen (Customer, Project, ...) tragen ihr id-Feld schon
// im TypeScript-Interface, Firestore speichert die ID aber separat als
// Dokument-ID (snapshot.id), nicht als Datenfeld. WithoutId<T> beschreibt die
// Form, die tatsächlich im Dokument-Body landet.
export type WithoutId<T extends { id: string }> = Omit<T, "id">;

// Für Domänen, deren Primärschlüssel nicht "id" heißt (z. B. TestEntry über
// "sampleId").
export type WithoutKey<T, K extends keyof T> = Omit<T, K>;

// Felder, die in Firestore als serverseitiger Timestamp geführt werden
// (z. B. createdAt/lastLogin), sind im UI-Prototyp bisher einfache
// ISO-Strings (siehe types/user.ts). Dieser Typ macht die Umstellung eines
// Feldes von string auf Timestamp explizit, sobald ein Converter sie braucht.
export type WithTimestamp<T, K extends keyof T> = Omit<T, K> & Record<K, Timestamp>;
