"use client";

import { useEffect, useState } from "react";

import { isFirestoreDataSource } from "@/config/dataSource";
import { parseDateDE } from "@/lib/calendar/calendarDates";

// Bezugsdatum ("heute") für datumsabhängige Ansichten.
//
// - Mock-Modus: das feste Demo-Datum der jeweiligen Mockdaten, damit die
//   bisherigen Demo-Daten sichtbar bleiben.
// - Firestore-Modus: das echte lokale Datum. Es wird erst nach dem Mount
//   gesetzt, damit die statisch prerenderte Seite nicht mit dem Build-Datum
//   hydratisiert wird. Bis dahin ist der Wert null.
export function useReferenceDate(mockDemoDate: string): Date | null {
  const [referenceDate, setReferenceDate] = useState<Date | null>(() =>
    isFirestoreDataSource ? null : parseDateDE(mockDemoDate)
  );

  useEffect(() => {
    if (isFirestoreDataSource) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReferenceDate(new Date());
    }
  }, []);

  return referenceDate;
}
