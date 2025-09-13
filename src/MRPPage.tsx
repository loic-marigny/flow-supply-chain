import { useEffect, useMemo, useState, Fragment } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import Navbar from "./Navbar";
import { useI18n } from "./i18n/I18nProvider";
import Footer from "./footer";
import Login from "./Login";
import CompleteProfile from "./CompleteProfile";
import { usePageState } from "./state/pageStateContext";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";

/* ===== Types aligned with the Firestore BOMs ===== */
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
  badge_value?: number;     // multiplicity from parent
  children?: BomNode[];
};

type Dossier = { id: string; nom: string };
type BOMDoc = { id: string; nom: string };

/* ====== MRP computation ====== */
type MRPTable = {
  GR: number[];
  SR: number[];
  POH: number[];
  NR: number[];
  POR: number[];
  POL: number[];
  OrderingCost: number[];
  CarryingCost: number[];
  Cost: number[];
  CumulatedCost: number[];
};

// Creates a stable signature of the BOM (only the fields useful for MRP)
function sigFromBom(node: BomNode | null): string {
  if (!node) return "null";
  const pick = (n: BomNode): any => ({
    c: n.component,
    b: n.badge_value ?? 1,
    a: {
      uc: n.attributes?.unit_cost ?? 0,
      oc: n.attributes?.ordering_cost ?? 0,
      cc: n.attributes?.carrying_cost ?? 0,
      oh: n.attributes?.number_on_hand ?? 0,
      lt: n.attributes?.lead_time ?? 0,
      ls: n.attributes?.lot_size ?? 1,
    },
    ch: (n.children ?? []).map(pick), // preserve current order
  });
  try {
    return JSON.stringify(pick(node));
  } catch {
    return String(Math.random());
  }
}


function computeMRPTable(
  comp: BOMAttributes & { name: string },
  planning: number[],
  GR: number[]
): MRPTable {
  const n = planning.length;
  const SR = new Array(n).fill(0);
  const POH = new Array(n).fill(0);
  const NR = new Array(n).fill(0);
  const POR = new Array(n).fill(0);

  const initial = comp.number_on_hand ?? 0;
  for (let i = 0; i < n; i++) {
    const prevPOH = i === 0 ? initial : POH[i - 1];
    const available = prevPOH + SR[i];
    if (available >= GR[i]) {
      NR[i] = 0;
      POR[i] = 0;
      POH[i] = available - GR[i];
    } else {
      NR[i] = GR[i] - available;
      const lot = Math.max(1, comp.lot_size ?? 1);
      POR[i] = Math.ceil(NR[i] / lot) * lot;
      POH[i] = available + POR[i] - GR[i];
    }
  }

  // Offset POR by lead time to obtain POL
  const POL = new Array(n).fill(0);
  const lt = Math.max(1, comp.lead_time ?? 1);
  for (let i = 0; i < n; i++) {
    const period = planning[i];
    const releasePeriod = period - lt;
    const j = planning.indexOf(releasePeriod);
    if (j >= 0) POL[j] += POR[i];
  }

  const OrderingCost = new Array(n).fill(0);
  const CarryingCost = new Array(n).fill(0);
  const Cost = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    if (POR[i] > 0) OrderingCost[i] = comp.ordering_cost ?? 0;
    CarryingCost[i] = (comp.carrying_cost ?? 0) * (POH[i] ?? 0);
    Cost[i] =
      OrderingCost[i] + (comp.unit_cost ?? 0) * (POR[i] ?? 0) + CarryingCost[i];
  }

  const CumulatedCost = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    CumulatedCost[i] = (i === 0 ? 0 : CumulatedCost[i - 1]) + Cost[i];
  }

  return { GR, SR, POH, NR, POR, POL, OrderingCost, CarryingCost, Cost, CumulatedCost };
}

function getMaxTotalLeadTime(node: BomNode): number {
  const here = Math.max(1, node.attributes.lead_time ?? 1);
  if (!node.children?.length) return here;
  return here + Math.max(...node.children.map((ch) => getMaxTotalLeadTime(ch)));
}

type MRPResultEntry = {
  table: MRPTable;
  on_hand: number;
  lead_time: number;
  substructure: Array<[string, number]>;
};
type MRPResult = {
  results: Record<string, MRPResultEntry>;
  planning_periods: number[];
};

