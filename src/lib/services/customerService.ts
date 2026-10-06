import { customerRepository } from "@/lib/repositories/customerRepository";
import { firestoreCustomerService } from "@/lib/firebase/services/firestoreCustomerService";
import { resolveActiveCompanyId } from "@/lib/firebase/activeCompany";
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
      return firestoreCustomerService.getCustomers(await resolveActiveCompanyId());
    }
    return customerRepository.getAll();
  },

  async getCustomerById(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.getCustomerById(await resolveActiveCompanyId(), id);
    }
    return customerRepository.getById(id);
  },

  async createCustomer(input) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.createCustomer(await resolveActiveCompanyId(), input);
    }
    const customer: Customer = { ...input, id: generateMockCustomerId() };
    return customerRepository.create(customer);
  },

  async updateCustomer(id, changes) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.updateCustomer(await resolveActiveCompanyId(), id, changes);
    }
    return customerRepository.update(id, changes);
  },

  async archiveCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.archiveCustomer(await resolveActiveCompanyId(), id);
    }
    return customerRepository.archive(id);
  },

  async restoreCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.restoreCustomer(await resolveActiveCompanyId(), id);
    }
    return customerRepository.restore(id);
  },

  async deactivateCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.deactivateCustomer(await resolveActiveCompanyId(), id);
    }
    return customerRepository.update(id, { status: "Inaktiv" });
  },

  async reactivateCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.reactivateCustomer(await resolveActiveCompanyId(), id);
    }
    return customerRepository.update(id, { status: "Aktiv" });
  },

  async removeCustomer(id) {
    if (isFirestoreDataSource) {
      return firestoreCustomerService.removeCustomer(await resolveActiveCompanyId(), id);
    }
    return customerRepository.remove(id);
  },
};
