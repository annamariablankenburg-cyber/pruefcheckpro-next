import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseAuthUser,
} from "firebase/auth";

import { auth } from "@/lib/firebase/client";

export function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function onAuthChange(callback: (user: FirebaseAuthUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function isUserNotFoundError(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "auth/user-not-found";
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Diese E-Mail-Adresse ist ungültig.";
      case "auth/user-disabled":
        return "Dieses Konto wurde deaktiviert.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "E-Mail oder Passwort ist falsch.";
      case "auth/email-already-in-use":
        return "Für diese E-Mail-Adresse existiert bereits ein Konto.";
      case "auth/weak-password":
        return "Das Passwort ist zu schwach. Bitte wähle mindestens 6 Zeichen.";
      case "auth/too-many-requests":
        return "Zu viele Versuche. Bitte versuche es später erneut.";
      case "auth/network-request-failed":
        return "Netzwerkfehler. Bitte überprüfe deine Internetverbindung.";
      default:
        return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
    }
  }

  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
