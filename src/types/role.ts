import type { LucideIcon } from "lucide-react";

export type RoleType = "System" | "Benutzerdefiniert";
export type RoleStatus = "Aktiv" | "Archiviert";

// Nur Farben aus dem bestehenden Design-System, keine neuen Farben erfinden.
export type RoleColor = "primary" | "success" | "warning" | "danger" | "neutral";

export interface Permission {
  key: string;
  label: string;
}

export interface PermissionCategoryDef {
  key: string;
  label: string;
  icon: LucideIcon;
  permissions: Permission[];
}

// Rolle als Verwaltungsdatensatz (companies/{companyId}/roles/{roleId}).
// Die Dokument-ID ist `id` und wird nie als Datenfeld gespeichert.
//
// Rollen und Berechtigungen steuern heute die Verwaltungslogik und Darstellung,
// NICHT die serverseitige Zugriffskontrolle (keine Rules-Auswertung, keine
// Custom Claims).
export interface Role {
  id: string;
  name: string;
  description: string;
  // "System" = stabile Basisrolle (admin, laborleiter, pruefer, azubi, gast):
  // nie löschen/archivieren, Name nicht änderbar. "Benutzerdefiniert" =
  // vom Unternehmen angelegt.
  type: RoleType;
  color: RoleColor;
  // "Archiviert" = nicht mehr für neue Zuweisungen wählbar; bestehende
  // Zuweisungen bleiben erhalten. Es gibt kein Hard Delete.
  status: RoleStatus;
  // permission.key -> gewährt ja/nein (Schlüssel siehe config/roles.ts)
  permissions: Record<string, boolean>;
  // ISO-Strings; fehlen bei reinen Mock-Altdaten nie, bei Firestore-Altdaten
  // aber möglich.
  createdAt?: string;
  updatedAt?: string;
}
