// src/state/pageStateContext.tsx
// Lightweight in-memory page state cache with MRP-specific helpers.
import { createContext, useContext, useMemo, useRef } from "react";

/** ----- MRP (already in place) ----- */
type OrdersRow = { offset?: string; demand: string };
export type CachedMRP = {
  orders: OrdersRow[];
  numOrders: number;
  mrp: any | null;
  bomSig: string;
};

/** ----- Generic context API ----- */
type PageStateCtx = {
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, value: T): void;
  clear: (key?: string) => void;

  /** Back-compat MRP (existing calls keep working) */
  getMRP: (key: string) => CachedMRP | undefined;
  setMRP: (key: string, value: CachedMRP) => void;
};

const Ctx = createContext<PageStateCtx | null>(null);

export function PageStateProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<Map<string, unknown>>(new Map());

  const api: PageStateCtx = useMemo(() => ({
    get: <T,>(key: string) => storeRef.current.get(key) as T | undefined,
    set: <T,>(key: string, value: T) => { storeRef.current.set(key, value); },
    clear: (key?: string) => {
      if (!key) storeRef.current.clear();
      else storeRef.current.delete(key);
    },

    // Back-compat MRP
    getMRP: (key) => storeRef.current.get(key) as CachedMRP | undefined,
    setMRP: (key, value) => { storeRef.current.set(key, value); },
  }), []);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePageState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePageState must be used within PageStateProvider");
  return ctx;
}
