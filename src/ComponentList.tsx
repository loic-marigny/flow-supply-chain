// src/ComponentList.tsx
// Renders the list of components and saved BOMs for a given folder.
// Handles drag-and-drop to the canvas and guarded deletion with a modal.
import { useEffect, useState, useCallback } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  type DocumentData,
  doc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import Modal from "react-modal";
import { useI18n } from "./i18n/I18nProvider";
import ComponentCard from "./ComponentCard";
import type { ComponentType } from "./types";

type ExtendedComponentType = ComponentType & { isBOM?: boolean };

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path d="M9 3h6a1 1 0 0 1 1 1v2h4v2h-1l-1 13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 8H3V6h4V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1Zm-2 4h2v9H8V10Zm6 0h2v9h-2V10Z" />
  </svg>
);
const IconPencil = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0L15 4.83l3.75 3.75 1.96-1.54Z" />
  </svg>
);

type Props = {
  userId: string;
  dossierId: string;
  onEditRequest: (component: ComponentType) => void;
  onDeleteInCanvas: (componentId: string) => void;
};

function normalizeComponent(docData: DocumentData, id: string, dossierId: string): ComponentType {
  return {
    id,
    name: docData.name,
    unit_cost: docData.unit_cost,
    ordering_cost: docData.ordering_cost,
    carrying_cost: docData.carrying_cost,
    number_on_hand: docData.number_on_hand,
    lead_time: docData.lead_time,
    lot_size: docData.lot_size,
    badge_value: docData.badge_value ?? 1,
    dossierId,
  };
}

