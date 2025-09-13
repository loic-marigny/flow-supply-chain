import { useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { collection, doc, getDoc, onSnapshot, } from "firebase/firestore";
import Navbar from "./Navbar";
import { useI18n } from "./i18n/I18nProvider";
import Footer from "./footer";
import Login from "./Login";
import CompleteProfile from "./CompleteProfile";
import { usePageState } from "./state/pageStateContext";

type BOMAttributes = {
  unit_cost: number;
  ordering_cost: number;
  carrying_cost: number;
  number_on_hand: number;
  lead_time: number;
  lot_size: number;
};

type BomNode = {
  component: string;
  componentId?: string;
  attributes: BOMAttributes;
  badge_value?: number;
  children?: BomNode[];
};

type Dossier = { id: string; nom: string };
type BOMDoc = { id: string; nom: string };

// EOQ computation UI based on a BOM from Firestore.
export default function EOQPage() {
  const { t } = useI18n();
  // ---- Auth & profile ----
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userNomPrenom, setUserNomPrenom] = useState<{ prenom: string; nom: string } | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setUserEmail(u.email ?? null);
        setDisplayName(u.displayName ?? null);
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

  const display =
    (userNomPrenom ? `${userNomPrenom.prenom} ${userNomPrenom.nom}` : null) ??
    displayName ??
    userEmail ??
    null;

  // ---- EOQ UI state ----
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);

  const [boms, setBoms] = useState<BOMDoc[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);

  const { get, set } = usePageState();

  // Simple re-hydration from the _last cache key
  useEffect(() => {
    if (!userId) return;
    const cached = get<{
      selectedDossierId: string | null;
      selectedBomId: string | null;
      annualDemandInput: string;
    }>(`eoq:${userId}:_last`);
    if (cached) {
      if (cached.annualDemandInput != null) setAnnualDemandInput(cached.annualDemandInput);
      setSelectedDossierId(cached.selectedDossierId ?? null);
      setSelectedBomId(cached.selectedBomId ?? null);
    }
  }, [userId, get]);


   const [annualDemandInput, setAnnualDemandInput] = useState<string>("1000");
   const annualDemand = useMemo(() => {
     const n = parseInt(annualDemandInput, 10);
     return Number.isFinite(n) ? n : 0;
   }, [annualDemandInput]);
  const [bomTree, setBomTree] = useState<BomNode | null>(null);

  type EOQRow = {
    name: string;
    demand: number;
    unit_cost: number;
    ordering_cost: number;
    carrying_cost: number;
    eoq: number;
    ordersPerYear: number;
    timeBetween: number;
  };

  const [resultRows, setResultRows] = useState<EOQRow[]>([]);

  const eoqKeyCurrent = useMemo(() => {
      if (!userId) return null;
      return `eoq:${userId}:${selectedDossierId ?? ""}:${selectedBomId ?? ""}`;
    }, [userId, selectedDossierId, selectedBomId]);
    const eoqKeyLast = useMemo(() => {
      if (!userId) return null;
      return `eoq:${userId}:_last`;
    }, [userId]);


  // Load the files
  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "dossiers");
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, nom: (d.data() as any).nom }));
      setDossiers(list);
    });
    return () => unsub();
    // deps :
  }, [userId]);

  // Load BOMs for the selected folder
  useEffect(() => {
    if (!userId || !selectedDossierId) {
      setBoms([]); setSelectedBomId(null); setBomTree(null);
      return;
    }
    const ref = collection(db, "users", userId, "dossiers", selectedDossierId, "boms");
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, nom: (d.data() as any).nom }));
      setBoms(list);
    });
    return () => unsub();
  }, [userId, selectedDossierId]);


      // ---- EOQ Computing ----

  /** Compute annual demand per component by traversing the BOM tree. */
  function computeAnnualDemands(root: BomNode, finalAnnual: number) {
    const demands = new Map<string, number>();
    const attrs = new Map<string, BOMAttributes>(); // attributes per component

    const stack: Array<{ node: BomNode; demand: number }> = [{ node: root, demand: finalAnnual }];
    while (stack.length) {
      const { node, demand } = stack.pop()!;
      const name = node.component;
      demands.set(name, (demands.get(name) ?? 0) + demand);
      if (!attrs.has(name)) attrs.set(name, node.attributes);

      const children = node.children ?? [];
      for (const child of children) {
        const mult = typeof child.badge_value === "number" ? child.badge_value : 1;
        stack.push({ node: child, demand: demand * mult });
      }
    }
    return { demands, attrs };
  }

  function calcEOQ(d: number, oc: number, cc: number) {
    if (d <= 0 || oc <= 0 || cc <= 0) return { eoq: 0, ordersPerYear: 0, timeBetween: 0 };
    const eoq = Math.sqrt((2 * d * oc) / cc);
    const ordersPerYear = d / eoq;
    const timeBetween = 200 / ordersPerYear; // 200 worked days / year
    return { eoq, ordersPerYear, timeBetween };
  }

  const recomputeEOQ = useCallback((tree?: BomNode) => {
    const t = tree ?? bomTree;
    // Guard clause
    if (!t || annualDemand <= 0) {
      setResultRows([]);
      return;
    }

    const { demands, attrs } = computeAnnualDemands(t, annualDemand);

    const rows: EOQRow[] = [];
    demands.forEach((d, name) => {
      const a = attrs.get(name)!;
      const { eoq, ordersPerYear, timeBetween } = calcEOQ(
        d,
        a.ordering_cost ?? 0,
        a.carrying_cost ?? 0
      );

      rows.push({
        name,
        demand: d,
        unit_cost: a.unit_cost ?? 0,
        ordering_cost: a.ordering_cost ?? 0,
        carrying_cost: a.carrying_cost ?? 0,
        eoq,
        ordersPerYear,
        timeBetween,
      });
    });

    const rootName = t.component;
    rows.sort((r1, r2) => {
      if (r1.name === rootName) return -1;
      if (r2.name === rootName) return 1;
      return r1.name.localeCompare(r2.name);
    });

    setResultRows(rows);
  }, [bomTree, annualDemand]);


  // Load the selected BOM tree (robust to navigation back-and-forth)
  useEffect(() => {
    let cancelled = false;

    if (!userId || !selectedDossierId || !selectedBomId) {
      setBomTree(null);
      setResultRows([]);
      return;
    }

    (async () => {
      const ref = doc(db, "users", userId, "dossiers", selectedDossierId, "boms", selectedBomId);
      const snap = await getDoc(ref);
      if (cancelled) return;

      const tree = ((snap.data() as any)?.bom) ?? null;
      setBomTree(tree);

      // Recompute immediately if everything is ready (e.g., on page return)
      const demand = Number(annualDemandInput);
      if (tree && Number.isFinite(demand) && demand > 0) {
        recomputeEOQ(tree);
      } else {
        setResultRows([]);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, selectedDossierId, selectedBomId, annualDemandInput, recomputeEOQ]);


  // Safety net: if selections are ready but bomTree is still null, refetch once
  useEffect(() => {
    if (!userId || !selectedDossierId || !selectedBomId) return;
    if (bomTree) return;

    (async () => {
      const ref = doc(db, "users", userId, "dossiers", selectedDossierId, "boms", selectedBomId);
      const snap = await getDoc(ref);
      const data = ((snap.data() as any)?.bom) ?? null;
      if (data) setBomTree(data);
    })();

  // Do not put `bomTree` in deps to avoid a loop; this effect stops once bomTree is non-null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedDossierId, selectedBomId]);


  // If a folder is selected and we don't have a controlled value for the BOM yet,
  // force the first option as the value (avoids UI with an option shown but empty value).
  useEffect(() => {
    if (!selectedDossierId) return;
    if (!selectedBomId && boms.length > 0) {
      setSelectedBomId(boms[0].id);
    }
  }, [selectedDossierId, selectedBomId, boms, setSelectedBomId]);

  useEffect(() => {
    if (!userId) return;
    const payload = { selectedDossierId, selectedBomId, annualDemandInput };
    // Always update the "last state"
    if (eoqKeyLast) set(eoqKeyLast, payload);
    // And the specific key when it exists
    if (eoqKeyCurrent) set(eoqKeyCurrent, payload);
  }, [userId, eoqKeyLast, eoqKeyCurrent, selectedDossierId, selectedBomId, annualDemandInput, set]);


  // If a folder is selected and we don't have a controlled
  // value for the BOM yet, force the 1st option as the value.
  useEffect(() => {
    if (!selectedDossierId) return;
    if (!selectedBomId || selectedBomId === "") {
      if (boms.length > 0) {
        setSelectedBomId(boms[0].id);
      }
    }
  }, [selectedDossierId, selectedBomId, boms, setSelectedBomId]);



  // Recompute as soon as everything is ready (page return, reloaded selections, etc.)
  useEffect(() => {
    const demand = Number(annualDemandInput);
    const ready =
      !!userId &&
      !!selectedDossierId &&
      !!selectedBomId &&
      !!bomTree &&
      Number.isFinite(demand) &&
      demand > 0;

    if (ready) {
      recomputeEOQ();
    }
  }, [userId, selectedDossierId, selectedBomId, bomTree, annualDemandInput, recomputeEOQ]);


  useEffect(() => {
    const onVisible = () => {
      const demand = Number(annualDemandInput);
      if (document.visibilityState === "visible" && bomTree && Number.isFinite(demand) && demand > 0) {
        recomputeEOQ();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [bomTree, annualDemandInput, recomputeEOQ]);


  // Folder : if the cache ID doesn't exist anymore, or if there isn't one, take the 1st
  useEffect(() => {
    if (dossiers.length === 0) return;
    if (selectedDossierId && dossiers.some(d => d.id === selectedDossierId)) return;
    setSelectedDossierId(dossiers[0].id);
  }, [dossiers, selectedDossierId]);

  // BOM: same idea, depends on the selected folder
  useEffect(() => {
    if (!selectedDossierId) return;      // waiting for a selected folder
    if (boms.length === 0) return;
    if (selectedBomId && boms.some(b => b.id === selectedBomId)) return;
    setSelectedBomId(boms[0].id);
  }, [selectedDossierId, boms, selectedBomId]);


    if (loading) {
      return (
        <>
          <Navbar userDisplay={null} showLogin={true} />
          <main className="page"><h2>Chargement…</h2></main>
          <Footer />
        </>
      );
    }
    if (!userId || !userEmail) return (
      <>
        <Navbar userDisplay={null} showLogin={true} />
        <Login />
        <Footer />
      </>
    );
    if (!profileComplete) return (
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
    
  return (
    <>
      <Navbar userDisplay={display} showLogin={false} />

      <main className="page eoq-page">
        <div className="eoq-vertical">
          <div className="eoq-container">
            <div className="eoq-form mrp-selectors">
              <label>
                {t('form.folder')}
                <select
                  value={selectedDossierId ?? ""}
                  onChange={(e) => { setSelectedDossierId(e.target.value || null); setSelectedBomId(null); }}
                  style={{ marginLeft: 8 }}
                >
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </label>

              <label>
                BOM
                <select
                  value={selectedBomId ?? ""}
                  onChange={(e) => setSelectedBomId(e.target.value || null)}
                  style={{ marginLeft: 8 }}
                >
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>{b.nom}</option>
                  ))}
                </select>
              </label>

              <label style={{ gridColumn: "1 / span 2" }}>
                {t('eoq.annualDemandLabel')}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={annualDemandInput}
                  onChange={(e) => {
                    // Keep only digits; allow empty string while editing
                    const v = e.target.value.replace(/[^\d]/g, "");
                    setAnnualDemandInput(v);
                  }}
                  onBlur={() => {
                    if (annualDemandInput.trim() === "") setAnnualDemandInput("0");
                  }}
                  placeholder={t('eoq.placeholder.annualDemand')}
                  style={{ marginLeft: 8, width: 140 }}
                />
              </label>
            </div>

          {/* Results */}
          <div className="table-wrapper">
            <table className="table table--eoq">
              <thead>
                <tr>
                  <th>{t('eoq.col.name')}</th>
                  <th>{t('eoq.col.annualDemand')}</th>
                  <th>{t('eoq.col.unitCost')}</th>
                  <th>{t('eoq.col.orderingCost')}</th>
                  <th>{t('eoq.col.carryingCost')}</th>
                  <th>{t('eoq.col.eoq')}</th>
                  <th>{t('eoq.col.ordersPerYear')}</th>
                  <th>{t('eoq.col.timeBetween')}</th>
                </tr>
              </thead>
              <tbody>
                {resultRows.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{r.demand.toLocaleString()}</td>
                    <td>{r.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{r.ordering_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{r.carrying_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{r.eoq.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{r.ordersPerYear.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{r.timeBetween.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {(!userId || !selectedDossierId || !selectedBomId || !bomTree || annualDemand <= 0) && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 12, opacity: 0.7 }}>
                      Sélectionnez un dossier et un BOM, puis indiquez la demande annuelle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{ fontWeight: 700, color: '#000', marginTop: 12, textAlign: 'center' }}>
            {t('eoq.note.workingDays')}
          </p>
        </div>
      </div>
      </main>
      <Footer />
    </>
  );
}
