"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Lock, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { Img } from "@/components/ui/Img";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { useLockBody } from "@/components/ui/useLockBody";
import { money } from "@/lib/format";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

export function CartDrawer() {
  const { items, count, subtotal, drawerOpen, closeDrawer, update, remove } = useCart();
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const pathname = usePathname();

  useLockBody(drawerOpen);

  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    lastFocus.current = document.activeElement;
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  return (
    <div className={`drawer ${drawerOpen ? "is-open" : ""}`} inert={!drawerOpen} aria-hidden={!drawerOpen}>
      <div className="drawer__scrim" onClick={closeDrawer} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer__head">
          <h2 id="drawer-title">
            Your bag <span>{count}</span>
          </h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close bag">
            <X size={20} />
          </button>
        </div>

        {!items.length ? (
          <div className="drawer__empty">
            <div className="drawer__empty-icon">
              <ShoppingBag size={26} />
            </div>
            <h3>Your bag is waiting.</h3>
            <p>Explore thoughtfully selected technology.</p>
            <Link href="/shop" className="btn btn--dark">
              <span>Explore the collection</span> <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__items">
              {items.map((i, idx) => (
                <li key={i.id} className="line-item" style={{ "--i": idx }}>
                  <Link href={`/product/${i.id}`} className="line-item__media">
                    <Img src={i.image} alt={i.name} fill sizes="88px" />
                  </Link>
                  <div className="line-item__body">
                    <Link href={`/product/${i.id}`} className="line-item__name">
                      {i.name}
                    </Link>
                    {i.conditionLabel && <span className="line-item__meta">{i.conditionLabel}</span>}
                    <div className="line-item__row">
                      <QtyStepper
                        size="sm"
                        value={i.qty}
                        max={Math.min(i.stock ?? MAX_QTY_PER_LINE, MAX_QTY_PER_LINE)}
                        onChange={(q) => update(i.id, q)}
                      />
                      <strong>{money(i.price * i.qty)}</strong>
                    </div>
                  </div>
                  <button type="button" className="line-item__remove" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__subtotal">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p>Delivery and final prices confirmed at checkout.</p>
              <Link href="/checkout" className="btn btn--dark btn--block">
                <span>Secure checkout</span> <Lock size={16} />
              </Link>
              <Link href="/cart" className="drawer__link">
                View full bag
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
