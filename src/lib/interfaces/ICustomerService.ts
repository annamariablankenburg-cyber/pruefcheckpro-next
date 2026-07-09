import type { Create, GetAll, GetById, Remove, StatusTransition, Update } from "@/lib/interfaces/base";
import type { Customer } from "@/types/customer";

export interface ICustomerService {
  getCustomers: GetAll<Customer>;
  getCustomerById: GetById<Customer>;
  createCustomer: Create<Customer>;
  updateCustomer: Update<Customer>;
  archiveCustomer: StatusTransition<Customer>;
  restoreCustomer: StatusTransition<Customer>;
  removeCustomer: Remove;
}
