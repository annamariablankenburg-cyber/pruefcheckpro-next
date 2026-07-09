import type { Project } from "@/types/project";
import { createIdConverter } from "@/lib/firebase/converters/createConverter";

export const projectConverter = createIdConverter<Project, "id">("id");
