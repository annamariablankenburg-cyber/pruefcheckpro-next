"use client";

import { useEffect, useState } from "react";

// Liest den "next"-Parameter der aktuellen URL erst nach dem Mount (hydrationssicher). Der Wert ist
// ROH – vor der Verwendung immer durch safeNextPath()/withNext() (lib/auth/postLoginTarget) führen.
export function useNextParam(): string | null {
  const [next, setNext] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNext(new URLSearchParams(window.location.search).get("next"));
  }, []);
  return next;
}
