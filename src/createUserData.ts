// src/createUserData.ts
// Creates default user data: folders, components, and sample BOMs.
import { db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { seedDefaultBOMs } from "./seedDefaultBOMs";

/**
 * Default component (neutral values if new user)
 * — if the component already exists in Firestore, it won't be recreated.
 */
type SeedComponent = {
  name: string;
  unit_cost?: number;
  ordering_cost?: number;
  carrying_cost?: number;
  number_on_hand?: number;
  lead_time?: number;
  lot_size?: number;
};

const DEFAULT_ALPHA: SeedComponent[] = [
  { name: "Alpha", lead_time: 1, number_on_hand: 10, lot_size: 1, unit_cost: 0, ordering_cost: 0, carrying_cost: 0 },
  { name: "B",     lead_time: 2, number_on_hand: 20, lot_size: 1, unit_cost: 0, ordering_cost: 0, carrying_cost: 0 },
  { name: "C",     lead_time: 3, number_on_hand: 0,  lot_size: 1, unit_cost: 0, ordering_cost: 0, carrying_cost: 0 },
  { name: "D",     lead_time: 1, number_on_hand: 100,lot_size: 1, unit_cost: 0, ordering_cost: 0, carrying_cost: 0 },
  { name: "E",     lead_time: 1, number_on_hand: 10, lot_size: 1, unit_cost: 0, ordering_cost: 0, carrying_cost: 0 },
  { name: "F",     lead_time: 1, number_on_hand: 50, lot_size: 1, unit_cost: 0, ordering_cost: 0, carrying_cost: 0 },
];

const DEFAULT_SKATE: SeedComponent[] = [
  { name: "Skate",  lead_time: 2, number_on_hand: 650, lot_size: 1,   unit_cost: 0,     ordering_cost: 0,   carrying_cost: 0 },
  { name: "Board",  lead_time: 1, number_on_hand: 550, lot_size: 1,   unit_cost: 20,    ordering_cost: 50,  carrying_cost: 4 },
  { name: "Trucks", lead_time: 2, number_on_hand: 15,  lot_size: 100, unit_cost: 20,    ordering_cost: 65,  carrying_cost: 5 },
  { name: "Wheels", lead_time: 3, number_on_hand: 120, lot_size: 40,  unit_cost: 5,     ordering_cost: 100, carrying_cost: 1 },
  { name: "Screws", lead_time: 2, number_on_hand: 0,   lot_size: 100, unit_cost: 0.05,  ordering_cost: 50,  carrying_cost: 0.01 },
  { name: "Tire",   lead_time: 1, number_on_hand: 150, lot_size: 50,  unit_cost: 10,    ordering_cost: 80,  carrying_cost: 2 },
  { name: "Rim",    lead_time: 1, number_on_hand: 200, lot_size: 20,  unit_cost: 40,    ordering_cost: 100, carrying_cost: 6 },
];

/** Ensure the user document exists (merge to avoid overwriting). */
async function ensureUserDoc(uid: string) {
  await setDoc(
    doc(db, "users", uid),
    { createdAt: Timestamp.now() },
    { merge: true }
  );
}

/** Returns the folder id by name; creates it if missing. */
async function getOrCreateDossierId(uid: string, nom: string): Promise<string> {
  const ref = collection(db, "users", uid, "dossiers");
  const snap = await getDocs(query(ref, where("nom", "==", nom)));
  if (!snap.empty) return snap.docs[0].id;

  const created = await addDoc(ref, { nom });
  return created.id;
}

/** Upsert a component (by name) into a folder: create if absent. */
async function upsertComponent(
  uid: string,
  dossierId: string,
  c: SeedComponent
) {
  const compsRef = collection(db, "users", uid, "dossiers", dossierId, "composants");
  const snap = await getDocs(query(compsRef, where("name", "==", c.name)));
  if (!snap.empty) return; // already present

  // Default values when not provided
  const payload = {
    name: c.name,
    unit_cost: c.unit_cost ?? 0,
    ordering_cost: c.ordering_cost ?? 0,
    carrying_cost: c.carrying_cost ?? 0,
    number_on_hand: c.number_on_hand ?? 0,
    lead_time: c.lead_time ?? 1,
    lot_size: c.lot_size ?? 1,
    dossierId,
  };
  await addDoc(compsRef, payload);
}

/** Upsert a whole list of components for a given folder. */
async function upsertComponentsList(
  uid: string,
  dossierId: string,
  items: SeedComponent[]
) {
  for (const c of items) {
    // Sequential for simplicity (few items)
    await upsertComponent(uid, dossierId, c);
  }
}

/**
 * Create / update default data for a new user:
 * - Folders “Alpha” et “Skate”
 * - Default components in each folder
 * - Sample BOMs “Alpha (BOM)” and “Skate (BOM)” (via seedDefaultBOMs)
 */
export const createUserData = async (uid: string): Promise<void> => {
  // 1) User doc
  await ensureUserDoc(uid);

  // 2) Required folders
  const alphaId = await getOrCreateDossierId(uid, "Alpha");
  const skateId = await getOrCreateDossierId(uid, "Skate");

  // 3) Required components
  await upsertComponentsList(uid, alphaId, DEFAULT_ALPHA);
  await upsertComponentsList(uid, skateId, DEFAULT_SKATE);

  // 4) Default BOMs
  try {
    await seedDefaultBOMs(uid);
  } catch (e) {
    // Never block onboarding for this
    console.warn("Seeding default BOMs failed:", e);
  }
};
