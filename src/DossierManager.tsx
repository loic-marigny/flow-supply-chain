// src/DossierManager.tsx
// Manages the user folders (dossiers): create, rename, delete with cascade
// of inner components and BOMs. Forwards selection and actions to children.
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import ComponentList from "./ComponentList";
import { useI18n } from "./i18n/I18nProvider";
import type { ComponentType } from "./types";
import Modal from "react-modal";

type Dossier = { id: string; nom: string };

type Props = {
  // Active folder selection used elsewhere (autosave, etc.)
  onDossierSelect: (id: string) => void;
  selectedDossierId?: string | null;

  // Current user
  userId: string | null;

  // Actions forwarded to ComponentList
  onEditRequest: (component: ComponentType) => void;
  onDeleteInCanvas: (componentId: string) => void;
};

export default function DossierManager({
  onDossierSelect,
  selectedDossierId,
  userId,
  onEditRequest,
  onDeleteInCanvas,
}: Props) {
  const { t } = useI18n();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [nom, setNom] = useState("");
  // Which folders are expanded in the UI
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  // Delete folder modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Dossier | null>(null);

  const askDeleteDossier = (d: Dossier) => {
    setFolderToDelete(d);
    setIsDeleteModalOpen(true);
  };

  // Subscribe to user's folders
  useEffect(() => {
    if (!userId) {
      setDossiers([]);
      setExpanded(new Set());
      return;
    }
    const colRef = collection(db, "users", userId, "dossiers");
    const primary = query(colRef, orderBy("createdAt", "asc"), orderBy("nom", "asc"));

    let cleanup: () => void = () => {};
    const handle = (snap: any) => {
      setDossiers(snap.docs.map((d: any) => ({ id: d.id, nom: (d.data() as any).nom })));
    };
    const unsubPrimary = onSnapshot(
      primary,
      handle,
      // Fallback if composite index is missing or field absent
      () => {
        const byName = query(colRef, orderBy("nom", "asc"));
        cleanup = onSnapshot(byName, handle);
      }
    );
    cleanup = unsubPrimary;
    return () => cleanup();
  }, [userId]);

  // Create a new folder
  const ajouterDossier = async () => {
    if (!userId) return;
    const trimmed = nom.trim();
    if (!trimmed) return;
    await addDoc(collection(db, "users", userId, "dossiers"), { nom: trimmed, createdAt: serverTimestamp() });
    setNom("");
  };

  const startEdit = (d: Dossier) => {
    setEditingId(d.id);
    setEditingName(d.nom);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id: string) => {
    if (!userId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return cancelEdit();
    await updateDoc(doc(db, "users", userId, "dossiers", id), { nom: trimmed });
    cancelEdit();
  };

  // Internal helper used by the confirmation modal (no prompt)
  const actuallyDeleteDossier = async (id: string) => {
    if (!userId) return;
    const dossierRef = doc(db, "users", userId, "dossiers", id);
    const batch = writeBatch(db);
    const compsSnap = await getDocs(collection(dossierRef, "composants"));
    compsSnap.forEach((d) => batch.delete(d.ref));
    const bomsSnap = await getDocs(collection(dossierRef, "boms"));
    bomsSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(dossierRef);
    await batch.commit();
    if (id === selectedDossierId) onDossierSelect("");
  };


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

  if (!userId) return null;

  return (
    <div>
      <h2>{t('folders.title')}</h2>

      <div className="dossier-form-line">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder={t('folders.new.placeholder')}
          style={{ flex: 1 }}
        />
        <button onClick={ajouterDossier}>{t('folders.new.create')}</button>
      </div>

      <div role="listbox" aria-label="Dossiers">
        {dossiers.map((d) => {
          const isActive = d.id === selectedDossierId;
          const isOpen = expanded.has(d.id);

          return (
            <div key={d.id}>
              <div
                role="option"
                aria-selected={isActive}
                tabIndex={0}
                onClick={() => {
                  onDossierSelect(d.id);
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                    return next;
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDossierSelect(d.id);
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                      return next;
                    });
                  }
                }}
                className={`dossier-item${isActive ? " active" : ""}`}
              >
                <span className="dossier-name">
                  {editingId === d.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(d.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder={t('folders.rename.placeholder')}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    d.nom
                  )}
                </span>
                {/* Hover affordance: three dots to hint it can expand */}
                <span className="dossier-expander" aria-hidden="true">⋯</span>
                <span className="dossier-actions" onClick={(e) => e.stopPropagation()}>
                  {editingId === d.id ? (
                    <>
                      <button className="folder-icon-btn" title={t('folders.rename.save')} aria-label={t('folders.rename.save')} onClick={() => saveEdit(d.id)}>?</button>
                      <button className="folder-icon-btn" title={t('folders.rename.cancel')} aria-label={t('folders.rename.cancel')} onClick={cancelEdit}>?</button>
                    </>
                  ) : (
                    <>
                      <button className="folder-icon-btn folder-icon-edit" title={t('folders.actions.rename')} aria-label={t('folders.actions.rename')} onClick={() => startEdit(d)}>
                        <IconPencil />
                      </button>
                      <button className="folder-icon-btn folder-icon-trash" title={t('folders.actions.delete')} aria-label={t('folders.actions.delete')} onClick={() => askDeleteDossier(d)}>
                        <IconTrash />
                      </button>
                    </>
                  )}
                </span>
              </div>

              {/* Components under this folder */}
              {isOpen && (
                <div className="dossier-section-list">
                  <ComponentList
                    userId={userId}
                    dossierId={d.id}
                    onEditRequest={onEditRequest}
                    onDeleteInCanvas={onDeleteInCanvas}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Delete folder modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => { setIsDeleteModalOpen(false); setFolderToDelete(null); }}
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
        <p style={{ marginTop: 0, marginBottom: 16 }}>
          {t('folders.delete.confirm', { name: folderToDelete?.nom ?? '' })}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={() => { setIsDeleteModalOpen(false); setFolderToDelete(null); }}>{t('modal.cancel')}</button>
          <button
            onClick={async () => {
              if (folderToDelete) {
                try { await actuallyDeleteDossier(folderToDelete.id); } catch (e) { console.error(e); }
                setIsDeleteModalOpen(false);
                setFolderToDelete(null);
              }
            }}
            style={{ backgroundColor: "#d32f2f", color: "white", padding: "8px 16px", borderRadius: 4 }}
          >
            {t('folders.actions.delete')}
          </button>
        </div>
      </Modal>

    </div>
  );
}
