// src/App.tsx
// Main application shell: authentication, profile gating, split layout,
// BOM editor canvas (React Flow), and Save/Import modals.
import { useEffect, useState, useMemo } from "react";
import type React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import Modal from "react-modal";

import Navbar from "./Navbar";
import { useRef } from "react";
import Footer from "./footer";
import Login from "./Login";
import CompleteProfile from "./CompleteProfile";
import ComponentForm from "./ComponentForm";
import DossierManager from "./DossierManager";
import ComponentNodeFlow from "./ComponentNode";
import type { ComponentType } from "./types";
import { dossierDoc } from "./lib/firestorePaths";
import { validateBOM } from "./utils/bomValidation";
import { expandBOMTree } from "./utils/expandBOMTree";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useI18n } from "./i18n/I18nProvider";

// React Flow imports
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import type { Connection, Edge, Node, OnNodesChange, OnEdgesChange, NodeTypes, } from "reactflow";
import "reactflow/dist/style.css";

type ComponentNodeData = {
  component: ComponentType;
  badge_value?: number;
};


// Drag & drop helpers

const readReactflowPayload = (dt: DataTransfer): any | null => {
  const raw = dt.getData("application/reactflow") || dt.getData("text/plain");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
// ------------------------------------------------------------------


function BOMCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  nodeTypes,
  userId,
  selectedDossierId,
  onSaveClick,
  onAskImportChoice,
}: {
  nodes: Node<ComponentNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<ComponentNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  nodeTypes: NodeTypes;
  userId: string | null;
  selectedDossierId: string | null;
  onSaveClick: () => void;
  onAskImportChoice: (pack: { nodes: Node<ComponentNodeData>[]; edges: Edge[] }) => void;
}) {
  const { t } = useI18n();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const didFitRef = useRef(false);

  // Fit the graph once when the canvas mounts (or nodes first appear)
  useEffect(() => {
    if (!didFitRef.current && nodes.length > 0) {
      try { fitView({ padding: 0.6, includeHiddenNodes: true }); } catch {}
      didFitRef.current = true;
    }
  }, [nodes.length]);

  // Generate a unique React Flow node id for each drop
  const makeNodeId = (componentId: string) =>
    `n-${componentId}-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={(instance) => {
        try { instance.fitView({ padding: 0.6, includeHiddenNodes: true }); } catch {}
      }}
      onConnect={(connection: Connection) =>
        setEdges((eds) => addEdge({ ...connection, data: { qty: 1 } }, eds))
      }

      // Keep DnD responsive at canvas-level even when children intercept events
      onDragOverCapture={(e) => {
        // Always prevent default so drop works consistently,
        // even when DataTransfer.types is empty (browser dependent)
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}

      // Handle drops from the left panel (components or saved BOMs)
      onDropCapture={async (e) => {
        e.preventDefault();

        const payload = readReactflowPayload(e.dataTransfer);
        if (!payload) return;

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        if (payload.type === "bom") {
          if (!userId) return;

          // The BOM originates from the draggable card's folder; fall back to the current folder if missing
          const sourceDossierId = payload.data?.dossierId ?? selectedDossierId;
          if (!sourceDossierId) return;

          // 1) Load the BOM tree from Firestore
          const bomRef = doc(
            db,
            "users",
            userId,
            "dossiers",
            sourceDossierId,
            "boms",
            payload.data.id
          );
          const bomSnap = await getDoc(bomRef);
          const bomData = bomSnap.data()?.bom;
          if (!bomData) return;

          // 2) Convert to React Flow nodes/edges
          //    (bind to the current folder to link cards to the right context)
          const { nodes: bomNodes, edges: bomEdges } = expandBOMTree(
            bomData,
            position.x,
            position.y,
            selectedDossierId ?? sourceDossierId
          );

          // 3) If canvas is empty: replace; if SHIFT is held: merge; otherwise open the Add/Replace modal
          const canvasIsEmpty = nodes.length === 0 && edges.length === 0;

          if (canvasIsEmpty) {
            setNodes(bomNodes);
            setEdges(bomEdges);
            return;
          }

          if (e.shiftKey) {
            setNodes((prev) => [...prev, ...bomNodes]);
            setEdges((prev) => [...prev, ...bomEdges]);
            return;
          }

          onAskImportChoice({ nodes: bomNodes, edges: bomEdges });
        } else {
          // Simple component: create a unique node id each time
          setNodes((nds) =>
            nds.concat({
              id: makeNodeId(payload.id),
              type: payload.type,
              position,
              data: { component: payload.data, badge_value: 1 },
            })
          );
        }
      }}
    >
          <MiniMap />
          <Controls showFitView={false} showInteractive={false} position="top-right" style={{ top: 10, right: 10 }} />
          <Background gap={16} />
          <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 10 }}>
            <button
              onClick={onSaveClick}
              style={{
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                padding: "10px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "15px",
                position: "relative",
              }}
            >{t('canvas.save')}</button>
          </div>
        </ReactFlow>
  );
}



export default function App() {
  const { t } = useI18n();
  // Authentication and profile state
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userNomPrenom, setUserNomPrenom] = useState<{ prenom: string; nom: string } | null>(null);
  // Display name shown in the navbar (fallback: first/last -> displayName -> email)
  const display =
    (userNomPrenom ? `${userNomPrenom.prenom} ${userNomPrenom.nom}` : null) ??
    displayName ??
    userEmail ??
    null;

  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected folder
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);


  // React Flow state for the BOM canvas
  const [nodes, setNodes, onNodesChange] = useNodesState<ComponentNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  // Avoid overwriting cached canvas with empties before hydration
  const hydratedRef = useRef(false);

  // Editing state for components
  const [editingComponent, setEditingComponent] = useState<ComponentType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableDossiers, setAvailableDossiers] = useState<{ id: string; nom: string }[]>([]);
  const [selectedSaveDossierId, setSelectedSaveDossierId] = useState<string | null>(null);

  const [bomName, setBomName] = useState("");

  // Import BOM modal (user chooses Replace vs Add)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    nodes: Node<ComponentNodeData>[];
    edges: Edge[];
  } | null>(null);

  const nodeTypes = useMemo(() => ({
    componentNode: ComponentNodeFlow,
  }), []);

  // Build a BOM tree from the current canvas
  const buildBomFromCanvas = () => {
    // Build parent -> children and child -> parents maps
    const parentsMap = new Map<string, string[]>();
    const childParents = new Map<string, string[]>();
    edges.forEach((e) => {
      if (!parentsMap.has(e.source)) parentsMap.set(e.source, []);
      parentsMap.get(e.source)!.push(e.target);
      if (!childParents.has(e.target)) childParents.set(e.target, []);
      childParents.get(e.target)!.push(e.source);
    });

    // Find root: node with no parent
    const root = nodes.find((n) => !childParents.has(n.id));
    if (!root) return null;

    const getAttrs = (n: typeof nodes[number]) => ({
      unit_cost: n.data.component.unit_cost,
      ordering_cost: n.data.component.ordering_cost,
      carrying_cost: n.data.component.carrying_cost,
      number_on_hand: n.data.component.number_on_hand,
      lead_time: n.data.component.lead_time,
      lot_size: n.data.component.lot_size,
    });

    const qtyFor = (src: string, tgt: string) => {
      const edge = edges.find((e) => e.source === src && e.target === tgt);
      const q = (edge?.data as any)?.qty;
      return typeof q === "number" && q > 0 ? q : 1;
    };

    const toBom = (id: string): any => {
      const node = nodes.find((n) => n.id === id)!;
      const children = parentsMap.get(id) || [];
      return {
        component: node.data.component.name,
        componentId: node.data.component.id,
        attributes: getAttrs(node),
        badge_value: node.data.badge_value ?? 1,
        children: children.map((cid) => {
          const sub = toBom(cid);
          sub.badge_value = qtyFor(id, cid);
          return sub;
        }),
      };
    };

    return toBom(root.id);
  };

  // Listen for auth changes and populate identity
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        setDisplayName(user.displayName || null);
      } else {
        setUserId(null);
        setUserEmail(null);
        setDisplayName(null);
        setUserNomPrenom(null);
        setProfileComplete(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Realtime profile (first/last name)
  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setUserNomPrenom(null);
        setProfileComplete(false);
        return;
      }
      const d = snap.data() as any;
      const prenom = (d?.prenom ?? "").trim();
      const nom = (d?.nom ?? "").trim();
      const ok = prenom.length > 0 && nom.length > 0;
      setUserNomPrenom(ok ? { prenom, nom } : null);
      setProfileComplete(ok);
    });
    return () => unsub();
  }, [userId]);

  // Reset canvas when user changes
  useEffect(() => {
    setSelectedDossierId(null);
    setNodes([]);
    setEdges([]);
  }, [userId]);

  // Persist BOM changes (debounced)
  useEffect(() => {
    if (!selectedDossierId || !userId) return;
    const path = dossierDoc(userId, selectedDossierId);
    const t = window.setTimeout(() => {
      setDoc(path, { nodes, edges }, { merge: true }).catch(console.error);
    }, 600);
    return () => window.clearTimeout(t);
  }, [nodes, edges, selectedDossierId, userId]);

  // Cache key for BOM canvas in the current folder; falls back to a global key
  const bomKey = useMemo(() => {
    if (!userId) return null;
    // If no folder is selected, use the global "last state" cache key
    return `bom:${userId}:${selectedDossierId ?? "_last"}`;
  }, [userId, selectedDossierId]);

  // Global "last state" cache key, independent from folders
  // Global cache key for the last BOM canvas state (independent from folders)
  const bomLastKey = useMemo(() => {
    if (!userId) return null;
    return `bom:${userId}:_last`;
  }, [userId]);

  // Rehydrate canvas from cache (prefer the global key, then the folder key)
  useEffect(() => {
    if (!userId) return;
    const tryLoad = (key: string | null) => {
      if (!key) return false;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as { nodes?: any[]; edges?: any[] } | null;
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          if (nodes.length === 0 && edges.length === 0) {
            setNodes(parsed.nodes as any);
            setEdges(parsed.edges as any);
          }
          return true;
        }
      } catch {}
      return false;
    };
    if (!tryLoad(bomLastKey)) {
      tryLoad(bomKey);
    }
    hydratedRef.current = true;
  }, [userId, bomLastKey, bomKey]);
  // Persist canvas to cache for quick restore when navigating away and back
  useEffect(() => {
    if (!bomKey) return;
    // Wait for hydration attempt to avoid saving initial empties over existing cache
    if (!hydratedRef.current) return;
    try {
      const payload = JSON.stringify({ nodes, edges });
      localStorage.setItem(bomKey, payload);
      if (bomLastKey) localStorage.setItem(bomLastKey, payload);
    } catch {}
  }, [nodes, edges, bomKey, bomLastKey]);

  // Split layout state (left panel width in %)
  const [leftPercent, setLeftPercent] = useState<number>(() => {
    const raw = localStorage.getItem("split:leftPercent");
    const v = raw ? parseFloat(raw) : 35;
    // allow narrower left pane; keep some margin for both sides
    return isNaN(v) ? 35 : Math.min(90, Math.max(5, v));
  });
  const splitRef = useRef<HTMLDivElement | null>(null);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const onDividerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Ensure the divider receives focus for keyboard control
    try { (e.currentTarget as HTMLDivElement).focus(); } catch {}
    draggingRef.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = splitRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const percent = (px / rect.width) * 100;
      const clamped = Math.min(90, Math.max(5, percent));
      setLeftPercent(clamped);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const clampSplit = (v: number) => Math.min(90, Math.max(5, v));

  const onDividerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Only react when the divider has focus
    if (document.activeElement !== e.currentTarget) return;
    const step = 0.125;
    let next = leftPercent;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      next = clampSplit(leftPercent - step);
      setLeftPercent(next);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next = clampSplit(leftPercent + step);
      setLeftPercent(next);
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = clampSplit(25);
      setLeftPercent(next);
    } else if (e.key === 'End') {
      e.preventDefault();
      next = clampSplit(75);
      setLeftPercent(next);
    }
  };

  // Open save modal and prepare folder list
  const handleSaveBOM = async () => {
    if (!userId) return;
    const result = validateBOM(nodes as any, edges as any);
    if (!result.valid) {
      toast.error(result.error || t('toast.bom.invalid'));
      return;
    }
    try {
      const snap = await getDocs(collection(db, "users", userId, "dossiers"));
      const list = snap.docs.map((d) => ({ id: d.id, nom: (d.data() as any).nom }));
      setAvailableDossiers(list);
      setSelectedSaveDossierId(selectedDossierId ?? (list[0]?.id ?? null));
      setIsModalOpen(true);
    } catch (e) {
      console.error(e);
      toast.error(t('toast.folders.loadError'));
    }
  };

  // Confirm and persist the BOM document
  const confirmSaveBOM = async () => {
    if (!userId) return;
    const trimmedName = (bomName || "").trim();
    if (!selectedSaveDossierId || !trimmedName) return;

    const validation = validateBOM(nodes as any, edges as any);
    if (!validation.valid) {
      toast.error(validation.error || t('toast.bom.invalid'));
      return;
    }

    const bomTree = buildBomFromCanvas();
    if (!bomTree) {
      toast.error(t('toast.bom.missingRoot'));
      return;
    }

    try {
      await addDoc(collection(db, "users", userId, "dossiers", selectedSaveDossierId, "boms"), {
        createdAt: Timestamp.now(),
        nom: trimmedName,
        bom: bomTree,
      });
      toast.success(t('toast.bom.saved'));
      setIsModalOpen(false);
      setSelectedSaveDossierId(null);
      setBomName("");
    } catch (err) {
      console.error(err);
      toast.error(t('toast.bom.saveError'));
    }
  };

  // Import BOM into canvas (merge/replace)
  const applyBomImport = (mode: "replace" | "merge") => {
    if (!pendingImport) return;
    if (mode === "replace") {
      setNodes(pendingImport.nodes as any);
      setEdges(pendingImport.edges as any);
    } else {
      setNodes((prev: any) => [...prev, ...pendingImport.nodes]);
      setEdges((prev: any) => [...prev, ...pendingImport.edges]);
    }
    setPendingImport(null);
    setIsImportModalOpen(false);
  };

  // Persist split size
  useEffect(() => {
    try { localStorage.setItem("split:leftPercent", String(leftPercent)); } catch {}
  }, [leftPercent]);

  // Keyboard delete/backspace removes selected nodes/edges when not editing a field
  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!el || !(el as Element).closest) return false;
      const elem = el as HTMLElement;
      const tag = elem.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (elem.isContentEditable) return true;
      if (elem.closest('[contenteditable="true"]')) return true;
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      const active = document.activeElement;
      if (isEditable(active) || isEditable(e.target)) return;

      e.preventDefault();

      // remove selected edges first
      setEdges((prev) => prev.filter((ed) => !ed.selected));
      // then remove selected nodes and any edges connected to them
      setNodes((prev) => {
        const selectedIds = new Set(prev.filter((n) => n.selected).map((n) => n.id));
        if (selectedIds.size === 0) return prev;
        setEdges((prevEdges) => prevEdges.filter((ed) => !selectedIds.has(ed.source) && !selectedIds.has(ed.target)));
        return prev.filter((n) => !selectedIds.has(n.id));
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setNodes, setEdges]);

  
  // Loading & auth checks
  if (loading) {
    return (
      <>
        <Navbar userDisplay={null} showLogin={true} />
        <p>{t('loading')}</p>
        <Footer />
      </>
    );
  }
  if (!userId || !userEmail) {
    return (
      <>
        <Navbar userDisplay={null} showLogin={true} />
        <Login />
        <Footer />
      </>
    );
  }
  if (!profileComplete) {
    return (
      <>
        <Navbar userDisplay={display} showLogin={false} />
        <CompleteProfile
          uid={userId}
          email={userEmail}
          displayName={displayName}
          onComplete={() => setProfileComplete(true)}
        />
        <Footer />
      </>
    );
  }

  // Main UI
  return (
    <>
      <Navbar userDisplay={display} showLogin={false} />
      <main className="page page--no-bottom-gap">
      <div className="split-layout" ref={splitRef}>
        {/* Left panel: Component form + list */}
        <div
          id="left-panel"
          className="split-left"
          style={{ flex: `0 0 ${leftPercent}%` }}
          onMouseDown={() => dividerRef.current?.blur()}
          tabIndex={-1}
        >
          <div className="component-form-section">
            <ComponentForm
              userId={userId!}
              onSuccess={(updatedComponent) => {
                setEditingComponent(null);

                setNodes((nodes) =>
                  nodes.map((node) => {
                    if (node.data.component.id === updatedComponent.id) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          // Update the component payload in existing nodes with the edited values
                          component: updatedComponent, 
                        },
                      };
                    }
                    return node;
                  })
                );
              }}
              editingComponent={editingComponent}
              onResetEdit={() => setEditingComponent(null)}
            />
          </div>
          <div className="horizontal-divider" />
          <div className="folders-section">
              <DossierManager
                onDossierSelect={setSelectedDossierId}
                selectedDossierId={selectedDossierId}
                userId={userId}
                onEditRequest={(component) => setEditingComponent(component)}
                onDeleteInCanvas={(componentId) => {
                  setNodes((prevNodes) => {
                    const toRemove = new Set(
                      prevNodes
                        .filter((n) => n.data?.component?.id === componentId)
                        .map((n) => n.id)
                    );
                    // Remove edges connected to those nodes
                    setEdges((prevEdges) =>
                      prevEdges.filter(
                        (e) => !toRemove.has(e.source) && !toRemove.has(e.target)
                      )
                    );
                    // Remove the nodes
                    return prevNodes.filter((n) => !toRemove.has(n.id));
                  });
                }}
              />
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="split-divider"
          role="separator"
          aria-orientation="vertical"
          tabIndex={0}
          aria-valuemin={5}
          aria-valuemax={90}
          aria-valuenow={Math.round(leftPercent)}
          aria-controls="left-panel right-panel"
          ref={dividerRef}
          onMouseDown={onDividerDown}
          onKeyDown={onDividerKeyDown}
          title={t('split.resizeHint')}
        />

        {/* Right panel: React Flow BOM Editor */}
        <div
          id="right-panel"
          className="split-right"
          style={{ flex: `0 0 ${100 - leftPercent}%` }}
          onMouseDown={() => dividerRef.current?.blur()}
          tabIndex={-1}
        >
            <ReactFlowProvider>
              <BOMCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                setNodes={setNodes}
                setEdges={setEdges}
                nodeTypes={nodeTypes}
                userId={userId}
                selectedDossierId={selectedDossierId}
                onSaveClick={handleSaveBOM}
                onAskImportChoice={({ nodes, edges }) => {
                  setPendingImport({ nodes, edges });
                  setIsImportModalOpen(true);
                }}
              />
            </ReactFlowProvider>
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                contentLabel={t('modal.saveBom.title')}
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
                  },
                }}
              >
                <h3>{t('modal.saveBom.chooseFolder')}</h3>
                <input
                  type="text"
                  placeholder={t('modal.saveBom.bomName')}
                  value={bomName}
                  onChange={(e) => setBomName(e.target.value)}
                  style={{ width: "100%", marginBottom: "16px", padding: "8px" }}
                />
                <select
                  value={selectedSaveDossierId ?? ""}
                  onChange={(e) => setSelectedSaveDossierId(e.target.value)}
                  style={{ width: "100%", marginBottom: "16px" }}
                >
                  <option value="">{t('modal.saveBom.selectFolder')}</option>
                  {availableDossiers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button onClick={() => setIsModalOpen(false)}>{t('modal.cancel')}</button>
                  <button
                    disabled={!selectedSaveDossierId || !bomName}
                    onClick={confirmSaveBOM}
                    style={{ backgroundColor: "#4caf50", color: "white", padding: "8px 16px" }}
                  >
                    {t('modal.confirm')}
                  </button>
                </div>
              </Modal>
              <Modal
                isOpen={isImportModalOpen}
                onRequestClose={() => {
                  setIsImportModalOpen(false);
                  setPendingImport(null);
                }}
                contentLabel={t('modal.importBom.title')}
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
                <h2 style={{ marginTop: 0, marginBottom: 12 }}>{t('modal.importBom.title')}</h2>
                <p style={{ marginTop: 0, marginBottom: 16 }}>{t('modal.importBom.question')}</p>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setPendingImport(null);
                    }}
                  >
                    {t('modal.cancel')}
                  </button>

                  <button
                    onClick={() => applyBomImport("merge")}
                    style={{ backgroundColor: "#1976d2", color: "white", padding: "8px 16px", borderRadius: 4 }}
                  >
                    {t('modal.importBom.add')}
                  </button>

                  <button
                    onClick={() => applyBomImport("replace")}
                    style={{ backgroundColor: "#d32f2f", color: "white", padding: "8px 16px", borderRadius: 4 }}
                  >
                    {t('modal.importBom.replace')}
                  </button>
                </div>
              </Modal>
        </div>
      </div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    <Footer />
    </>
  );
}
