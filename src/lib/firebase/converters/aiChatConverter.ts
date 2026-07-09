import type { AiChat } from "@/types/ai";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const aiChatConverter = createIdConverter<AiChat, "id">("id");
