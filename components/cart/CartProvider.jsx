"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

const STORAGE_KEY = "lt_cart_v2";
const CartContext = createContext(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Only what the bag UI needs — prices are always re-checked on the server. */
const snapshot = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.image ?? null,
  stock: p.stock,
  category: p.category ?? null,
  conditionLabel: p.conditionLabel ?? null,
});

const maxFor = (item) => Math.max(0, Math.min(item.stock ?? MAX_QTY_PER_LINE, MAX_QTY_PER_LINE));

const LEGACY_KEY = "lt_cart";

function readStorage() {
  try {
    // One-time migration from the previous storefront's cart key.
    if (localStorage.getItem(STORAGE_KEY) == null && localStorage.getItem(LEGACY_KEY) != null) {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY)) || [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy.map((i) => ({ ...snapshot(i), qty: i.qty }))));
      localStorage.removeItem(LEGACY_KEY);
    }
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(parsed))
      return parsed.filter((i) => i && typeof i.id === "string" && Number.isInteger(i.qty) && i.qty > 0);
  } catch {}
  return [];
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [bump, setBump] = useState(0);
  const toastId = useRef(0);

  // Load once, then keep tabs in sync.
  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (toast) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, ...toast }]);
      setTimeout(() => dismissToast(id), toast.duration ?? 4000);
    },
    [dismissToast],
  );

  /** Adds a product. Returns false if nothing could be added (sold out / at max). */
  const add = useCallback(
    (product, qty = 1, { openDrawer = false, toast = true } = {}) => {
      const max = maxFor(product);
      if (max < 1) return false;
      const existing = items.find((i) => i.id === product.id)?.qty ?? 0;
      if (Math.min(existing + qty, max) <= existing) {
        notify({ title: "Maximum quantity reached", description: `${product.name} — ${max} available`, tone: "muted" });
        return false;
      }
      setItems((old) => {
        const found = old.find((i) => i.id === product.id);
        const next = Math.min((found?.qty ?? 0) + qty, max);
        return found
          ? old.map((i) => (i.id === product.id ? { ...snapshot(product), qty: next } : i))
          : [...old, { ...snapshot(product), qty: next }];
      });
      setBump((b) => b + 1);
      if (openDrawer) setDrawerOpen(true);
      else if (toast)
        notify({ title: "Added to your bag", description: product.name, image: product.image, action: "view-bag" });
      return true;
    },
    [items, notify],
  );

  const remove = useCallback((id) => setItems((old) => old.filter((i) => i.id !== id)), []);
  /** Remove several products at once (e.g. the ones just paid for). */
  const removeIds = useCallback((ids) => {
    const drop = new Set(ids);
    setItems((old) => old.filter((i) => !drop.has(i.id)));
  }, []);

  const update = useCallback(
    (id, qty) =>
      setItems((old) =>
        old.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(Math.floor(qty) || 1, maxFor(i))) } : i)),
      ),
    [],
  );

  /** Replace bag contents with server-priced lines (after a quote found changes). */
  const syncFromQuote = useCallback(
    (lines) =>
      setItems((old) =>
        lines.map((l) => {
          const prev = old.find((i) => i.id === l.id) || {};
          return { ...prev, id: l.id, name: l.name, price: l.price, image: l.image ?? prev.image ?? null, stock: l.stock, qty: l.qty };
        }),
      ),
    [],
  );

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
    return {
      items,
      hydrated,
      count,
      subtotal,
      bump,
      add,
      remove,
      removeIds,
      update,
      clear: () => setItems([]),
      syncFromQuote,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      toasts,
      notify,
      dismissToast,
    };
  }, [items, hydrated, bump, add, remove, removeIds, update, syncFromQuote, drawerOpen, toasts, notify, dismissToast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
