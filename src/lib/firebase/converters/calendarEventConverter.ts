import type { CalendarEvent } from "@/types/calendarEvent";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const calendarEventConverter = createIdConverter<CalendarEvent, "id">("id");
