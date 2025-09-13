// src/lib/firestorePaths.ts
// Small helpers to build typed Firestore document/collection references.
import { collection, doc } from "firebase/firestore";
import { db } from "../firebase";

export function userDoc(uid: string) {
  return doc(db, "users", uid);
}

export function dossiersCollection(uid: string) {
  return collection(db, "users", uid, "dossiers");
}

export function dossierDoc(uid: string, dossierId: string) {
  return doc(db, "users", uid, "dossiers", dossierId);
}

export function composantsCollection(uid: string, dossierId: string) {
  return collection(db, "users", uid, "dossiers", dossierId, "composants");
}
