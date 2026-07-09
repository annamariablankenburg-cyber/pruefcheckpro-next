# Firebase Services (Platzhalter)

Status: **Struktur-Vorbereitung – noch keine Implementierung.**

Hier entstehen später die Firestore-Implementierungen der Interfaces aus
`src/lib/interfaces/` (z. B. eine `firestoreCustomerService.ts`, die
`ICustomerService` gegen echte Firestore-Aufrufe statt gegen
`customerRepository` implementiert – siehe `docs/architecture/data-access-layer.md`).

Heute bewusst leer: Dieser Sprint bereitet nur die Infrastruktur vor
(Init, Collection-Konstanten, Converter-Struktur), noch keine
Firestore-CRUD-Logik.
