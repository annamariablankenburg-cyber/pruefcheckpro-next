// Generischer Basis-Baustein für Repositories, die eine einzelne Mock-Datenliste
// kapseln. Arbeitet heute synchron und ausschließlich auf einer In-Memory-Kopie
// der Mock-Daten (keine Firebase-Anbindung). Bei der echten Anbindung würden
// diese Methoden durch asynchrone Firestore-Aufrufe ersetzt, ohne dass sich die
// Aufrufer-Signaturen an den Call-Sites grundlegend ändern müssten.
export interface ArrayRepository<T> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: T): T;
  update(id: string, changes: Partial<T>): T | undefined;
  remove(id: string): boolean;
  search(predicate: (item: T) => boolean): T[];
  filter(predicate: (item: T) => boolean): T[];
}

export function createArrayRepository<T>(
  initialItems: T[],
  idExtractor: (item: T) => string
): ArrayRepository<T> {
  const items: T[] = [...initialItems];

  return {
    getAll() {
      return [...items];
    },
    getById(id) {
      return items.find((item) => idExtractor(item) === id);
    },
    create(item) {
      items.push(item);
      return item;
    },
    update(id, changes) {
      const index = items.findIndex((item) => idExtractor(item) === id);
      if (index === -1) return undefined;
      items[index] = { ...items[index], ...changes };
      return items[index];
    },
    remove(id) {
      const index = items.findIndex((item) => idExtractor(item) === id);
      if (index === -1) return false;
      items.splice(index, 1);
      return true;
    },
    search(predicate) {
      return items.filter(predicate);
    },
    filter(predicate) {
      return items.filter(predicate);
    },
  };
}
