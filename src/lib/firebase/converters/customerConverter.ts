import type { Customer } from "@/types/customer";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const customerConverter = createIdConverter<Customer, "id">("id");
