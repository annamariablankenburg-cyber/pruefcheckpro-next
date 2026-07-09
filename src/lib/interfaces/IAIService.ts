import type { Create, GetAll, GetById, Remove, Update } from "@/lib/interfaces/base";
import type { AiChat, AiContextCard, AiMode, AiQuickAction, AiTool } from "@/types/ai";
import type { RecordListItem } from "@/components/shared/RecordList";

export interface IAIService {
  getAiChats: GetAll<AiChat>;
  getAiChatById: GetById<AiChat>;
  createAiChat: Create<AiChat>;
  updateAiChat: Update<AiChat>;
  removeAiChat: Remove;
  getAiModes(): AiMode[];
  getAiTools(): AiTool[];
  getAiContextCards(): AiContextCard[];
  getAiQuickActions(): AiQuickAction[];
  getAiRecentResults(): RecordListItem[];
}
