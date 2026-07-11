import type { Customer } from "@/types/customer";

// Eingabeform für Neuanlagen: die id wird von der jeweiligen Implementierung
// vergeben (Firestore: Dokument-ID via addDoc, Mock: generierte ID) – siehe
// docs/firebase/customer-firestore-slice.md. Die Kundennummer (`number`) ist
// ein reines Stammdatenfeld und bleibt davon unberührt.
export type NewCustomerInput = Omit<Customer, "id">;

// Bewusst eigene, Promise-basierte Signaturen nur für diese Domäne (statt der
// synchronen Bausteine aus src/lib/interfaces/base.ts): Kunden sind der erste
// Vertical Slice mit echter Firestore-Anbindung, alle anderen Domänen bleiben
// unverändert synchron. Siehe docs/architecture/data-access-layer.md.
export interface ICustomerService {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  createCustomer(input: NewCustomerInput): Promise<Customer>;
  updateCustomer(id: string, changes: Partial<Customer>): Promise<Customer | undefined>;
  archiveCustomer(id: string): Promise<Customer | undefined>;
  restoreCustomer(id: string): Promise<Customer | undefined>;
  deactivateCustomer(id: string): Promise<Customer | undefined>;
  reactivateCustomer(id: string): Promise<Customer | undefined>;
  removeCustomer(id: string): Promise<boolean>;
}
