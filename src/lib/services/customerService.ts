import { customerRepository } from "@/lib/repositories/customerRepository";
import type { ICustomerService } from "@/lib/interfaces/ICustomerService";

// Nutzt heute ausschließlich customerRepository (Mock-Daten). Bei der
// echten Anbindung wird nur die Implementierung hier ersetzt (z. B. durch
// Firestore-Aufrufe) — die ICustomerService-Signatur bleibt gleich.
export const customerService: ICustomerService = {
  getCustomers() {
    return customerRepository.getAll();
  },
  getCustomerById(id) {
    return customerRepository.getById(id);
  },
  createCustomer(customer) {
    return customerRepository.create(customer);
  },
  updateCustomer(id, changes) {
    return customerRepository.update(id, changes);
  },
  archiveCustomer(id) {
    return customerRepository.archive(id);
  },
  restoreCustomer(id) {
    return customerRepository.restore(id);
  },
  removeCustomer(id) {
    return customerRepository.remove(id);
  },
};
