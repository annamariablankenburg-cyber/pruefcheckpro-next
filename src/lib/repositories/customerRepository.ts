import { customers } from "@/config/customers";
import type { Customer } from "@/types/customer";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const base = createArrayRepository<Customer>(customers, (customer) => customer.id);

export const customerRepository = {
  ...base,
  archive(id: string) {
    return base.update(id, { status: "Archiviert" } as Partial<Customer>);
  },
  restore(id: string) {
    return base.update(id, { status: "Aktiv" } as Partial<Customer>);
  },
};
