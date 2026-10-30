"use client";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

export function ProductActions({ product }) {
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const [state, setState] = useState("idle");
  const inBag = items.find((i) => i.id === product.id)?.qty ?? 0;
  const max = Math.max(0, Math.min(product.stock, MAX_QTY_PER_LINE) - inBag);
  const soldOut = product.stock < 1;

  function onAdd() {
    if (add(product, Math.min(qty, Math.max(max, 1)), { openDrawer: true })) {
      setState("added");
      setQty(1);
      setTimeout(() => setState("idle"), 1800);
    }
  }

  if (soldOut)
    return (
      <div className="buy-box">
        <button className="btn btn--dark btn--block" disabled>
          <span>Sold out</span>
        </button>
      </div>
    );

  return (
    <div className="buy-box">
      <QtyStepper value={Math.min(qty, Math.max(max, 1))} max={Math.max(max, 1)} onChange={setQty} />
      <button
        type="button"
        className={`btn btn--dark btn--grow ${state === "added" ? "is-success" : ""}`}
        onClick={onAdd}
        disabled={max < 1}
      >
        {state === "added" ? (
          <>
            <span>Added to bag</span> <Check size={18} />
          </>
        ) : max < 1 ? (
          <span>All available stock is in your bag</span>
        ) : (
          <>
            <span>Add to bag</span> <ShoppingBag size={18} />
          </>
        )}
      </button>
    </div>
  );
}
