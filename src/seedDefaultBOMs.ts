// src/seedDefaultBOMs.ts
// Seeds sample BOMs (Alpha, Skate) into the user's folders if missing.
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";

type BomNode = {
  component: string;
  attributes: {
    unit_cost: number;
    ordering_cost: number;
    carrying_cost: number;
    number_on_hand: number;
    lead_time: number;
    lot_size: number;
  };
  badge_value?: number;     // multiplicity from parent
  children?: BomNode[];
};

// Helper: load components by names for a folder and return a Map(name -> data)
async function getComponentMap(
  userId: string,
  dossierId: string,
  names: string[]
) {
  const compsRef = collection(
    db,
    "users",
    userId,
    "dossiers",
    dossierId,
    "composants"
  );
  const q = query(compsRef, where("name", "in", names));
  const snap = await getDocs(q);
  const map = new Map<string, any>();
  snap.forEach((d) => map.set(d.data().name, d.data()));
  return map;
}

function makeNode(
  name: string,
  comp: any,
  badge?: number,
  children?: BomNode[]
): BomNode {
  return {
    component: name,
    attributes: {
      unit_cost: comp?.unit_cost ?? 0,
      ordering_cost: comp?.ordering_cost ?? 0,
      carrying_cost: comp?.carrying_cost ?? 0,
      number_on_hand: comp?.number_on_hand ?? 0,
      lead_time: comp?.lead_time ?? 1,
      lot_size: comp?.lot_size ?? 1,
    },
    ...(badge ? { badge_value: badge } : {}),
    ...(children && children.length ? { children } : {}),
  };
}

export async function seedDefaultBOMs(userId: string) {
  // Retrieve the folder ids for "Alpha" and "Skate"
  const dossiersRef = collection(db, "users", userId, "dossiers");
  const dsSnap = await getDocs(
    query(dossiersRef, where("nom", "in", ["Alpha", "Skate"]))
  );

  const ids: Record<string, string> = {};
  dsSnap.forEach((d) => {
    const nom = (d.data() as any).nom;
    ids[nom] = d.id;
  });

  // For each target folder, create the BOM if it does not exist
  for (const dossierName of ["Alpha", "Skate"] as const) {
    const dossierId = ids[dossierName];
    if (!dossierId) continue;

    const bomsRef = collection(
      db,
      "users",
      userId,
      "dossiers",
      dossierId,
      "boms"
    );
    const bomName = `${dossierName} (BOM)`;

    // Already exists?
    const existsSnap = await getDocs(
      query(bomsRef, where("nom", "==", bomName))
    );
    if (!existsSnap.empty) continue;

    if (dossierName === "Alpha") {
      // Alpha -> B(1), C(1); B -> D(2), C(2); C -> E(1), F(1)
      const names = ["Alpha", "B", "C", "D", "E", "F"];
      const map = await getComponentMap(userId, dossierId, names);

      const nodeC: BomNode = makeNode("C", map.get("C"), undefined, [
        makeNode("E", map.get("E"), 1),
        makeNode("F", map.get("F"), 1),
      ]);

      const root: BomNode = makeNode("Alpha", map.get("Alpha"), undefined, [
        makeNode("B", map.get("B"), 1, [
          makeNode("D", map.get("D"), 2),
        { ...nodeC, badge_value: 2 }, // C x2 under B
        ]),
        { ...nodeC, badge_value: 1 },   // C x1 under Alpha
      ]);

      await addDoc(bomsRef, {
        createdAt: Timestamp.now(),
        nom: bomName,
        bom: root,
      });
    } else {
      // Skate -> Board(1), Trucks(2), Wheels(4), Screws(8)
      // Wheels -> Tire(1), Rim(1), Screws(4)
      const names = ["Skate", "Board", "Trucks", "Wheels", "Screws", "Tire", "Rim"];
      const map = await getComponentMap(userId, dossierId, names);

      const wheelsNode: BomNode = makeNode("Wheels", map.get("Wheels"), 4, [
        makeNode("Tire", map.get("Tire"), 1),
        makeNode("Rim", map.get("Rim"), 1),
        makeNode("Screws", map.get("Screws"), 4),
      ]);

      const root: BomNode = makeNode("Skate", map.get("Skate"), undefined, [
        makeNode("Board", map.get("Board"), 1),
        makeNode("Trucks", map.get("Trucks"), 2),
        wheelsNode,
        makeNode("Screws", map.get("Screws"), 8),
      ]);

      await addDoc(bomsRef, {
        createdAt: Timestamp.now(),
        nom: bomName,
        bom: root,
      });
    }
  }
}
