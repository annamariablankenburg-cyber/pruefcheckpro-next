import { aiChats, aiTools, aiContextCards, aiQuickActions, aiRecentResults } from "@/config/ai";
import type { AiChat } from "@/types/ai";
import { createArrayRepository } from "@/lib/repositories/base/createArrayRepository";

const chatsBase = createArrayRepository<AiChat>(aiChats, (chat) => chat.id);

// Bespoke Repository: nur aiChats ist ein echtes Entity-Array (nutzt den
// Basis-Baustein), Tools/Kontextkarten/Schnellaktionen/Ergebnisse sind
// schreibgeschützte Referenzlisten (Kontextkarten sind zudem bereits in
// config/ai.ts aus samples/projects/customers/reports zusammengeführt).
export const aiRepository = {
  ...chatsBase,
  getTools() {
    return aiTools;
  },
  getContextCards() {
    return aiContextCards;
  },
  getQuickActions() {
    return aiQuickActions;
  },
  getRecentResults() {
    return aiRecentResults;
  },
};
