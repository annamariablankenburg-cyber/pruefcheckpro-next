"use client";

import { useState } from "react";

// Gemeinsamer Baustein für Hooks, die eine Liste aus dem Repository laden und
// lokal (React State) verändern. Heute rein clientseitig, keine Firebase-
// Anbindung. Bei echter Anbindung würden update/remove/add durch Aufrufe an
// die (dann asynchrone) Repository-Schicht ersetzt.
export function useEntityList<T>(initialItems: T[], idOf: (item: T) => string) {
  const [items, setItems] = useState<T[]>(initialItems);

  function update(id: string, changes: Partial<T>) {
    setItems((current) => current.map((item) => (idOf(item) === id ? { ...item, ...changes } : item)));
  }

  function remove(id: string) {
    setItems((current) => current.filter((item) => idOf(item) !== id));
  }

  function add(item: T) {
    setItems((current) => [item, ...current]);
  }

  return { items, setItems, update, remove, add };
}
