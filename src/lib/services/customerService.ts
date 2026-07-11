import { customerRepository } from "@/lib/repositories/customerRepository";
import { firestoreCustomerService } from "@/lib/firebase/services/firestoreCustomerService";
import { resolveCompanyId } from "@/lib/firebase/companyContext";
import { isFirestoreDataSource } from "@/config/dataSource";
import type { ICustomerService } from "@/lib/interfaces/ICustomerService";
import type { Customer } from "@/types/customer";

// Facade: brancht je nach NEXT_PUBLIC_DATA_SOURCE zwischen dem synchronen
// Mock-Repository und der echten Firestore-Implementierung. Aufrufer (Hook,
// UI) kennen nur diese ICustomerService-Signatur und wissen nicht, welche
// Quelle gerade aktiv ist – siehe docs/architecture/data-access-layer.md und
// docs/firebase/customer-firestore-slice.md.
function generateMockCustomerId(): string {
  return `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const customerService: ICustomerService = {
  async getCustomers() {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.getCustomers(resolveCompanyId());
    }
    return customerRepository.getAll();
  },

  async getCustomerById(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.getCustomerById(resolveCompanyId(), id);
    }
    return customerRepository.getById(id);
  },

  async createCustomer(input) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.createCustomer(resolveCompanyId(), input);
    }
    const customer: Customer = { ...input, id: generateMockCustomerId() };
    return customerRepository.create(customer);
  },

  async updateCustomer(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.updateCustomer(resolveCompanyId(), id, changes);
    }
    return customerRepository.update(id, changes);
  },

  async archiveCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.archiveCustomer(resolveCompanyId(), id);
    }
    return customerRepository.archive(id);
  },

  async restoreCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.restoreCustomer(resolveCompanyId(), id);
    }
    return customerRepository.restore(id);
  },

  async deactivateCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.deactivateCustomer(resolveCompanyId(), id);
    }
    return customerRepository.update(id, { status: "Inaktiv" });
  },

  async reactivateCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.reactivateCustomer(resolveCompanyId(), id);
    }
    return customerRepository.update(id, { status: "Aktiv" });
  },

  async removeCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.removeCustomer(resolveCompanyId(), id);
    }
    return customerRepository.remove(id);
  },
};
