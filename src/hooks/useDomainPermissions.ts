"use client";

import { usePermissions } from "@/providers/PermissionsProvider";

const NO_PERMISSIONS: Record<string, boolean> = {};

// Effektive Rechte für Fachbereichs-Komponenten, fail-closed: Solange die Rechte laden oder
// nicht geladen werden konnten, ist die Map leer (keine privilegierten Aktionen, keine Queries).
// `ready` unterscheidet "noch unbekannt" von "bekannt, aber ohne Recht".
export function useDomainPermissions(): { permissions: Record<string, boolean>; ready: boolean } {
  const { permissions, loading, error } = usePermissions();
  const ready = !loading && !error;
  return { permissions: ready ? permissions : NO_PERMISSIONS, ready };
}
