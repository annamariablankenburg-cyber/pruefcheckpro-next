// Kleine, generische Funktionstyp-Bausteine für die Service-Interfaces.
// Bewusst keine gemeinsame Basis-Schnittstelle mit fest vorgegebenen
// Methodennamen (getAll/getById/...), da jede Domäne fachlich lesbare,
// domänenspezifische Namen erhalten soll (getCustomers, getProjects, ...).
// Diese Typen sparen nur die wiederkehrende Signatur-Schreibarbeit.
export type GetAll<T> = () => T[];
export type GetById<T> = (id: string) => T | undefined;
export type Create<T> = (item: T) => T;
export type Update<T> = (id: string, changes: Partial<T>) => T | undefined;
export type Remove = (id: string) => boolean;
export type StatusTransition<T> = (id: string) => T | undefined;
