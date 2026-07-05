import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import type { AppUser } from "@/types/user";

interface NewUserProfileInput {
  firstName: string;
  lastName: string;
  email: string;
}

function toIsoString(value: unknown): string | undefined {
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined;
}

export async function createUserProfile(uid: string, input: NewUserProfileInput): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    id: uid,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    role: "azubi",
    plan: "azubi",
    language: "de",
    theme: "system",
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
}

export async function updateLastLogin(uid: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { lastLogin: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    plan: data.plan,
    companyId: data.companyId,
    laboratoryId: data.laboratoryId,
    language: data.language,
    theme: data.theme,
    createdAt: toIsoString(data.createdAt),
    lastLogin: toIsoString(data.lastLogin),
  };
}
