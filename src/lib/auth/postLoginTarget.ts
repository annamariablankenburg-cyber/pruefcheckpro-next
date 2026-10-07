// Ziel nach Login/Registrierung. Nur ein fester Allowlist-Pfad (Einladung annehmen) darf über den
// "next"-Parameter angesteuert werden – alles andere fällt auf das Dashboard zurück (kein Open Redirect,
// keine externen oder fremden internen Ziele).
export const DEFAULT_POST_LOGIN_PATH = "/dashboard";

const INVITATION_PATH = /^\/einladung(\?[A-Za-z0-9_\-=&%.]{0,300})?$/;

export function safeNextPath(raw: string | null | undefined): string {
  if (typeof raw !== "string") return DEFAULT_POST_LOGIN_PATH;
  return INVITATION_PATH.test(raw) ? raw : DEFAULT_POST_LOGIN_PATH;
}

// Hängt ein (bereits geprüftes) next-Ziel an Login-/Registrier-Links an.
export function withNext(path: string, next: string | null | undefined): string {
  const target = safeNextPath(next);
  return target === DEFAULT_POST_LOGIN_PATH ? path : `${path}?next=${encodeURIComponent(target)}`;
}
