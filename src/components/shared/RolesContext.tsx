"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Role } from "@/types/role";

// Reicht die EINE useRoles()-Instanz der Company-Seite an reine Anzeige-
// Komponenten weiter (Rollen-Badge, Berechtigungsübersicht), ohne `roles` durch
// jede Tabelle zu schleifen. Es entsteht kein zweiter State: der Provider
// transportiert nur die Liste der Seite. Ohne Provider (oder solange Rollen
// laden) bleibt die Liste leer – Komponenten fallen dann auf den gespeicherten
// Rollennamen (Snapshot) zurück.
const RolesContext = createContext<Role[]>([]);

export function RolesProvider({ roles, children }: { roles: Role[]; children: ReactNode }) {
  return <RolesContext.Provider value={roles}>{children}</RolesContext.Provider>;
}

export function useRoleList(): Role[] {
  return useContext(RolesContext);
}
