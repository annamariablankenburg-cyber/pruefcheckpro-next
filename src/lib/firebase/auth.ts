import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseAuthUser,
} from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase/client";

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signUp(email: string, password: string, displayName?: string) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  return credential;
}

export function signOutUser() {
  return signOut(firebaseAuth);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth, email);
}

export function onAuthChange(callback: (user: FirebaseAuthUser | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}
