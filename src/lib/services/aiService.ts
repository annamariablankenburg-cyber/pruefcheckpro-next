import { aiRepository } from "@/lib/repositories/aiRepository";
import { aiModes } from "@/types/ai";
import type { IAIService } from "@/lib/interfaces/IAIService";

export const aiService: IAIService = {
  getAiChats() {
    return aiRepository.getAll();
  },
  getAiChatById(id) {
    return aiRepository.getById(id);
  },
  createAiChat(chat) {
    return aiRepository.create(chat);
  },
  updateAiChat(id, changes) {
    return aiRepository.update(id, changes);
  },
  removeAiChat(id) {
    return aiRepository.remove(id);
  },
  getAiModes() {
    return [...aiModes];
  },
  getAiTools() {
    return aiRepository.getTools();
  },
  getAiContextCards() {
    return aiRepository.getContextCards();
  },
  getAiQuickActions() {
    return aiRepository.getQuickActions();
  },
  getAiRecentResults() {
    return aiRepository.getRecentResults();
  },
};