function getSubstructure(node: BomNode): Array<[string, number]> {
  return (node.children ?? [])
    .map((c) => [c.component, c.badge_value ?? 1] as [string, number])
    .sort((a, b) => a[0].localeCompare(b[0]));
}

function traversalOrderTopDown(root: BomNode | null): string[] {
  if (!root) return [];
  const seen = new Set<string>();
  const order: string[] = [];
  const queue: BomNode[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    if (!seen.has(node.component)) {
      seen.add(node.component);
      order.push(node.component);
    }
    for (const ch of node.children ?? []) queue.push(ch);
  }
  return order; // root -> ... -> leaves
}



function computeMRPRecursive(
  node: BomNode,
  GR: number[],
  planning: number[],
  out: Record<string, MRPResultEntry>
) {
  const name = node.component;
  const attrs = node.attributes;

  if (out[name]) {
    // Already computed: sum GR, recompute table, propagate diff to children
    const old = out[name];
    const oldGR = old.table.GR;
    const newGR = oldGR.map((v, i) => v + (GR[i] ?? 0));
    const newTable = computeMRPTable({ name, ...attrs }, planning, newGR);
    const diffPOL = newTable.POL.map((v, i) => v - old.table.POL[i]);

    out[name] = {
      table: newTable,
      on_hand: attrs.number_on_hand ?? 0,
      lead_time: attrs.lead_time ?? 1,
      substructure: getSubstructure(node),
    };

    for (const child of node.children ?? []) {
      const mult = child.badge_value ?? 1;
      const childDiffGR = diffPOL.map((v) => v * mult);
      computeMRPRecursive(child, childDiffGR, planning, out);
    }
  } else {
    // first pass
    const table = computeMRPTable({ name, ...attrs }, planning, GR);
    out[name] = {
      table,
      on_hand: attrs.number_on_hand ?? 0,
      lead_time: attrs.lead_time ?? 1,
      substructure: getSubstructure(node),
    };
    for (const child of node.children ?? []) {
      const mult = child.badge_value ?? 1;
      const childGR = table.POL.map((v) => v * mult);
      computeMRPRecursive(child, childGR, planning, out);
    }
  }
}

