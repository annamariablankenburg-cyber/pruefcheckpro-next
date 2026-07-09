import { integrations, webhooks, exportFormats, cloudStorage, apiSettings } from "@/config/integrations";
import type { Integration, Webhook } from "@/types/integration";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const integrationsBase = createArrayRepository<Integration>(integrations, (integration) => integration.id);
const webhooksBase = createArrayRepository<Webhook>(webhooks, (webhook) => webhook.id);

// Bespoke Repository: integrations/webhooks sind Entity-Arrays (nutzen den
// Basis-Baustein), exportFormats/cloudStorage/apiSettings sind Toggle-Listen
// bzw. Singletons und werden als eigene Getter angeboten.
export const integrationRepository = {
  getAllIntegrations: integrationsBase.getAll,
  getIntegrationById: integrationsBase.getById,
  updateIntegration: integrationsBase.update,
  getAllWebhooks: webhooksBase.getAll,
  getWebhookById: webhooksBase.getById,
  updateWebhook: webhooksBase.update,
  getExportFormats() {
    return exportFormats;
  },
  getCloudStorage() {
    return cloudStorage;
  },
  getApiSettings() {
    return apiSettings;
  },
};