export default function ComponentList({ userId, dossierId, onEditRequest, onDeleteInCanvas }: Props) {
  const { t } = useI18n();
  const [componentItems, setComponentItems] = useState<ExtendedComponentType[]>([]);
  const [bomItems, setBomItems] = useState<ExtendedComponentType[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExtendedComponentType | null>(null);
  const [blockingBomName, setBlockingBomName] = useState<string | null>(null);


  useEffect(() => {
    if (!userId || !dossierId) return;

    const compsRef = query(
      collection(db, "users", userId, "dossiers", dossierId, "composants"),
      orderBy("name", "asc")
    );
    const unsubComps = onSnapshot(compsRef, (snap) => {
      const data = snap.docs.map(d => normalizeComponent(d.data(), d.id, dossierId));
      setComponentItems(data);
    });

    const bomsRef = query(
      collection(db, "users", userId, "dossiers", dossierId, "boms"),
      orderBy("nom", "asc")
    );
    const unsubBoms = onSnapshot(bomsRef, (snap) => {
      const bomCards = snap.docs.map((d) => {
        const data = d.data() as any;
        const bom = data.bom;
        return {
          id: d.id,
          name: data.nom,
          lead_time: bom.attributes.lead_time,
          unit_cost: bom.attributes.unit_cost,
          number_on_hand: bom.attributes.number_on_hand,
          ordering_cost: bom.attributes.ordering_cost,
          carrying_cost: bom.attributes.carrying_cost,
          lot_size: bom.attributes.lot_size,
          badge_value: (bom.children?.length ?? 0),
          dossierId,
          isBOM: true,
        } as ExtendedComponentType;
      });
      setBomItems(bomCards);
    });

    return () => {
      unsubComps();
      unsubBoms();
    };
  }, [userId, dossierId]);

  const findBomUsingComponent = useCallback(
    async (comp: ExtendedComponentType) => {
      const bomsRef = collection(db, "users", userId, "dossiers", dossierId, "boms");
      const snap = await getDocs(bomsRef);

      const matchComponent = (node: any): boolean => {
        if (node?.componentId && node.componentId === comp.id) return true;
        if (!node?.componentId && node?.component === comp.name) return true;
        return false;
      };

      const search = (node: any): boolean => {
        if (!node) return false;
        if (matchComponent(node)) return true;
        const children = node.children || [];
        for (const ch of children) if (search(ch)) return true;
        return false;
      };

      for (const d of snap.docs) {
        const data = d.data() as any;
        if (search(data.bom)) return data.nom as string;
      }
      return null;
    },
    [userId, dossierId]
  );

  const performDelete = async () => {
    if (!itemToDelete) return;
    const isBom = !!itemToDelete.isBOM;
    const kind = isBom ? "boms" : "composants";
    try {
      const ref = doc(db, "users", userId, "dossiers", dossierId, kind, itemToDelete.id);
      await deleteDoc(ref);
      if (!isBom) onDeleteInCanvas(itemToDelete.id);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setBlockingBomName(null);
    } catch (e) {
      console.error(e);
      alert("Suppression impossible. Réessaie plus tard.");
    }
  };

  return (
    <div className="source-list-zone" style={{ padding: 8 }}>
      <ul className="component-list">
        {[...componentItems, ...bomItems].map((c) => (
          <li
            key={c.id}
            draggable
            className="component-list-item"
            style={{ position: "relative" }}
            title={c.name}
            onDragStart={(e) => {
              const newId =
                typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
                  ? `c-${(crypto as any).randomUUID()}`
                  : `c-${c.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

              const json = JSON.stringify({ id: newId, type: c.isBOM ? "bom" : "componentNode", data: c });
              e.dataTransfer.setData("application/reactflow", json);
              e.dataTransfer.setData("text/plain", json);
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            <ComponentCard
              name={c.name}
              leadTime={c.lead_time}
              unitCost={c.unit_cost}
              onHand={c.number_on_hand}
              orderingCost={c.ordering_cost}
              carryingCost={c.carrying_cost}
              lotSize={c.lot_size}
              badgeValue={c.badge_value ?? 1}
              sourceView
              minimal={!!c.isBOM}
              style={{ backgroundColor: c.isBOM ? "#800000" : undefined, color: c.isBOM ? "white" : undefined }}
            />

            <button
              type="button"
              className="icon-btn icon-trash"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              aria-label={t('list.actions.delete.aria', { kind: c.isBOM ? t('list.bom') : t('list.component'), name: c.name })}
              title={t('list.actions.delete')}
              onClick={async (e) => {
                e.stopPropagation();
                setBlockingBomName(null);
                if (!c.isBOM) {
                  const bomName = await findBomUsingComponent(c);
                  if (bomName) {
                    setItemToDelete(c);
                    setBlockingBomName(bomName);
                    setIsDeleteModalOpen(true);
                    return;
                  }
                }
                setItemToDelete(c);
                setIsDeleteModalOpen(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <IconTrash />
            </button>

            {!c.isBOM && (
              <button
                type="button"
                className="icon-btn icon-edit"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                aria-label={t('list.actions.edit.aria', { name: c.name })}
                title={t('list.actions.edit')}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRequest(c);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <IconPencil />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); setBlockingBomName(null); }}
        contentLabel={t('modal.delete.title')}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            minWidth: "360px",
          },
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>{t('modal.delete.title')}</h2>

        {blockingBomName ? (
          <>
            <p style={{ marginTop: 0, marginBottom: 16 }}>
              {t('modal.delete.blocked', { name: itemToDelete?.name ?? '', bom: blockingBomName ?? '' })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setIsDeleteModalOpen(false)}>{t('modal.ok')}</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ marginTop: 0, marginBottom: 16 }}>
              {t('modal.delete.confirm', {
                what: itemToDelete?.isBOM
                  ? t('list.what.bom', { name: itemToDelete?.name ?? '' })
                  : t('list.what.component', { name: itemToDelete?.name ?? '' })
              })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setIsDeleteModalOpen(false)}>{t('modal.cancel')}</button>
              <button
                onClick={performDelete}
                style={{ backgroundColor: "#d32f2f", color: "white", padding: "8px 16px", borderRadius: 4 }}
              >
                {t('list.actions.delete')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