/* ================= Page ================= */
// MRP computation UI and logic based on a BOM from Firestore.
export default function MRPPage() {
  const { t } = useI18n();
  /* ----- Auth + profil ----- */
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userNomPrenom, setUserNomPrenom] = useState<{ prenom: string; nom: string } | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const { getMRP, setMRP } = usePageState();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setUserEmail(u.email ?? null);
        setDisplayName(u.displayName ?? null);
      } else {
        setUserId(null); setUserEmail(null); setDisplayName(null);
        setUserNomPrenom(null); setProfileComplete(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setUserNomPrenom(null); setProfileComplete(false); return; }
      const d = snap.data() as any;
      const prenom = (d?.prenom ?? "").trim(), nom = (d?.nom ?? "").trim();
      const ok = prenom.length > 0 && nom.length > 0;
      setUserNomPrenom(ok ? { prenom, nom } : null);
      setProfileComplete(ok);
    });
    return () => unsub();
  }, [userId]);

  const display =
    (userNomPrenom ? `${userNomPrenom.prenom} ${userNomPrenom.nom}` : null) ??
    displayName ?? userEmail ?? null;

  /* ----- File / BOM Selection ----- */
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [boms, setBoms] = useState<BOMDoc[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [bomTree, setBomTree] = useState<BomNode | null>(null);

  const bomDisplayOrder = useMemo(
    () => traversalOrderTopDown(bomTree),
    [bomTree]
    );


  useEffect(() => {
    if (!userId) return;
    const ref = collection(db, "users", userId, "dossiers");
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, nom: (d.data() as any).nom }));
      setDossiers(list);
      if (!selectedDossierId && list.length) setSelectedDossierId(list[0].id);
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedDossierId) { setBoms([]); setSelectedBomId(null); setBomTree(null); return; }
    const ref = collection(db, "users", userId, "dossiers", selectedDossierId, "boms");
    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, nom: (d.data() as any).nom }));
      setBoms(list);
      if (!selectedBomId && list.length) setSelectedBomId(list[0].id);
    });
    return () => unsub();
  }, [userId, selectedDossierId]);

  useEffect(() => {
    if (!userId || !selectedDossierId || !selectedBomId) { setBomTree(null); return; }
    (async () => {
      const ref = doc(db, "users", userId, "dossiers", selectedDossierId, "boms", selectedBomId);
      const snap = await getDoc(ref);
      setBomTree((snap.data() as any)?.bom ?? null);
    })();
  }, [userId, selectedDossierId, selectedBomId]);

  /* ----- MRP Orders ----- */
  const [numOrders, setNumOrders] = useState<number>(1);
  const [orders, setOrders] = useState<Array<{ offset?: string; demand: string }>>([{ demand: "100" }]);

  const orderTimesPreview = useMemo(() => {
    // t0 = 0, then cumulative of entered offsets
    const times: number[] = [0];
    for (let i = 1; i < orders.length; i++) {
        const off = parseInt(orders[i].offset || "0", 10) || 0;
        times.push(times[i - 1] - off);
    }
    return times;
    }, [orders]);

    const stateKey = useMemo(() => {
        if (!userId || !selectedDossierId || !selectedBomId) return null;
        return `${userId}:${selectedDossierId}:${selectedBomId}`;
        }, [userId, selectedDossierId, selectedBomId]);

  useEffect(() => {
    setOrders((prev) => {
      const next = [...prev];
      while (next.length < numOrders) next.push({ offset: "1", demand: "50" });
      while (next.length > numOrders) next.pop();
      if (numOrders >= 1) delete next[0].offset;
      return next;
    });
  }, [numOrders]);

  useEffect(() => {
    if (!stateKey || !bomTree) return;
    const sig = sigFromBom(bomTree);
    const cached = getMRP(stateKey);
    if (cached && cached.bomSig === sig) {
        // Reload the user's state as they left it
        setOrders(cached.orders);
        setNumOrders(cached.numOrders);
        setMrp(cached.mrp);
    } else {
        // BOM changed → invalidate the result (keep input values)
        setMrp(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stateKey, bomTree]);

    useEffect(() => {
        if (!stateKey || !bomTree) return;
        const existing = getMRP(stateKey);
        setMRP(stateKey, {
            orders,
            numOrders,
            mrp: existing?.mrp ?? null,
            bomSig: sigFromBom(bomTree),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [orders, numOrders]);

  const useAlphaOrders = () => {
    setNumOrders(3);
    setOrders([{ demand: "100" }, { offset: "2", demand: "50" }, { offset: "3", demand: "50" }]);
  };
  const useSkateOrders = () => {
    setNumOrders(4);
    setOrders([
      { demand: "900" },
      { offset: "3", demand: "800" },
      { offset: "2", demand: "700" },
      { offset: "1", demand: "600" },
    ]);
  };

  /* ----- Calcul MRP ----- */
  const [mrp, setMrp] = useState<MRPResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function computeNow() {
    setError(null);
    if (!bomTree) { setMrp(null); return; }

    // 1) order_times / final_demands
    const orderTimes: number[] = [0];
    const finalDemands: number[] = [];
    try {
      const d0 = parseInt(orders[0].demand || "0", 10);
      if (!Number.isFinite(d0)) throw new Error();
      finalDemands.push(d0);
      for (let i = 1; i < orders.length; i++) {
        const off = parseInt(orders[i].offset || "0", 10);
        const dem = parseInt(orders[i].demand || "0", 10);
        if (!Number.isFinite(off) || !Number.isFinite(dem)) throw new Error();
        const newT = orderTimes[orderTimes.length - 1] - off;
        orderTimes.push(newT);
        finalDemands.push(dem);
      }
    } catch {
      setError("Offsets et demandes doivent être des entiers.");
      return;
    }

    // 2) planning periods (from horizon_start to 0, inclusive)
    const earliest = Math.min(...orderTimes);
    const horizonStart = earliest - getMaxTotalLeadTime(bomTree);
    const planning: number[] = [];
    for (let t = horizonStart; t <= 0; t++) planning.push(t);

    // 3) GR of the final product
    const GR_final = planning.map((p) => {
      const idx = orderTimes.indexOf(p);
      return idx >= 0 ? finalDemands[idx] : 0;
    });

    // 4) Recursive MRP
    const out: Record<string, MRPResultEntry> = {};
    computeMRPRecursive(bomTree, GR_final, planning, out);

    setMrp({ results: out, planning_periods: planning });
    // After setMrp({ results: out, planning_periods: planning });
    if (stateKey) {
    setMRP(stateKey, {
        orders: orders,
        numOrders: numOrders,
        mrp: { results: out, planning_periods: planning },
        bomSig: sigFromBom(bomTree),
    });
    }
  }

  const exportMRPToExcel = () => {
    if (!mrp) return;

    // Name of the BOM (for the file name)
    const bomName =
        boms.find(b => b.id === selectedBomId)?.nom ??
        "MRP";

    // 1) Workbook
    const wb = XLSXUtils.book_new();

    // 2) Components Order = top-down order from the BOM if available,
    //    otherwise alphabetical fallback
    const componentOrder = (bomDisplayOrder?.length
        ? bomDisplayOrder
        : Object.keys(mrp.results).sort((a, b) => a.localeCompare(b))
    ).filter(name => mrp.results[name]); // security

    // 3) For each component, create a sheet
    for (const compName of componentOrder) {
        const entry = mrp.results[compName];
        const tbl = entry.table;

        // Column headers
        const header = ["Metric", ...mrp.planning_periods.map(p => `t=${p}`)];

        // Base data
        const rows: (string | number)[][] = [
        ["Gross Requirements", ...tbl.GR],
        ["Scheduled Receipts", ...tbl.SR],
        ["Projected On Hand",  ...tbl.POH],
        ["Net Requirements",   ...tbl.NR],
        ["Planned Order Receipt",  ...tbl.POR],
        ["Planned Order Releases", ...tbl.POL],
        ];

        // Cost data
        rows.push(
        ["Ordering Cost",  ...tbl.OrderingCost],
        ["Carrying Cost",  ...tbl.CarryingCost],
        ["Cost",           ...tbl.Cost],
        ["Cumulated Costs",...tbl.CumulatedCost],
        );

        const aoa = [header, ...rows];
        const ws = XLSXUtils.aoa_to_sheet(aoa);

        // Columns width (a bit more for "Metric")
        ws["!cols"] = [{ wch: 22 }, ...mrp.planning_periods.map(() => ({ wch: 10 }))];

        // Add to workbook (sheet name <= 31 characters)
        const safeName = compName.length <= 31 ? compName : compName.slice(0, 31);
        XLSXUtils.book_append_sheet(wb, ws, safeName);
    }

    // 4) Write the file
    const stamp = new Date().toISOString().slice(0,10);
    const filename = `${bomName}_MRP_${stamp}.xlsx`;
    XLSXWriteFile(wb, filename);
    };


  /* ----- Rendering (after hooks !) ----- */
  if (loading) {
    return (
      <>
        <Navbar userDisplay={null} showLogin={true} />
        <main className="page"><h2>{t('loading')}</h2></main>
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
          onComplete={() => {}}
        />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar userDisplay={display} showLogin={false} />
      <main className="page">
        <div className="eoq-container">
          <div className="eoq-form mrp-selectors">
            <label>
                {t('form.folder')}
                <select
                value={selectedDossierId ?? ""}
                onChange={(e) => { setSelectedDossierId(e.target.value || null); setSelectedBomId(null); }}
                style={{ marginLeft: 8 }}
                >
                {dossiers.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
            </label>

            <label>
                BOM
                <select
                value={selectedBomId ?? ""}
                onChange={(e) => setSelectedBomId(e.target.value || null)}
                style={{ marginLeft: 8 }}
                >
                {boms.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </select>
            </label>
            </div>

          {/* Orders */}
          <div className="table-wrapper" style={{ padding: 12 }}>
            <div className="orders-toolbar">
              <label>
                {t('mrp.orders.count')}
                <select
                  value={numOrders}
                  onChange={(e) => setNumOrders(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ marginLeft: 8 }}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>

              <button type="button" onClick={useAlphaOrders}>{t('mrp.btn.useAlpha')}</button>
              <button type="button" onClick={useSkateOrders}>{t('mrp.btn.useSkate')}</button>
              <button type="button" onClick={computeNow} style={{ marginLeft: "auto" }}>{t('mrp.btn.compute')}</button>
              <button type="button" onClick={exportMRPToExcel}
                    disabled={!mrp} style={{ marginLeft: 8 }} title={mrp ? t('mrp.export.title') : t('mrp.export.disabled')}>
                    {t('mrp.btn.export')}
              </button>
            </div>
            <div
                className="order-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "100px 80px 180px 160px", // Order | t= | Offset | Demand (inputs)
                    gap: 10,
                    alignItems: "center",
                }}
                >
                {/* ---- Headers ---- */}
                <div className="order-grid__th">{t('mrp.order.order')}</div>
                <div className="order-grid__th">{t('mrp.order.t')}</div>
                <div className="order-grid__th">{t('mrp.order.offset')}</div>
                <div className="order-grid__th">{t('mrp.order.demand')}</div>

                {/* end headers : small separator */}
                <div className="order-grid__sep" style={{ gridColumn: "1 / -1" }}></div>

                {/* ---- Input rows ---- */}
                {orders.map((row, i) => (
                    <Fragment key={i}>
                    {/* Col 1 : Order N */}
                    <div className="col-order" style={{ opacity: 0.7 }}>
                       Order {i + 1}
                    </div>

                    {/* Col 2 : t = cumulated */}
                    <div className="col-time">
                       t = {orderTimesPreview[i]}
                    </div>

                    {/* Col 3 : Offset (empty for Order 1) */}
                    {i === 0 ? (
                        <div aria-hidden="true" />
                    ) : (
                        <input
                        value={row.offset ?? ""}
                        onChange={(e) => {
                            const v = e.target.value.replace(/[^\d]/g, "");
                            setOrders((prev) => {
                            const n = [...prev];
                            n[i] = { ...n[i], offset: v };
                            return n;
                            });
                        }}
                        className="order-input order-input--offset"
                        placeholder={t('mrp.order.offset')}
                        aria-label={t('mrp.order.offset.aria', { index: i + 1 })}
                        />
                    )}

                    {/* Col 4 : Demand (input) */}
                    <input
                        value={row.demand}
                        onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        setOrders((prev) => {
                            const n = [...prev];
                            n[i] = { ...n[i], demand: v };
                            return n;
                        });
                        }}
                        className="order-input order-input--demand"
                        placeholder={t('mrp.order.demand')}
                    />
                    </Fragment>
                ))}
                </div>

            {error ? <div style={{ color: "crimson", marginTop: 8 }}>{error}</div> : null}
          </div>

          {/* Results */}
          {mrp ? (
            <>
              {(() => {
                const names = Object.keys(mrp.results);
                const idx = new Map(bomDisplayOrder.map((n, i) => [n, i]));
                const namesSorted = [...names].sort((a, b) => {
                    const ia = idx.get(a); const ib = idx.get(b);
                    if (ia === undefined && ib === undefined) return a.localeCompare(b);
                    if (ia === undefined) return 1;
                    if (ib === undefined) return -1;
                    return ia - ib; // root first, leaves last
                });
                return namesSorted.map((name) => {
                    const tbl = mrp.results[name].table;
                    const cols = mrp.planning_periods.map((p) => `t=${p}`);
                    const row = (label: string, values: number[]) => (
                    <tr>
                        <td>{label}</td>
                        {values.map((v, i) => (
                        <td key={i}>{Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        ))}
                    </tr>
                    );
                    return (
                    <div key={name} className="table-wrapper" style={{ marginTop: 16 }}>
                        <h3 style={{ margin: "8px 12px" }}>{name}</h3>
                        <table className="table table--eoq">
                        <thead>
                            <tr>
                            <th>{t('mrp.metric')}</th>
                            {cols.map((c) => <th key={c}>{c}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {row(t('mrp.rows.gross'), tbl.GR)}
                            {row(t('mrp.rows.scheduled'), tbl.SR)}
                            {row(t('mrp.rows.onHand'), tbl.POH)}
                            {row(t('mrp.rows.net'), tbl.NR)}
                            {row(t('mrp.rows.por'), tbl.POR)}
                            {row(t('mrp.rows.pol'), tbl.POL)}
                            {row(t('mrp.rows.orderingCost'), tbl.OrderingCost)}
                            {row(t('mrp.rows.carryingCost'), tbl.CarryingCost)}
                            {row(t('mrp.rows.cost'), tbl.Cost)}
                            {row(t('mrp.rows.cumulated'), tbl.CumulatedCost)}
                        </tbody>
                        </table>
                    </div>
                    );
                });
                })()}

            </>
          ) : (
            <div className="table-wrapper" style={{ textAlign: "center" }}>
              <em>{t('mrp.instructions')}</em>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
