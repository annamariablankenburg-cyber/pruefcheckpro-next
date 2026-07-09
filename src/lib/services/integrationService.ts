import { integrationRepository } from "@/lib/repositories/integrationRepository";
import type { IIntegrationService } from "@/lib/interfaces/IIntegrationService";

export const integrationService: IIntegrationService = {
  getIntegrations() {
    return integrationRepository.getAllIntegrations();
  },
  getIntegrationById(id) {
    return integrationRepository.getIntegrationById(id);
  },
  updateIntegration(id, changes) {
    return integrationRepository.updateIntegration(id, changes);
  },
  getWebhooks() {
    return integrationRepository.getAllWebhooks();
  },
  getWebhookById(id) {
    return integrationRepository.getWebhookById(id);
  },
  updateWebhook(id, changes) {
    return integrationRepository.updateWebhook(id, changes);
  },
  removeWebhook(id) {
    return integrationRepository.removeWebhook(id);
  },
  getExportFormats() {
    return integrationRepository.getExportFormats();
  },
  getCloudStorage() {
    return integrationRepository.getCloudStorage();
  },
  getApiSettings() {
    return integrationRepository.getApiSettings();
  },
};
