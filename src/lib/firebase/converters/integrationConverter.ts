import type { Integration, Webhook } from "@/types/integration";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const integrationConverter = createIdConverter<Integration, "id">("id");
export const webhookConverter = createIdConverter<Webhook, "id">("id");
