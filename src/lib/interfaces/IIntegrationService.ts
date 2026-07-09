import type { GetAll, GetById, Remove, Update } from "@/lib/interfaces/base";
import type { ApiSettings, CloudStorageInfo, ExportFormatToggle, Integration, Webhook } from "@/types/integration";

export interface IIntegrationService {
  getIntegrations: GetAll<Integration>;
  getIntegrationById: GetById<Integration>;
  updateIntegration: Update<Integration>;
  getWebhooks: GetAll<Webhook>;
  getWebhookById: GetById<Webhook>;
  updateWebhook: Update<Webhook>;
  removeWebhook: Remove;
  getExportFormats(): ExportFormatToggle[];
  getCloudStorage(): CloudStorageInfo;
  getApiSettings(): ApiSettings;
}
